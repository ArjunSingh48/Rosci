
-- Add spinal_region to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spinal_region text;

-- Create enums
CREATE TYPE public.mood_log_type AS ENUM ('happy', 'neutral', 'low', 'struggling');
CREATE TYPE public.intensity_type AS ENUM ('increase', 'maintain', 'lighter');
CREATE TYPE public.task_category AS ENUM ('rehabilitation', 'massage', 'nutrition', 'mental_wellness');
CREATE TYPE public.sleep_quality AS ENUM ('poor', 'fair', 'good', 'excellent');
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- daily_tasks_log
CREATE TABLE public.daily_tasks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  task_name text NOT NULL,
  task_category task_category NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  skipped boolean NOT NULL DEFAULT false,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_tasks_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can insert own tasks" ON public.daily_tasks_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own tasks" ON public.daily_tasks_log FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Patients can update own tasks" ON public.daily_tasks_log FOR UPDATE TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient tasks" ON public.daily_tasks_log FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'doctor') AND EXISTS (
    SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = daily_tasks_log.patient_id
  )
);

-- sleep_logs
CREATE TABLE public.sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  hours numeric(3,1) NOT NULL,
  quality sleep_quality NOT NULL DEFAULT 'fair',
  notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can insert own sleep" ON public.sleep_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own sleep" ON public.sleep_logs FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient sleep" ON public.sleep_logs FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'doctor') AND EXISTS (
    SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = sleep_logs.patient_id
  )
);

-- nutrition_logs
CREATE TABLE public.nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  meal_type meal_type NOT NULL,
  protein_intake numeric(5,1),
  hydration_ml integer,
  notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can insert own nutrition" ON public.nutrition_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own nutrition" ON public.nutrition_logs FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient nutrition" ON public.nutrition_logs FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'doctor') AND EXISTS (
    SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = nutrition_logs.patient_id
  )
);

-- mood_logs
CREATE TABLE public.mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  mood mood_log_type NOT NULL,
  note text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can insert own mood" ON public.mood_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own mood" ON public.mood_logs FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient mood" ON public.mood_logs FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'doctor') AND EXISTS (
    SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = mood_logs.patient_id
  )
);

-- intensity_choices
CREATE TABLE public.intensity_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  choice intensity_type NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(patient_id, date)
);
ALTER TABLE public.intensity_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can insert own intensity" ON public.intensity_choices FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own intensity" ON public.intensity_choices FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient intensity" ON public.intensity_choices FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'doctor') AND EXISTS (
    SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = intensity_choices.patient_id
  )
);

-- community_posts
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view posts" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- community_likes
CREATE TABLE public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view likes" ON public.community_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert likes" ON public.community_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.community_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- community_comments
CREATE TABLE public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view comments" ON public.community_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.community_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- specialists
CREATE TABLE public.specialists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialization text NOT NULL,
  clinic_address text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view specialists" ON public.specialists FOR SELECT TO authenticated USING (true);
