
-- Medical images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('spinal-images', 'spinal-images', false);

-- Storage RLS: patients upload own images
CREATE POLICY "Patients can upload own spinal images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'spinal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Patients can view own spinal images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'spinal-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Doctors can view assigned patient spinal images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'spinal-images'
  AND public.has_role(auth.uid(), 'doctor')
  AND EXISTS (
    SELECT 1 FROM public.doctor_patients
    WHERE doctor_id = auth.uid()
    AND patient_id = (storage.foldername(name))[1]::uuid
  )
);

-- Image type enum
CREATE TYPE public.image_type AS ENUM ('mri', 'ct', 'xray', 'scan');

-- Medical images table
CREATE TABLE public.medical_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  image_url text NOT NULL,
  image_type public.image_type NOT NULL,
  spinal_region text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert own images" ON public.medical_images FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own images" ON public.medical_images FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient images" ON public.medical_images FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'doctor') AND EXISTS (SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = medical_images.patient_id));

-- AI spine analysis table
CREATE TYPE public.analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE public.ai_spine_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  image_id uuid REFERENCES public.medical_images(id) ON DELETE CASCADE NOT NULL,
  detected_injury_region text,
  nerve_damage_probability numeric,
  mobility_recovery_probability numeric,
  confidence_score numeric,
  analysis_status public.analysis_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_spine_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own analysis" ON public.ai_spine_analysis FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient analysis" ON public.ai_spine_analysis FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'doctor') AND EXISTS (SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = ai_spine_analysis.patient_id));

-- Spine models table
CREATE TABLE public.spine_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  spinal_region text,
  model_url text,
  recovery_stage text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.spine_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own models" ON public.spine_models FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient models" ON public.spine_models FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'doctor') AND EXISTS (SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = spine_models.patient_id));

-- Recovery metrics table
CREATE TABLE public.recovery_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE,
  task_completion_rate numeric DEFAULT 0,
  exercise_consistency_score numeric DEFAULT 0,
  sleep_quality_score numeric DEFAULT 0,
  nutrition_score numeric DEFAULT 0,
  mental_health_score numeric DEFAULT 0,
  mobility_score numeric DEFAULT 0,
  overall_recovery_index numeric DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recovery_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own metrics" ON public.recovery_metrics FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Patients can insert own metrics" ON public.recovery_metrics FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update own metrics" ON public.recovery_metrics FOR UPDATE TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient metrics" ON public.recovery_metrics FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'doctor') AND EXISTS (SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = recovery_metrics.patient_id));
