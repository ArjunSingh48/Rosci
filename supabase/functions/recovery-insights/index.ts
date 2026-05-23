import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather patient metrics
    const [tasksRes, sleepRes, nutritionRes, moodRes] = await Promise.all([
      supabase.from("daily_tasks_log").select("completed").eq("patient_id", user.id),
      supabase.from("sleep_logs").select("hours, quality").eq("patient_id", user.id).order("date", { ascending: false }).limit(14),
      supabase.from("nutrition_logs").select("protein_intake, hydration_ml").eq("patient_id", user.id).order("date", { ascending: false }).limit(14),
      supabase.from("mood_logs").select("mood").eq("patient_id", user.id).order("date", { ascending: false }).limit(14),
    ]);

    const tasks = tasksRes.data ?? [];
    const taskCompletionRate = tasks.length > 0
      ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)
      : 0;

    const sleepLogs = sleepRes.data ?? [];
    const avgSleep = sleepLogs.length > 0
      ? sleepLogs.reduce((s, l) => s + Number(l.hours), 0) / sleepLogs.length
      : 0;

    const moodMap: Record<string, number> = { happy: 4, neutral: 3, low: 2, struggling: 1 };
    const moodLogs = moodRes.data ?? [];
    const avgMood = moodLogs.length > 0
      ? moodLogs.reduce((s, l) => s + (moodMap[l.mood] || 0), 0) / moodLogs.length
      : 0;

    return new Response(
      JSON.stringify({
        task_completion_rate: taskCompletionRate,
        avg_sleep_hours: Math.round(avgSleep * 10) / 10,
        avg_mood_score: Math.round(avgMood * 10) / 10,
        nutrition_entries: (nutritionRes.data ?? []).length,
        ai_analysis_available: false,
        message: "AI recovery trajectory will appear here as more data is collected.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
