
CREATE TABLE public.recovery_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_text text NOT NULL,
  timeframe_months integer NOT NULL,
  goal_summary text NOT NULL,
  intensity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recovery_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.recovery_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.recovery_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.recovery_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.recovery_goals FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Doctors can view patient goals" ON public.recovery_goals FOR SELECT
  USING (public.has_role(auth.uid(), 'doctor') AND EXISTS (
    SELECT 1 FROM public.doctor_patients WHERE doctor_id = auth.uid() AND patient_id = recovery_goals.user_id
  ));
