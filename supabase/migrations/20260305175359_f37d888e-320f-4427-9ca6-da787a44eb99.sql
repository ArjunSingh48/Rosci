
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor');

-- Create mood enum
CREATE TYPE public.mood_type AS ENUM ('great', 'okay', 'bad');

-- Create tip type enum
CREATE TYPE public.tip_type AS ENUM ('nutrition', 'rehab', 'mindfulness');

-- Create report status enum
CREATE TYPE public.report_status AS ENUM ('pending', 'approved');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  rehab_weeks INTEGER DEFAULT 0,
  injury_level TEXT,
  pain_level INTEGER DEFAULT 0,
  mood_level INTEGER DEFAULT 3,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create doctor_patients assignment table
CREATE TABLE public.doctor_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, patient_id)
);

-- Create medical_reports table
CREATE TABLE public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_file_url TEXT,
  simplified_summary TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercise_videos table
CREATE TABLE public.exercise_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  video_url TEXT,
  doctor_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create check_ins table
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood mood_type NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_tips table
CREATE TABLE public.daily_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_type tip_type NOT NULL,
  content TEXT NOT NULL,
  rehab_week_min INTEGER DEFAULT 0,
  rehab_week_max INTEGER DEFAULT 52
);

-- Create chatbot_qa table
CREATE TABLE public.chatbot_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  answer TEXT NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Doctors can view assigned patient profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = profiles.id)
  );

-- User roles policies
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Doctor patients policies
CREATE POLICY "Doctors can view their assignments" ON public.doctor_patients
  FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Patients can view their doctor assignment" ON public.doctor_patients
  FOR SELECT USING (auth.uid() = patient_id);

-- Medical reports policies
CREATE POLICY "Patients can view own reports" ON public.medical_reports
  FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can insert own reports" ON public.medical_reports
  FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient reports" ON public.medical_reports
  FOR SELECT USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = medical_reports.patient_id)
  );
CREATE POLICY "Doctors can update assigned patient reports" ON public.medical_reports
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = medical_reports.patient_id)
  );

-- Exercise videos policies
CREATE POLICY "Patients can view own videos" ON public.exercise_videos
  FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can insert own videos" ON public.exercise_videos
  FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient videos" ON public.exercise_videos
  FOR SELECT USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = exercise_videos.patient_id)
  );
CREATE POLICY "Doctors can update assigned patient videos" ON public.exercise_videos
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = exercise_videos.patient_id)
  );

-- Check-ins policies
CREATE POLICY "Patients can view own check_ins" ON public.check_ins
  FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can insert own check_ins" ON public.check_ins
  FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can view assigned patient check_ins" ON public.check_ins
  FOR SELECT USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = check_ins.patient_id)
  );

-- Daily tips - readable by all authenticated users
CREATE POLICY "Authenticated users can view tips" ON public.daily_tips
  FOR SELECT TO authenticated USING (true);

-- Chatbot QA - readable by all authenticated users
CREATE POLICY "Authenticated users can view chatbot qa" ON public.chatbot_qa
  FOR SELECT TO authenticated USING (true);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for exercise videos and medical reports
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-videos', 'exercise-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-reports', 'medical-reports', true);

CREATE POLICY "Authenticated users can upload exercise videos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'exercise-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view exercise videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'exercise-videos');
CREATE POLICY "Authenticated users can upload medical reports" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view medical reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'medical-reports');
