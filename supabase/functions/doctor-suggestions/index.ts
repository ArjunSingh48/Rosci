import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { patientId, mode = "suggestions" } = await req.json();
    if (!patientId) return new Response(JSON.stringify({ error: "patientId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Fetch patient context
    const [profileR, tasksR, sessionsR, sleepR, checksR, goalsR] = await Promise.all([
      supabase.from("profiles").select("full_name, rehab_weeks, injury_level, pain_level, rehabilitation_stage").eq("id", patientId).single(),
      supabase.from("daily_tasks_log").select("completed, skipped, task_category, created_at").eq("patient_id", patientId).order("created_at", { ascending: false }).limit(60),
      supabase.from("rehabilitation_sessions").select("exercise_type, performance_score, exercise_date").eq("patient_id", patientId).order("exercise_date", { ascending: false }).limit(20),
      supabase.from("sleep_logs").select("hours, date").eq("patient_id", patientId).order("date", { ascending: false }).limit(14),
      supabase.from("check_ins").select("mood, pain_level, motivation_level, created_at").eq("patient_id", patientId).order("created_at", { ascending: false }).limit(14),
      supabase.from("recovery_goals").select("goal_summary, timeframe_months, intensity, created_at").eq("user_id", patientId),
    ]);

    const tasks = tasksR.data ?? [];
    const adherence = tasks.length ? Math.round((tasks.filter((t: any) => t.completed).length / tasks.length) * 100) : 0;
    const sessions = sessionsR.data ?? [];
    const avgPerf = sessions.length ? (sessions.reduce((a: number, s: any) => a + (s.performance_score ?? 0), 0) / sessions.length).toFixed(1) : "n/a";
    const sleepLogs = sleepR.data ?? [];
    const avgSleep = sleepLogs.length ? (sleepLogs.reduce((a: number, s: any) => a + Number(s.hours), 0) / sleepLogs.length).toFixed(1) : "n/a";
    const checks = checksR.data ?? [];
    const avgPain = checks.filter((c: any) => c.pain_level != null).length ? (checks.reduce((a: number, c: any) => a + (c.pain_level ?? 0), 0) / checks.length).toFixed(1) : "n/a";
    const avgMot = checks.filter((c: any) => c.motivation_level != null).length ? (checks.reduce((a: number, c: any) => a + (c.motivation_level ?? 0), 0) / checks.length).toFixed(1) : "n/a";

    const context = `Patient context:
- Name: ${profileR.data?.full_name}
- Rehab week: ${profileR.data?.rehab_weeks}
- Injury level: ${profileR.data?.injury_level}
- Stage: ${profileR.data?.rehabilitation_stage}
- Adherence (last 60 logs): ${adherence}%
- Avg session performance (last 20): ${avgPerf}/10
- Avg sleep (14d): ${avgSleep}h
- Avg pain (14d): ${avgPain}/10
- Avg motivation (14d): ${avgMot}/10
- Active goals: ${(goalsR.data ?? []).map((g: any) => `"${g.goal_summary}" (${g.timeframe_months}mo, ${g.intensity})`).join("; ") || "none"}
- Recent skipped categories: ${[...new Set(tasks.filter((t: any) => t.skipped).map((t: any) => t.task_category))].slice(0, 5).join(", ") || "none"}`;

    if (mode === "summary") {
      const sumRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a clinical rehab analyst. Reply with ONE concise sentence (max 30 words) summarizing the patient's current trajectory and key concern. No diagnoses." },
            { role: "user", content: context },
          ],
        }),
      });
      if (!sumRes.ok) {
        if (sumRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (sumRes.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI gateway error");
      }
      const sd = await sumRes.json();
      return new Response(JSON.stringify({ summary: sd.choices?.[0]?.message?.content ?? "Patient data is being analyzed." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // suggestions mode — structured tool call
    const suggRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a clinical rehab decision-support assistant. Suggest 2-4 evidence-based, conservative adjustments to a patient's rehab plan based on the data. Always include reasoning that cites specific metrics. Never make medical diagnoses." },
          { role: "user", content: `${context}\n\nGenerate adjustment suggestions. Each must include a clear action and reasoning grounded in the metrics above.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_adjustments",
            description: "Return clinical adjustment suggestions for the patient",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short headline, e.g. 'Reduce intensity'" },
                      action: { type: "string", description: "Concrete action sentence (max 25 words)" },
                      reasoning: { type: "string", description: "Why this is suggested, citing 1-2 specific metrics" },
                      urgency: { type: "string", enum: ["low", "medium", "high"] },
                    },
                    required: ["title", "action", "reasoning", "urgency"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_adjustments" } },
      }),
    });

    if (!suggRes.ok) {
      if (suggRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (suggRes.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await suggRes.text();
      console.error("suggestions AI error:", suggRes.status, t);
      throw new Error("AI gateway error");
    }
    const sd = await suggRes.json();
    const toolCall = sd.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions: any[] = [];
    if (toolCall?.function?.arguments) {
      try { suggestions = JSON.parse(toolCall.function.arguments).suggestions ?? []; } catch { suggestions = []; }
    }
    return new Response(JSON.stringify({ suggestions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("doctor-suggestions error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
