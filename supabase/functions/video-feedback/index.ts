import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Comparison mode: doctor side-by-side analysis
    if (body?.mode === "comparison") {
      const { exerciseName = "exercise", weeksBetween = 0 } = body;
      const compPrompt = `A spinal cord injury rehab patient has two videos of "${exerciseName}", recorded approximately ${weeksBetween} weeks apart.

Without claiming to see the videos, write a 3-4 sentence clinical comparison framed as encouragement and possible focus areas. Mention typical progress markers for this exercise (form, control, endurance, symmetry) without making medical claims. End with one suggestion for the doctor to verify visually.`;

      const compRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a clinical rehab assistant. Avoid diagnoses. Be concise and practical." },
            { role: "user", content: compPrompt },
          ],
        }),
      });
      if (!compRes.ok) {
        if (compRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (compRes.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const cd = await compRes.json();
      const text = cd.choices?.[0]?.message?.content ?? "Comparison unavailable.";
      return new Response(JSON.stringify({ comparison: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const {
      exercise_name = "exercise",
      videos_count = 1,
      avg_score = null,
      latest_score = null,
      days_since_first = 0,
    } = body ?? {};

    const userPrompt = `A spinal cord injury rehabilitation patient has uploaded a video.
Context:
- Exercise: ${exercise_name}
- Total videos uploaded: ${videos_count}
- Days since first video: ${days_since_first}
- Average performance score: ${avg_score ?? "n/a"}
- Latest performance score: ${latest_score ?? "n/a"}

Generate 3 short, encouraging qualitative observations (one sentence each):
1. An "improvement observation" framed positively
2. A "consistency note"
3. A "next focus" suggestion (gentle, achievable)

STRICT RULES:
- No medical claims, diagnoses, or prognoses.
- No claims about what the video shows visually (you cannot see it).
- Frame as encouragement based on the data above.
- Keep each line under 18 words.
- Output as a JSON object with keys: improvement, consistency, next_focus.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a supportive rehab coach. You never give medical advice. Reply ONLY with valid JSON." },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const feedback = {
      improvement: parsed.improvement ?? "Every video uploaded is a meaningful step forward.",
      consistency: parsed.consistency ?? "Keep showing up — that's where progress lives.",
      next_focus: parsed.next_focus ?? "Try one extra rep next time if it feels right.",
    };

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("video-feedback error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
