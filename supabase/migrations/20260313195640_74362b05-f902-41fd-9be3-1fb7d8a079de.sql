
-- Gamification: track points, streaks, badges
CREATE TABLE public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_points integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  last_check_in_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification" ON public.user_gamification
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gamification" ON public.user_gamification
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification" ON public.user_gamification
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Badge definitions
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  points_required integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'general'
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT TO authenticated USING (true);

-- User earned badges
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id),
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Exercise library
CREATE TABLE public.exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL DEFAULT 'beginner',
  duration_minutes integer NOT NULL DEFAULT 3,
  purpose text NOT NULL,
  instructions jsonb NOT NULL DEFAULT '[]',
  muscle_groups text[] DEFAULT '{}',
  equipment_needed text DEFAULT 'none',
  is_bite_sized boolean NOT NULL DEFAULT true,
  parent_exercise_id uuid REFERENCES public.exercise_library(id),
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises" ON public.exercise_library
  FOR SELECT TO authenticated USING (true);

-- Seed badges
INSERT INTO public.badges (key, name, description, icon, points_required, category) VALUES
  ('first_checkin', 'First Check-In', 'Completed your first daily check-in', '🌟', 0, 'engagement'),
  ('streak_3', '3-Day Streak', 'Checked in 3 days in a row', '🔥', 0, 'streak'),
  ('streak_7', 'Week Warrior', 'Checked in 7 days in a row', '⚡', 0, 'streak'),
  ('streak_14', 'Two Week Champion', '14 consecutive days of check-ins', '💎', 0, 'streak'),
  ('streak_30', 'Monthly Master', '30 consecutive days of check-ins', '👑', 0, 'streak'),
  ('first_exercise', 'First Step', 'Completed your first exercise', '🏋️', 0, 'exercise'),
  ('exercises_10', 'Getting Stronger', 'Completed 10 exercises', '💪', 0, 'exercise'),
  ('exercises_25', 'Dedicated Athlete', 'Completed 25 exercises', '🎯', 0, 'exercise'),
  ('exercises_50', 'Half Century', 'Completed 50 exercises', '🏆', 0, 'exercise'),
  ('points_50', 'Rising Star', 'Earned 50 points', '⭐', 50, 'points'),
  ('points_100', 'Century Club', 'Earned 100 points', '💯', 100, 'points'),
  ('points_250', 'Quarter Thousand', 'Earned 250 points', '🚀', 250, 'points'),
  ('points_500', 'Recovery Champion', 'Earned 500 points', '🏅', 500, 'points'),
  ('full_session', 'Session Complete', 'Completed all daily tasks in one day', '✅', 0, 'exercise'),
  ('mood_logger', 'Mood Tracker', 'Logged your mood 5 times', '😊', 0, 'engagement');

