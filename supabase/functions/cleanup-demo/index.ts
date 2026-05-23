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

    // Find demo user IDs
    const { data: users } = await admin.auth.admin.listUsers();
    const patientUser = users?.users?.find((u) => u.email === "patient@demo.rosci.app");
    const doctorUser = users?.users?.find((u) => u.email === "doctor@demo.rosci.app");

    const patientId = patientUser?.id;
    const doctorId = doctorUser?.id;

    if (!patientId && !doctorId) {
      return new Response(JSON.stringify({ success: true, message: "No demo users found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const demoIds = [patientId, doctorId].filter(Boolean) as string[];

    // Clean patient_id-based tables
    const patientTables = [
      "check_ins", "daily_tasks_log", "mood_logs", "nutrition_logs", "sleep_logs",
      "intensity_choices", "exercise_videos", "medical_reports", "rehabilitation_sessions",
      "recovery_metrics", "mri_scans", "medical_images", "ai_analysis_results", "ai_spine_analysis",
      "spine_models",
    ];
    for (const table of patientTables) {
      await admin.from(table).delete().in("patient_id", demoIds);
    }

    // Clean user_id-based tables
    const userTables = [
      "notifications", "community_posts", "community_comments", "community_likes",
      "blog_feedback", "user_badges", "user_gamification",
    ];
    for (const table of userTables) {
      await admin.from(table).delete().in("user_id", demoIds);
    }

    // Re-seed baseline demo data
    if (patientId) {
      // Reset profile
      await admin.from("profiles").update({
        full_name: "Arjun Patel",
        rehab_weeks: 6,
        injury_level: "T6",
        pain_level: 4,
        mood_level: 4,
        onboarding_completed: true,
      }).eq("id", patientId);

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
        { patient_id: patientId, original_file_url: null, simplified_summary: "Your MRI shows stable healing at the T6 level. The swelling has reduced significantly compared to last month.", status: "approved" },
        { patient_id: patientId, original_file_url: null, simplified_summary: "Blood work looks good. Vitamin D levels are slightly low - consider taking a supplement.", status: "approved" },
        { patient_id: patientId, original_file_url: null, status: "pending" },
      ]);

      // Seed exercise videos
      for (const name of ["Quad Sets", "Ankle Pumps", "Leg Raises"]) {
        await admin.from("exercise_videos").insert({
          patient_id: patientId,
          exercise_name: name,
          video_url: null,
          doctor_feedback: name === "Quad Sets" ? "Great form! Try holding for 2 more seconds." : null,
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
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
