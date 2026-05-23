import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { Chatbot } from "@/components/Chatbot";
import { PatientNav } from "@/components/PatientNav";
import { FloatingButtons } from "@/components/FloatingButtons";
import { ProgressRing } from "@/components/ProgressRing";
import { GamificationBar } from "@/components/GamificationBar";
import { DailyCheckInModal } from "@/components/DailyCheckInModal";
import { ConfettiOverlay } from "@/components/ConfettiOverlay";
import { RecoveryRoadmap } from "@/components/RecoveryRoadmap";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Check, X, TrendingUp, Minus, TrendingDown, Activity, Apple, Brain, ChevronDown, Zap, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useGamification } from "@/hooks/useGamification";

const quotes = [
  "Every step forward is a victory. Keep going! 💪",
  "Recovery is not linear, but every day counts.",
  "Your strength is greater than any obstacle.",
  "Small progress is still progress. Be proud.",
  "You are resilient. Trust the process.",
  "The body heals, the spirit strengthens.",
];

interface TaskDef {
  name: string;
  category: "rehabilitation" | "massage" | "nutrition" | "mental_wellness";
  purpose: string;
  instructions: string[];
  duration: number;
}

const defaultTasks: TaskDef[] = [
  {
    name: "Upper Body Strength Training",
    category: "rehabilitation",
    purpose: "Strengthens arms and shoulders for wheelchair mobility.",
    instructions: ["Perform seated resistance band rows.", "3 sets of 12 repetitions.", "Keep back straight and engage core."],
    duration: 5,
  },
  {
    name: "Wheelchair Mobility Practice",
    category: "rehabilitation",
    purpose: "Improves independence and navigation ability.",
    instructions: ["Practice controlled wheelchair movement.", "Move forward for 10 minutes.", "Practice turning and stopping."],
    duration: 10,
  },
  {
    name: "Pressure Relief Exercise",
    category: "rehabilitation",
    purpose: "Prevents pressure ulcers.",
    instructions: ["Perform wheelchair push-ups.", "Lift body using armrests.", "Hold for 5 seconds.", "Repeat 10 times."],
    duration: 3,
  },
  {
    name: "Seated Core Stability Exercise",
    category: "rehabilitation",
    purpose: "Improves balance and posture.",
    instructions: ["Sit upright.", "Hold a light medicine ball.", "Rotate torso slowly left and right."],
    duration: 5,
  },
  {
    name: "Stretching Routine",
    category: "massage",
    purpose: "Maintains flexibility and prevents stiffness.",
    instructions: ["Stretch hamstrings.", "Stretch hip flexors.", "Stretch shoulders.", "Hold each stretch for 20 seconds."],
    duration: 5,
  },
  {
    name: "Breathing Exercise",
    category: "mental_wellness",
    purpose: "Improves lung function and relaxation.",
    instructions: ["Inhale for 4 seconds.", "Hold for 2 seconds.", "Exhale for 6 seconds.", "Repeat for 5 minutes."],
    duration: 5,
  },
];

const replacementTasks: TaskDef[] = [
  { name: "Gentle arm circles", category: "rehabilitation", purpose: "Warms up shoulder joints.", instructions: ["Circle arms forward 10 times.", "Circle arms backward 10 times."], duration: 2 },
  { name: "Neck stretches", category: "massage", purpose: "Relieves neck tension.", instructions: ["Tilt head slowly to each side.", "Hold 15 seconds per side."], duration: 2 },
  { name: "Protein intake check", category: "nutrition", purpose: "Ensures adequate protein for recovery.", instructions: ["Check if you've had protein with each meal today."], duration: 1 },
  { name: "5-minute meditation", category: "mental_wellness", purpose: "Calms the mind.", instructions: ["Close your eyes.", "Focus on your breathing.", "Let thoughts pass without judgment."], duration: 5 },
];