-- Seed exercise library
INSERT INTO public.exercise_library (name, category, difficulty, duration_minutes, purpose, instructions, muscle_groups, equipment_needed, is_bite_sized, sort_order) VALUES
  ('Seated Arm Raises', 'upper_body', 'beginner', 2, 'Builds shoulder strength for daily tasks', '["Sit upright in wheelchair", "Raise both arms slowly overhead", "Hold for 3 seconds", "Lower slowly", "Repeat 10 times"]', '{shoulders,arms}', 'none', true, 1),
  ('Resistance Band Rows', 'upper_body', 'beginner', 3, 'Strengthens back muscles for posture', '["Attach band to door handle", "Sit facing the door", "Pull band toward chest", "Squeeze shoulder blades", "3 sets of 12 reps"]', '{back,biceps}', 'resistance band', true, 2),
  ('Wheelchair Push-Ups', 'upper_body', 'intermediate', 3, 'Prevents pressure ulcers and builds arm strength', '["Place hands on armrests", "Push body upward", "Hold for 5 seconds", "Lower slowly", "Repeat 10 times"]', '{triceps,shoulders}', 'none', true, 3),
  ('Bicep Curls', 'upper_body', 'beginner', 3, 'Builds arm strength for transfers', '["Hold light weights or water bottles", "Curl arms up slowly", "Lower with control", "3 sets of 10 reps"]', '{biceps}', 'light weights', true, 4),
  ('Seated Torso Rotation', 'core', 'beginner', 3, 'Improves trunk stability and balance', '["Sit upright", "Hold a ball or pillow", "Rotate torso slowly left", "Return to center", "Rotate right", "10 reps each side"]', '{core,obliques}', 'ball optional', true, 5),
  ('Abdominal Bracing', 'core', 'beginner', 2, 'Activates deep core muscles', '["Sit or lie comfortably", "Tighten your stomach muscles", "Hold for 10 seconds", "Release and breathe", "Repeat 10 times"]', '{core}', 'none', true, 6),
  ('Seated Balance Hold', 'core', 'intermediate', 3, 'Challenges core for wheelchair stability', '["Sit on edge of seat", "Let go of supports briefly", "Maintain upright posture", "Hold 10-15 seconds", "Rest and repeat 5 times"]', '{core}', 'none', true, 7),
  ('Hamstring Stretch', 'stretching', 'beginner', 3, 'Maintains leg flexibility', '["Extend one leg forward", "Lean gently toward foot", "Hold 20-30 seconds", "Switch legs", "Repeat twice each"]', '{hamstrings}', 'none', true, 8),
  ('Shoulder Stretch', 'stretching', 'beginner', 2, 'Reduces shoulder tension', '["Cross one arm across chest", "Use other hand to hold gently", "Hold 20 seconds", "Switch arms"]', '{shoulders}', 'none', true, 9),
  ('Hip Flexor Stretch', 'stretching', 'beginner', 3, 'Prevents hip tightness from sitting', '["Sit at edge of chair", "Extend one leg back if possible", "Lean forward gently", "Hold 20-30 seconds", "Switch sides"]', '{hip_flexors}', 'none', true, 10),
  ('Full Body Stretch Routine', 'stretching', 'beginner', 5, 'Comprehensive flexibility maintenance', '["Start with neck rolls", "Move to shoulder stretches", "Stretch arms and wrists", "Hamstring stretch", "Hip flexor stretch", "Hold each 20 seconds"]', '{full_body}', 'none', false, 11),
  ('Deep Breathing', 'breathing', 'beginner', 2, 'Improves lung capacity and relaxation', '["Inhale slowly for 4 seconds", "Hold for 2 seconds", "Exhale slowly for 6 seconds", "Repeat for 2 minutes"]', '{}', 'none', true, 12),
  ('Diaphragmatic Breathing', 'breathing', 'beginner', 3, 'Strengthens respiratory muscles', '["Place hand on belly", "Breathe in through nose", "Feel belly rise", "Exhale through pursed lips", "Feel belly fall", "5 minutes"]', '{}', 'none', true, 13),
  ('Box Breathing', 'breathing', 'beginner', 3, 'Reduces stress and anxiety', '["Inhale for 4 seconds", "Hold for 4 seconds", "Exhale for 4 seconds", "Hold for 4 seconds", "Repeat 5-8 cycles"]', '{}', 'none', true, 14),
  ('Wheelchair Forward Roll', 'mobility', 'beginner', 3, 'Improves forward wheelchair control', '["Start at rest", "Push forward slowly", "Roll for 10 meters", "Stop using brakes", "Repeat 5 times"]', '{arms}', 'wheelchair', true, 15),
  ('Turn and Navigate', 'mobility', 'beginner', 5, 'Builds confidence in wheelchair navigation', '["Set up simple course", "Practice right turns", "Practice left turns", "Navigate around obstacles", "10 minutes total"]', '{arms,shoulders}', 'wheelchair', false, 16),
  ('Wrist Circles', 'upper_body', 'beginner', 2, 'Maintains wrist flexibility', '["Extend arms forward", "Circle wrists clockwise 10 times", "Circle counterclockwise 10 times", "Shake out hands"]', '{wrists}', 'none', true, 17),
  ('Neck Rolls', 'stretching', 'beginner', 2, 'Relieves neck tension from sitting', '["Drop chin to chest", "Roll head slowly to right", "Continue to back", "Roll to left", "Complete 5 circles each direction"]', '{neck}', 'none', true, 18),
  ('Grip Strengthening', 'upper_body', 'beginner', 3, 'Improves hand strength for daily activities', '["Squeeze a stress ball", "Hold for 5 seconds", "Release slowly", "Repeat 15 times each hand"]', '{forearms,hands}', 'stress ball', true, 19),
  ('Guided Visualization', 'breathing', 'beginner', 5, 'Promotes mental recovery and motivation', '["Close your eyes", "Imagine yourself achieving a goal", "Visualize each step clearly", "Feel the success", "Open eyes when ready"]', '{}', 'none', false, 20);
