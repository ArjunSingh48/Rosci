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

    const { patient_id, scan_file_url, scan_type } = await req.json();

    if (!patient_id || !scan_file_url) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save MRI scan metadata
    const { data: scan, error: scanError } = await supabase
      .from("mri_scans")
      .insert({ patient_id, scan_file_url, scan_type: scan_type || "mri" })
      .select()
      .single();

    if (scanError) throw scanError;

    // Create placeholder AI analysis job
    const { error: analysisError } = await supabase
      .from("ai_analysis_results")
      .insert({
        patient_id,
        input_type: "MRI",
        ai_model_name: "spine-vision-v1-placeholder",
        result_json: { status: "queued", message: "Analysis will begin when AI module is connected" },
        confidence_score: 0,
      });

    if (analysisError) console.error("Analysis job creation failed:", analysisError);

    return new Response(JSON.stringify({ scan, message: "MRI scan uploaded and queued for analysis" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