const PatientHome = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const gam = useGamification();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastCheckInEnergy, setLastCheckInEnergy] = useState<string | null>(null);
  const [lastCheckInPain, setLastCheckInPain] = useState<number | null>(null);

  const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toISOString().split("T")[0];

  const { data: checkIns = [] } = useQuery({
    queryKey: ["check-ins", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("check_ins")
        .select("*")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const todayCheckIn = checkIns.find(c => new Date(c.created_at).toDateString() === new Date().toDateString());

  // Show modal on load if no check-in
  const [modalShown, setModalShown] = useState(false);
  const shouldShowModal = !todayCheckIn && !modalShown;

  const { data: todayIntensity } = useQuery({
    queryKey: ["intensity", user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("intensity_choices")
        .select("*")
        .eq("patient_id", user!.id)
        .eq("date", today)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const intensityMutation = useMutation({
    mutationFn: async (choice: string) => {
      await supabase.from("intensity_choices").insert({ patient_id: user!.id, choice: choice as any });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["intensity"] }),
  });

  const { data: taskLogs = [] } = useQuery({
    queryKey: ["daily-tasks", user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_tasks_log")
        .select("*")
        .eq("patient_id", user!.id)
        .eq("date", today);
      return data ?? [];
    },
    enabled: !!user,
  });

  const [localSkipped, setLocalSkipped] = useState<string[]>([]);
  const [replacements, setReplacements] = useState<typeof defaultTasks>([]);

  const activeTasks = useMemo(() => {
    let tasks = [...defaultTasks, ...replacements];
    // Adaptive filtering based on check-in energy/pain
    if (lastCheckInEnergy === "low" || (lastCheckInPain !== null && lastCheckInPain >= 7)) {
      // Filter to lighter exercises only
      tasks = tasks.filter(t => t.duration <= 5);
      const lightCount = tasks.length;
      if (lightCount < 3) {
        const extra = replacementTasks.filter(r => !tasks.some(t => t.name === r.name) && r.duration <= 3);
        tasks.push(...extra.slice(0, 3 - lightCount));
      }
    }
    return tasks.filter(t => !localSkipped.includes(t.name));
  }, [localSkipped, replacements, lastCheckInEnergy, lastCheckInPain]);

  const completedCount = activeTasks.filter(t => taskLogs.some((l: any) => l.task_name === t.name && l.completed)).length;
  const totalTasks = activeTasks.length + 1; // +1 for mood check-in
  const sessionProgress = ((completedCount + (todayCheckIn ? 1 : 0)) / totalTasks) * 100;
  const allDone = completedCount === activeTasks.length && !!todayCheckIn;

  const taskMutation = useMutation({
    mutationFn: async ({ taskName, category, completed, skipped }: { taskName: string; category: string; completed: boolean; skipped: boolean }) => {
      await supabase.from("daily_tasks_log").insert({
        patient_id: user!.id,
        task_name: taskName,
        task_category: category as any,
        completed,
        skipped,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily-tasks"] }),
  });

  const handleComplete = async (task: TaskDef) => {
    taskMutation.mutate({ taskName: task.name, category: task.category, completed: true, skipped: false });
    await gam.awardPoints(5, `Task: ${task.name}`);
    await gam.tryAwardBadge("first_exercise");

    // Check if this completes the session
    const newCompleted = completedCount + 1;
    if (newCompleted === activeTasks.length && todayCheckIn) {
      await gam.awardPoints(25, "Full session bonus");
      await gam.tryAwardBadge("full_session");
      setShowConfetti(true);
      toast({ title: "🎉 Session Complete! +25 bonus points!" });
    } else {
      toast({ title: `+5 pts — Keep going! 💪` });
    }
  };

  const handleSkip = (task: TaskDef) => {
    taskMutation.mutate({ taskName: task.name, category: task.category, completed: false, skipped: true });
    setLocalSkipped(p => [...p, task.name]);
    const unused = replacementTasks.find(r => !activeTasks.some(a => a.name === r.name) && !localSkipped.includes(r.name));
    if (unused) setReplacements(p => [...p, unused]);
  };

  const handleCheckIn = async (mood: "great" | "okay" | "bad", note: string, energy?: string, pain?: number, motivation?: number) => {
    if (!user) return;
    await supabase.from("check_ins").insert({
      patient_id: user.id,
      mood,
      note: note || null,
      energy_level: energy || null,
      pain_level: pain ?? null,
      motivation_level: motivation ?? null,
    } as any);
    if (energy) setLastCheckInEnergy(energy);
    if (pain !== undefined) setLastCheckInPain(pain);
    await gam.updateStreak();
    await gam.awardPoints(10, "Daily check-in");
    await gam.tryAwardBadge("first_checkin");
    queryClient.invalidateQueries({ queryKey: ["check-ins"] });
    setShowCheckInModal(false);
    setModalShown(true);
    toast({ title: "Check-in saved! +10 pts 🌟" });
  };

  const { data: tips = [] } = useQuery({
    queryKey: ["daily-tips", profile?.rehab_weeks],
    queryFn: async () => {
      const week = profile?.rehab_weeks ?? 0;
      const { data } = await supabase
        .from("daily_tips")
        .select("*")
        .lte("rehab_week_min", week)
        .gte("rehab_week_max", week);
      return data ?? [];
    },
    enabled: !!profile,
  });

  const tipColors: Record<string, string> = {
    rehab: "bg-primary/10 border-primary/20",
    nutrition: "bg-secondary/30 border-secondary/40",
    mindfulness: "bg-accent/20 border-accent/30",
  };

  // Quick start exercise
  const { data: quickExercises = [] } = useQuery({
    queryKey: ["quick-exercises"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercise_library")
        .select("*")
        .eq("is_bite_sized", true)
        .lte("duration_minutes", 2)
        .order("sort_order")
        .limit(1);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      {/* Check-in modal */}
      <AnimatePresence>
        {(shouldShowModal || showCheckInModal) && (
          <DailyCheckInModal
            streak={gam.currentStreak}
            onSubmit={handleCheckIn}
            onClose={() => { setShowCheckInModal(false); setModalShown(true); }}
          />
        )}
      </AnimatePresence>

      {/* Confetti */}
      {showConfetti && <ConfettiOverlay onDone={() => setShowConfetti(false)} />}

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
        {/* Gamification Bar */}
        <GamificationBar
          streak={gam.currentStreak}
          points={gam.totalPoints}
          level={gam.level}
          xpInLevel={gam.xpInLevel}
        />

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {profile?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            Week {profile?.rehab_weeks ?? 0} of recovery · <span className="italic">{quote}</span>
          </p>
        </motion.div>

        {/* Session Progress */}
        <Card className={allDone ? "border-primary bg-primary/5" : ""}>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Today's Session</h2>
              <span className="text-sm font-bold text-primary">
                {completedCount + (todayCheckIn ? 1 : 0)}/{totalTasks}
              </span>
            </div>
            <Progress value={sessionProgress} className="h-3" />
            {allDone && (
              <p className="text-center text-sm font-semibold text-primary">
                🎉 All tasks complete! Amazing work!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Start */}
        {!allDone && quickExercises.length > 0 && (
          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <Zap className="w-4 h-4 text-primary" /> Quick Start
                </p>
                <p className="text-xs text-muted-foreground">
                  {(quickExercises[0] as any).name} · {(quickExercises[0] as any).duration_minutes} min
                </p>
              </div>
              <Button
                size="sm"
                className="rounded-xl gap-1"
                onClick={async () => {
                  const ex = quickExercises[0] as any;
                  await supabase.from("daily_tasks_log").insert({
                    patient_id: user!.id,
                    task_name: ex.name,
                    task_category: "rehabilitation" as any,
                    completed: true,
                    skipped: false,
                  });
                  await gam.awardPoints(5, `Quick: ${ex.name}`);
                  queryClient.invalidateQueries({ queryKey: ["daily-tasks"] });
                  toast({ title: `+5 pts — ${ex.name} done! ⚡` });
                }}
              >
                <Play className="w-3 h-3" /> Start
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Intensity Adjustment */}
        {!todayIntensity && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-sm text-foreground text-center font-medium">
                How would you like to proceed today?
              </p>
              <div className="flex gap-2">
                {[
                  { val: "increase", icon: TrendingUp, label: "Increase" },
                  { val: "maintain", icon: Minus, label: "Maintain" },
                  { val: "lighter", icon: TrendingDown, label: "Lighter" },
                ].map(i => (
                  <Button
                    key={i.val}
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl"
                    onClick={() => intensityMutation.mutate(i.val)}
                  >
                    <i.icon className="w-4 h-4 mr-1" /> {i.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Check-in prompt if skipped modal */}
        {!todayCheckIn && modalShown && (
          <Card className="border-primary/20">
            <CardContent className="py-3">
              <Button
                onClick={() => setShowCheckInModal(true)}
                variant="outline"
                className="w-full rounded-xl border-primary text-primary"
              >
                How are you feeling today? 😊 (+10 pts)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Today's Tasks */}
        <TasksSection
          activeTasks={activeTasks}
          taskLogs={taskLogs}
          todayCheckIn={todayCheckIn}
          handleComplete={handleComplete}
          handleSkip={handleSkip}
        />

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/exercise-library")}>
            <CardContent className="py-4 text-center">
              <p className="text-sm font-semibold text-foreground">🏋️ Exercise Library</p>
              <p className="text-xs text-muted-foreground">Browse all exercises</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/recovery-insights")}>
            <CardContent className="py-4 text-center">
              <p className="text-sm font-semibold text-foreground">📊 Progress</p>
              <p className="text-xs text-muted-foreground">View your recovery</p>
            </CardContent>
          </Card>
        </div>

        {/* Recovery Roadmap */}
        <RecoveryRoadmap rehabWeeks={profile?.rehab_weeks ?? 0} />

        {/* Daily Tips */}
        {tips.length > 0 && <DailyTipsAccordion tips={tips} tipColors={tipColors} />}
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

const tipCategories = [
  { key: "rehab", label: "Rehabilitation", icon: Activity },
  { key: "nutrition", label: "Nutrition", icon: Apple },
  { key: "mindfulness", label: "Mindfulness", icon: Brain },
] as const;

function DailyTipsAccordion({ tips, tipColors }: { tips: any[]; tipColors: Record<string, string> }) {
  const [open, setOpen] = useState<string | null>(null);
  const grouped = useMemo(() => {
    const map: Record<string, typeof tips> = {};
    tips.forEach(t => { if (!map[t.tip_type]) map[t.tip_type] = []; map[t.tip_type].push(t); });
    return map;
  }, [tips]);

  return (
    <div>
      <h2 className="font-semibold text-foreground mb-3">Daily Tips</h2>
      <div className="flex flex-col gap-2">
        {tipCategories.map(({ key, label, icon: Icon }) => {
          const isOpen = open === key;
          const count = grouped[key]?.length ?? 0;
          if (count === 0) return null;
          return (
            <div key={key}>
              <button
                onClick={() => setOpen(isOpen ? null : key)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${tipColors[key] || "bg-muted/50 border-border"} ${isOpen ? "ring-1 ring-primary/30" : ""}`}
              >
                <span className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <Icon className="w-4 h-4 text-primary" /> {label} <span className="text-xs text-muted-foreground">({count})</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="flex flex-col gap-2 pt-2 pl-6">
                      {grouped[key].map((tip: any) => (
                        <p key={tip.id} className="text-sm text-foreground/80">• {tip.content}</p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TasksSection({ activeTasks, taskLogs, todayCheckIn, handleComplete, handleSkip }: {
  activeTasks: TaskDef[];
  taskLogs: any[];
  todayCheckIn: any;
  handleComplete: (task: TaskDef) => void;
  handleSkip: (task: TaskDef) => void;
}) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <h2 className="font-semibold text-foreground">Today's Tasks</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <Checkbox checked={!!todayCheckIn} disabled={!!todayCheckIn} />
            <span className={`flex-1 text-sm ${todayCheckIn ? "line-through text-muted-foreground" : "text-foreground"}`}>
              Log mood {!todayCheckIn && <span className="text-xs text-primary">(+10 pts)</span>}
            </span>
          </div>
          {activeTasks.map(task => {
            const isCompleted = taskLogs.some((l: any) => l.task_name === task.name && l.completed);
            const isSkipped = taskLogs.some((l: any) => l.task_name === task.name && l.skipped);
            if (isSkipped) return null;
            const isExpanded = expandedTask === task.name;
            return (
              <div key={task.name} className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-3 p-2">
                  <Checkbox checked={isCompleted} disabled={isCompleted} onCheckedChange={() => !isCompleted && handleComplete(task)} />
                  <button
                    onClick={() => setExpandedTask(isExpanded ? null : task.name)}
                    className={`flex-1 text-left text-sm ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {task.name}
                    <span className="text-xs text-muted-foreground ml-1">({task.duration}m)</span>
                  </button>
                  {!isCompleted && (
                    <div className="flex gap-1">
                      <button onClick={() => handleComplete(task)} className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center hover:bg-accent/50">
                        <Check className="w-3 h-3 text-accent-foreground" />
                      </button>
                      <button onClick={() => handleSkip(task)} className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20">
                        <X className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  )}
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-3 pt-1 border-t border-border space-y-2">
                        <p className="text-xs font-semibold text-primary">{task.purpose}</p>
                        <ul className="space-y-1">
                          {task.instructions.map((inst, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {inst}</li>
                          ))}
                        </ul>
                        {!isCompleted && (
                          <p className="text-[10px] text-primary">+5 pts on completion</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default PatientHome;
