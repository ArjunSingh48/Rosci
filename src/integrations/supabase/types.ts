export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_analysis_results: {
        Row: {
          ai_model_name: string | null
          confidence_score: number | null
          created_at: string
          id: string
          input_type: string
          patient_id: string
          result_json: Json | null
        }
        Insert: {
          ai_model_name?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_type?: string
          patient_id: string
          result_json?: Json | null
        }
        Update: {
          ai_model_name?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_type?: string
          patient_id?: string
          result_json?: Json | null
        }
        Relationships: []
      }
      ai_spine_analysis: {
        Row: {
          analysis_status: Database["public"]["Enums"]["analysis_status"]
          confidence_score: number | null
          created_at: string
          detected_injury_region: string | null
          id: string
          image_id: string
          mobility_recovery_probability: number | null
          nerve_damage_probability: number | null
          patient_id: string
        }
        Insert: {
          analysis_status?: Database["public"]["Enums"]["analysis_status"]
          confidence_score?: number | null
          created_at?: string
          detected_injury_region?: string | null
          id?: string
          image_id: string
          mobility_recovery_probability?: number | null
          nerve_damage_probability?: number | null
          patient_id: string
        }
        Update: {
          analysis_status?: Database["public"]["Enums"]["analysis_status"]
          confidence_score?: number | null
          created_at?: string
          detected_injury_region?: string | null
          id?: string
          image_id?: string
          mobility_recovery_probability?: number | null
          nerve_damage_probability?: number | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_spine_analysis_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "medical_images"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          description: string
          icon: string
          id: string
          key: string
          name: string
          points_required: number
        }
        Insert: {
          category?: string
          description: string
          icon: string
          id?: string
          key: string
          name: string
          points_required?: number
        }
        Update: {
          category?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          points_required?: number
        }
        Relationships: []
      }
      blog_feedback: {
        Row: {
          article_key: string
          created_at: string
          id: string
          response: string
          user_id: string
        }
        Insert: {
          article_key: string
          created_at?: string
          id?: string
          response: string
          user_id: string
        }
        Update: {
          article_key?: string
          created_at?: string
          id?: string
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      chatbot_qa: {
        Row: {
          answer: string
          id: string
          keyword: string
        }
        Insert: {
          answer: string
          id?: string
          keyword: string
        }
        Update: {
          answer?: string
          id?: string
          keyword?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          created_at: string
          energy_level: string | null
          id: string
          mood: Database["public"]["Enums"]["mood_type"]
          motivation_level: number | null
          note: string | null
          pain_level: number | null
          patient_id: string
        }
        Insert: {
          created_at?: string
          energy_level?: string | null
          id?: string
          mood: Database["public"]["Enums"]["mood_type"]
          motivation_level?: number | null
          note?: string | null
          pain_level?: number | null
          patient_id: string
        }
        Update: {
          created_at?: string
          energy_level?: string | null
          id?: string
          mood?: Database["public"]["Enums"]["mood_type"]
          motivation_level?: number | null
          note?: string | null
          pain_level?: number | null
          patient_id?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_tasks_log: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          id: string
          patient_id: string
          skipped: boolean
          task_category: Database["public"]["Enums"]["task_category"]
          task_name: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          patient_id: string
          skipped?: boolean
          task_category: Database["public"]["Enums"]["task_category"]
          task_name: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          patient_id?: string
          skipped?: boolean
          task_category?: Database["public"]["Enums"]["task_category"]
          task_name?: string
        }
        Relationships: []
      }
      daily_tips: {
        Row: {
          content: string
          id: string
          rehab_week_max: number | null
          rehab_week_min: number | null
          tip_type: Database["public"]["Enums"]["tip_type"]
        }
        Insert: {
          content: string
          id?: string
          rehab_week_max?: number | null
          rehab_week_min?: number | null
          tip_type: Database["public"]["Enums"]["tip_type"]
        }
        Update: {
          content?: string
          id?: string
          rehab_week_max?: number | null
          rehab_week_min?: number | null
          tip_type?: Database["public"]["Enums"]["tip_type"]
        }
        Relationships: []
      }
      doctor_patients: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: []
      }
      exercise_library: {
        Row: {
          category: string
          difficulty: string
          duration_minutes: number
          equipment_needed: string | null
          id: string
          instructions: Json
          is_bite_sized: boolean
          muscle_groups: string[] | null
          name: string
          parent_exercise_id: string | null
          purpose: string
          sort_order: number
        }
        Insert: {
          category: string
          difficulty?: string
          duration_minutes?: number
          equipment_needed?: string | null
          id?: string
          instructions?: Json
          is_bite_sized?: boolean
          muscle_groups?: string[] | null
          name: string
          parent_exercise_id?: string | null
          purpose: string
          sort_order?: number
        }
        Update: {
          category?: string
          difficulty?: string
          duration_minutes?: number
          equipment_needed?: string | null
          id?: string
          instructions?: Json
          is_bite_sized?: boolean
          muscle_groups?: string[] | null
          name?: string
          parent_exercise_id?: string | null
          purpose?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_library_parent_exercise_id_fkey"
            columns: ["parent_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_videos: {
        Row: {
          ai_analysis_status: string | null
          created_at: string
          doctor_feedback: string | null
          exercise_name: string
          id: string
          patient_id: string
          video_url: string | null
        }
        Insert: {
          ai_analysis_status?: string | null
          created_at?: string
          doctor_feedback?: string | null
          exercise_name: string
          id?: string
          patient_id: string
          video_url?: string | null
        }
        Update: {
          ai_analysis_status?: string | null
          created_at?: string
          doctor_feedback?: string | null
          exercise_name?: string
          id?: string
          patient_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      intensity_choices: {
        Row: {
          choice: Database["public"]["Enums"]["intensity_type"]
          created_at: string
          date: string
          id: string
          patient_id: string
        }
        Insert: {
          choice: Database["public"]["Enums"]["intensity_type"]
          created_at?: string
          date?: string
          id?: string
          patient_id: string
        }
        Update: {
          choice?: Database["public"]["Enums"]["intensity_type"]
          created_at?: string
          date?: string
          id?: string
          patient_id?: string
        }
        Relationships: []
      }
      medical_images: {
        Row: {
          created_at: string
          id: string
          image_type: Database["public"]["Enums"]["image_type"]
          image_url: string
          patient_id: string
          spinal_region: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_type: Database["public"]["Enums"]["image_type"]
          image_url: string
          patient_id: string
          spinal_region?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          image_type?: Database["public"]["Enums"]["image_type"]
          image_url?: string
          patient_id?: string
          spinal_region?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      medical_reports: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          original_file_url: string | null
          patient_id: string
          simplified_summary: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          original_file_url?: string | null
          patient_id: string
          simplified_summary?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          original_file_url?: string | null
          patient_id?: string
          simplified_summary?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          mood: Database["public"]["Enums"]["mood_log_type"]
          note: string | null
          patient_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mood: Database["public"]["Enums"]["mood_log_type"]
          note?: string | null
          patient_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mood?: Database["public"]["Enums"]["mood_log_type"]
          note?: string | null
          patient_id?: string
        }
        Relationships: []
      }
      mri_scans: {
        Row: {
          ai_analysis_status: string | null
          created_at: string
          id: string
          patient_id: string
          scan_date: string
          scan_file_url: string
          scan_type: string | null
        }
        Insert: {
          ai_analysis_status?: string | null
          created_at?: string
          id?: string
          patient_id: string
          scan_date?: string
          scan_file_url: string
          scan_type?: string | null
        }
        Update: {
          ai_analysis_status?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          scan_date?: string
          scan_file_url?: string
          scan_type?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          created_at: string
          date: string
          hydration_ml: number | null
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes: string | null
          patient_id: string
          protein_intake: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          hydration_ml?: number | null
          id?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          patient_id: string
          protein_intake?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          hydration_ml?: number | null
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          patient_id?: string
          protein_intake?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          doctor_id: string | null
          doctor_key: string | null
          email: string | null
          full_name: string
          id: string
          injury_date: string | null
          injury_level: string | null
          mood_level: number | null
          notes: string | null
          onboarding_completed: boolean | null
          pain_level: number | null
          rehab_weeks: number | null
          rehabilitation_stage: string | null
          spinal_region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          doctor_key?: string | null
          email?: string | null
          full_name?: string
          id: string
          injury_date?: string | null
          injury_level?: string | null
          mood_level?: number | null
          notes?: string | null
          onboarding_completed?: boolean | null
          pain_level?: number | null
          rehab_weeks?: number | null
          rehabilitation_stage?: string | null
          spinal_region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          doctor_key?: string | null
          email?: string | null
          full_name?: string
          id?: string
          injury_date?: string | null
          injury_level?: string | null
          mood_level?: number | null
          notes?: string | null
          onboarding_completed?: boolean | null
          pain_level?: number | null
          rehab_weeks?: number | null
          rehabilitation_stage?: string | null
          spinal_region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recovery_goals: {
        Row: {
          created_at: string
          goal_summary: string
          goal_text: string
          id: string
          intensity: string
          status: string
          timeframe_months: number
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_summary: string
          goal_text: string
          id?: string
          intensity?: string
          status?: string
          timeframe_months: number
          user_id: string
        }
        Update: {
          created_at?: string
          goal_summary?: string
          goal_text?: string
          id?: string
          intensity?: string
          status?: string
          timeframe_months?: number
          user_id?: string
        }
        Relationships: []
      }
      recovery_metrics: {
        Row: {
          exercise_consistency_score: number | null
          id: string
          mental_health_score: number | null
          mobility_score: number | null
          nutrition_score: number | null
          overall_recovery_index: number | null
          patient_id: string
          sleep_quality_score: number | null
          task_completion_rate: number | null
          updated_at: string
        }
        Insert: {
          exercise_consistency_score?: number | null
          id?: string
          mental_health_score?: number | null
          mobility_score?: number | null
          nutrition_score?: number | null
          overall_recovery_index?: number | null
          patient_id: string
          sleep_quality_score?: number | null
          task_completion_rate?: number | null
          updated_at?: string
        }
        Update: {
          exercise_consistency_score?: number | null
          id?: string
          mental_health_score?: number | null
          mobility_score?: number | null
          nutrition_score?: number | null
          overall_recovery_index?: number | null
          patient_id?: string
          sleep_quality_score?: number | null
          task_completion_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rehabilitation_sessions: {
        Row: {
          created_at: string
          exercise_date: string
          exercise_type: string
          id: string
          notes: string | null
          patient_id: string
          performance_score: number | null
        }
        Insert: {
          created_at?: string
          exercise_date?: string
          exercise_type: string
          id?: string
          notes?: string | null
          patient_id: string
          performance_score?: number | null
        }
        Update: {
          created_at?: string
          exercise_date?: string
          exercise_type?: string
          id?: string
          notes?: string | null
          patient_id?: string
          performance_score?: number | null
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          created_at: string
          date: string
          hours: number
          id: string
          notes: string | null
          patient_id: string
          quality: Database["public"]["Enums"]["sleep_quality"]
        }
        Insert: {
          created_at?: string
          date?: string
          hours: number
          id?: string
          notes?: string | null
          patient_id: string
          quality?: Database["public"]["Enums"]["sleep_quality"]
        }
        Update: {
          created_at?: string
          date?: string
          hours?: number
          id?: string
          notes?: string | null
          patient_id?: string
          quality?: Database["public"]["Enums"]["sleep_quality"]
        }
        Relationships: []
      }
      specialists: {
        Row: {
          clinic_address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          specialization: string
        }
        Insert: {
          clinic_address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          specialization: string
        }
        Update: {
          clinic_address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          specialization?: string
        }
        Relationships: []
      }
      spine_models: {
        Row: {
          created_at: string
          id: string
          model_url: string | null
          patient_id: string
          recovery_stage: string | null
          spinal_region: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          model_url?: string | null
          patient_id: string
          recovery_stage?: string | null
          spinal_region?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          model_url?: string | null
          patient_id?: string
          recovery_stage?: string | null
          spinal_region?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          current_streak: number
          id: string
          last_check_in_date: string | null
          level: number
          longest_streak: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_check_in_date?: string | null
          level?: number
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_check_in_date?: string | null
          level?: number
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      analysis_status: "pending" | "processing" | "completed" | "failed"
      app_role: "patient" | "doctor" | "admin"
      image_type: "mri" | "ct" | "xray" | "scan"
      intensity_type: "increase" | "maintain" | "lighter"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      mood_log_type: "happy" | "neutral" | "low" | "struggling"
      mood_type: "great" | "okay" | "bad"
      report_status: "pending" | "approved"
      sleep_quality: "poor" | "fair" | "good" | "excellent"
      task_category:
        | "rehabilitation"
        | "massage"
        | "nutrition"
        | "mental_wellness"
      tip_type: "nutrition" | "rehab" | "mindfulness"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analysis_status: ["pending", "processing", "completed", "failed"],
      app_role: ["patient", "doctor", "admin"],
      image_type: ["mri", "ct", "xray", "scan"],
      intensity_type: ["increase", "maintain", "lighter"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      mood_log_type: ["happy", "neutral", "low", "struggling"],
      mood_type: ["great", "okay", "bad"],
      report_status: ["pending", "approved"],
      sleep_quality: ["poor", "fair", "good", "excellent"],
      task_category: [
        "rehabilitation",
        "massage",
        "nutrition",
        "mental_wellness",
      ],
      tip_type: ["nutrition", "rehab", "mindfulness"],
    },
  },
} as const
