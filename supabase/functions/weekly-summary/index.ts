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

    const { patientId } = await req.json();
    if (!patientId) return new Response(JSON.stringify({ error: "patientId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [profileR, tasksR, sessionsR, sleepR, checksR, goalsR, videosR] = await Promise.all([
      supabase.from("profiles").select("full_name, rehab_weeks, injury_level, rehabilitation_stage").eq("id", patientId).single(),
      supabase.from("daily_tasks_log").select("completed, skipped, task_category, created_at").eq("patient_id", patientId).gte("created_at", weekAgo),
      supabase.from("rehabilitation_sessions").select("exercise_type, performance_score, exercise_date, notes").eq("patient_id", patientId).gte("exercise_date", weekAgo.slice(0, 10)),
      supabase.from("sleep_logs").select("hours, date").eq("patient_id", patientId).gte("date", weekAgo.slice(0, 10)),
      supabase.from("check_ins").select("mood, pain_level, motivation_level, created_at").eq("patient_id", patientId).gte("created_at", weekAgo),
      supabase.from("recovery_goals").select("goal_summary, timeframe_months").eq("user_id", patientId),
      supabase.from("exercise_videos").select("exercise_name, created_at").eq("patient_id", patientId).gte("created_at", weekAgo),
    ]);

    const tasks = tasksR.data ?? [];
    const adherence = tasks.length ? Math.round((tasks.filter((t: any) => t.completed).length / tasks.length) * 100) : 0;
    const skipped = tasks.filter((t: any) => t.skipped).length;
    const sessions = sessionsR.data ?? [];
    const avgPerf = sessions.length ? (sessions.reduce((a: number, s: any) => a + (s.performance_score ?? 0), 0) / sessions.length).toFixed(1) : "n/a";
    const sleep = sleepR.data ?? [];
    const avgSleep = sleep.length ? (sleep.reduce((a: number, s: any) => a + Number(s.hours), 0) / sleep.length).toFixed(1) : "n/a";
    const checks = checksR.data ?? [];
    const avgPain = checks.filter((c: any) => c.pain_level != null).length ? (checks.reduce((a: number, c: any) => a + (c.pain_level ?? 0), 0) / checks.length).toFixed(1) : "n/a";
    const avgMot = checks.filter((c: any) => c.motivation_level != null).length ? (checks.reduce((a: number, c: any) => a + (c.motivation_level ?? 0), 0) / checks.length).toFixed(1) : "n/a";

    const dataBrief = `Weekly data for ${profileR.data?.full_name} (Week ${profileR.data?.rehab_weeks}, ${profileR.data?.injury_level}, ${profileR.data?.rehabilitation_stage}):
- Tasks: ${tasks.length} logged, ${adherence}% completed, ${skipped} skipped
- Sessions: ${sessions.length} (avg performance ${avgPerf}/10)
- Sleep: avg ${avgSleep}h
- Pain: avg ${avgPain}/10
- Motivation: avg ${avgMot}/10
- Videos uploaded: ${(videosR.data ?? []).length}
- Active goals: ${(goalsR.data ?? []).map((g: any) => `"${g.goal_summary}"`).join(", ") || "none"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a clinical rehab analyst writing a structured weekly summary for a treating physician. Use plain text with section headers in CAPS. Be specific, factual, no fluff. No diagnoses." },
          { role: "user", content: `${dataBrief}\n\nGenerate a weekly clinical summary with these exact sections: PROGRESS, ADHERENCE, CONCERNS, RECOMMENDATIONS. Each section: 2-4 short bullets prefixed with "- ".` },
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }
    const d = await res.json();
    const summary = `WEEKLY CLINICAL SUMMARY — ${profileR.data?.full_name}\nGenerated: ${new Date().toLocaleDateString()}\n\n${d.choices?.[0]?.message?.content ?? "Summary unavailable."}`;
    return new Response(JSON.stringify({ summary }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("weekly-summary error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
