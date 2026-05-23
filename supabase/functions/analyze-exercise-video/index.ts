import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { patient_id, video_id } = await req.json();

    if (!patient_id || !video_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update video analysis status
    await supabase
      .from("exercise_videos")
      .update({ ai_analysis_status: "queued" })
      .eq("id", video_id);

    // Create placeholder AI analysis result
    const { data, error } = await supabase
      .from("ai_analysis_results")
      .insert({
        patient_id,
        input_type: "exercise_video",
        ai_model_name: "movement-tracker-v1-placeholder",
        result_json: { status: "queued", video_id, message: "Video analysis will begin when AI module is connected" },
        confidence_score: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ result: data, message: "Video queued for AI analysis" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
