
-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS injury_date date,
  ADD COLUMN IF NOT EXISTS rehabilitation_stage text DEFAULT 'early',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS doctor_id uuid;

-- Add ai_analysis_status to exercise_videos
ALTER TABLE public.exercise_videos
  ADD COLUMN IF NOT EXISTS ai_analysis_status text DEFAULT 'none';

-- Create rehabilitation_sessions table
CREATE TABLE IF NOT EXISTS public.rehabilitation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  exercise_type text NOT NULL,
  exercise_date date NOT NULL DEFAULT CURRENT_DATE,
  performance_score integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rehabilitation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own sessions" ON public.rehabilitation_sessions
  FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can insert own sessions" ON public.rehabilitation_sessions
  FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient sessions" ON public.rehabilitation_sessions
  FOR SELECT USING (
    has_role(auth.uid(), 'doctor') AND EXISTS (
      SELECT 1 FROM doctor_patients WHERE doctor_id = auth.uid() AND patient_id = rehabilitation_sessions.patient_id
    )
  );
CREATE POLICY "Admins full access sessions" ON public.rehabilitation_sessions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create mri_scans table
CREATE TABLE IF NOT EXISTS public.mri_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  scan_file_url text NOT NULL,
  scan_date date NOT NULL DEFAULT CURRENT_DATE,
  scan_type text DEFAULT 'mri',
  ai_analysis_status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mri_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own scans" ON public.mri_scans
  FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can insert own scans" ON public.mri_scans
  FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient scans" ON public.mri_scans
  FOR SELECT USING (
    has_role(auth.uid(), 'doctor') AND EXISTS (
      SELECT 1 FROM doctor_patients WHERE doctor_id = auth.uid() AND patient_id = mri_scans.patient_id
    )
  );
CREATE POLICY "Admins full access scans" ON public.mri_scans
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create ai_analysis_results table
CREATE TABLE IF NOT EXISTS public.ai_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  input_type text NOT NULL DEFAULT 'MRI',
  ai_model_name text,
  result_json jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own results" ON public.ai_analysis_results
  FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient results" ON public.ai_analysis_results
  FOR SELECT USING (
    has_role(auth.uid(), 'doctor') AND EXISTS (
      SELECT 1 FROM doctor_patients WHERE doctor_id = auth.uid() AND patient_id = ai_analysis_results.patient_id
    )
  );
CREATE POLICY "Admins full access results" ON public.ai_analysis_results
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create mri-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('mri-images', 'mri-images', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies for mri-images
CREATE POLICY "Patients upload own MRI" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'mri-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Patients view own MRI" ON storage.objects
  FOR SELECT USING (bucket_id = 'mri-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Doctors view assigned patient MRI" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'mri-images' AND has_role(auth.uid(), 'doctor') AND EXISTS (
      SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = (storage.foldername(name))[1]::uuid
    )
  );

-- Add admin policies to existing tables
CREATE POLICY "Admins full access profiles" ON public.profiles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access user_roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access doctor_patients" ON public.doctor_patients FOR ALL USING (has_role(auth.uid(), 'admin'));
