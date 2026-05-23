import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rehab_weeks, streak, total_points, tasks_completed, avg_mood, mode, recovery_score, top_goal } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isProjection = mode === "projection";

    const prompt = isProjection
      ? `You are a supportive rehabilitation coach for a spinal cord injury patient. Based on the data below, generate a forward-looking projection. NO medical claims.

Patient Data:
- Weeks in rehab: ${rehab_weeks ?? 0}
- Current streak: ${streak ?? 0} days
- Recovery score: ${recovery_score ?? "n/a"}/100
- Tasks completed: ${tasks_completed ?? 0}
- Top goal: ${top_goal ?? "general recovery"}

Output JSON with two keys:
- short_term: 1-2 sentence outlook for the next 1-2 weeks
- mid_term: 1-2 sentence projection toward the top goal (mention rough weeks if pace continues)

Keep it warm, conditional ("if you maintain..."), and never make medical claims.`
      : `You are a rehabilitation AI assistant for spinal cord injury patients. Based on this patient data, provide a brief, encouraging recovery prediction in 2-3 sentences. Be specific but optimistic.

Patient Data:
- Weeks in rehab: ${rehab_weeks ?? 0}
- Current streak: ${streak ?? 0} days
- Total points earned: ${total_points ?? 0}
- Tasks completed: ${tasks_completed ?? 0}
- Average mood: ${avg_mood ?? "neutral"}

Provide:
1. A trend observation based on their data
2. A specific prediction for the next 2-4 weeks
3. An encouraging note

Keep it warm, personal, and under 80 words.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: isProjection ? "You are a supportive rehab coach. Reply ONLY with valid JSON. No medical claims." : "You are a supportive rehabilitation AI. Respond concisely and encouragingly." },
          { role: "user", content: prompt },
        ],
        ...(isProjection ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    if (isProjection) {
      let projection: any = { short_term: "Keep your pace this week.", mid_term: "Steady progress will get you there." };
      try { projection = { ...projection, ...JSON.parse(content) }; } catch { /* keep fallback */ }
      return new Response(JSON.stringify({ projection }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prediction = content || "Keep up your great work! Your consistency is building a strong recovery foundation.";
    return new Response(JSON.stringify({ prediction }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recovery-prediction error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
