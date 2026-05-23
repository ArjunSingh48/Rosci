import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Create demo patient
    const { data: patientAuth, error: patientErr } = await admin.auth.admin.createUser({
      email: "patient@demo.rosci.app",
      password: "demo123456",
      email_confirm: true,
      user_metadata: { full_name: "Arjun Patel" },
    });
    if (patientErr && !patientErr.message.includes("already been registered")) throw patientErr;

    // Create demo doctor
    const { data: doctorAuth, error: doctorErr } = await admin.auth.admin.createUser({
      email: "doctor@demo.rosci.app",
      password: "demo123456",
      email_confirm: true,
      user_metadata: { full_name: "Dr. Sarah Chen" },
    });
    if (doctorErr && !doctorErr.message.includes("already been registered")) throw doctorErr;

    const patientId = patientAuth?.user?.id;
    const doctorId = doctorAuth?.user?.id;

    if (patientId) {
      // Update profile
      await admin.from("profiles").update({
        full_name: "Arjun Patel",
        rehab_weeks: 6,
        injury_level: "T6",
        pain_level: 4,
        mood_level: 4,
        onboarding_completed: true,
      }).eq("id", patientId);

      // Set role
      await admin.from("user_roles").upsert({ user_id: patientId, role: "patient" }, { onConflict: "user_id,role" });

      // Seed check-ins
      const moods = ["great", "okay", "bad", "great", "okay", "great", "okay"] as const;
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        await admin.from("check_ins").insert({
          patient_id: patientId,
          mood: moods[i],
          note: i === 0 ? "Feeling optimistic today!" : null,
          created_at: date.toISOString(),
        });
      }

      // Seed medical reports
      await admin.from("medical_reports").insert([
        { patient_id: patientId, original_file_url: null, simplified_summary: "Your MRI shows stable healing at the T6 level. The swelling has reduced significantly compared to last month. Continue with your current exercise routine.", status: "approved" },
        { patient_id: patientId, original_file_url: null, simplified_summary: "Blood work looks good. Vitamin D levels are slightly low - consider taking a supplement. All other markers are within normal range.", status: "approved" },
        { patient_id: patientId, original_file_url: null, status: "pending" },
      ]);

      // Seed exercise videos
      const exercises = ["Quad Sets", "Ankle Pumps", "Leg Raises", "Quad Sets", "Ankle Pumps"];
      for (const name of exercises) {
        await admin.from("exercise_videos").insert({
          patient_id: patientId,
          exercise_name: name,
          video_url: null,
          doctor_feedback: name === "Quad Sets" ? "Great form! Try holding for 2 more seconds next time." : null,
        });
      }

      // Seed notifications
      await admin.from("notifications").insert([
        { user_id: patientId, type: "report", content: "Your MRI report has been reviewed by Dr. Chen.", is_read: true },
        { user_id: patientId, type: "feedback", content: "Dr. Chen left feedback on your Quad Sets video.", is_read: false },
        { user_id: patientId, type: "reminder", content: "Don't forget your daily check-in!", is_read: false },
      ]);
    }

    if (doctorId) {
      await admin.from("profiles").update({ full_name: "Dr. Sarah Chen" }).eq("id", doctorId);
      await admin.from("user_roles").upsert({ user_id: doctorId, role: "doctor" }, { onConflict: "user_id,role" });

      // Assign patient to doctor
      if (patientId) {
        await admin.from("doctor_patients").upsert(
          { doctor_id: doctorId, patient_id: patientId },
          { onConflict: "doctor_id,patient_id" }
        );
      }
    }

    return new Response(JSON.stringify({ success: true, patientId, doctorId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
