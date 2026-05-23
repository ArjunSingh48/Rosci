import { useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { BackButton } from "@/components/BackButton";
import { RecoveryRoadmap } from "@/components/RecoveryRoadmap";
import { RecoveryScoreCard } from "@/components/RecoveryScoreCard";
import { GoalAlignmentBar } from "@/components/GoalAlignmentBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGamification } from "@/hooks/useGamification";
import {
  Target, Plus, Upload, Watch, Heart, Moon, Footprints, Activity, Video, MessageSquare,
  Trash2, Flame, Sparkles, Loader2, Check, Dumbbell, Zap, ChevronRight,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, CartesianGrid,
} from "recharts";
import { computeRecoveryScore, goalProgress } from "@/lib/recoveryScore";
import { getTodayThings } from "@/lib/todayTasks";

// ── Goal parsing ──
function parseGoal(text: string) {
  const lower = text.toLowerCase();
  let intensity = "medium";
  if (/run|sprint|intense|hard|climb|marathon/i.test(lower)) intensity = "high";
  else if (/walk|gentle|light|stretch|easy/i.test(lower)) intensity = "low";
  else if (/hike|swim|bike|cycle|jog/i.test(lower)) intensity = "low to medium";
  const summary = text.length > 60 ? text.slice(0, 57) + "…" : text;
  return { goal_summary: summary, intensity };
}

// ── Mock wearable data ──
const sleepData = [
  { day: "Mon", hours: 7.2 }, { day: "Tue", hours: 6.5 }, { day: "Wed", hours: 8.1 },
  { day: "Thu", hours: 7.0 }, { day: "Fri", hours: 6.8 }, { day: "Sat", hours: 8.5 }, { day: "Sun", hours: 7.4 },
];
const heartRateData = [
  { time: "6am", bpm: 62 }, { time: "9am", bpm: 78 }, { time: "12pm", bpm: 85 },
  { time: "3pm", bpm: 72 }, { time: "6pm", bpm: 90 }, { time: "9pm", bpm: 68 },
];
const stepsData = [
  { day: "Mon", steps: 3200 }, { day: "Tue", steps: 4100 }, { day: "Wed", steps: 2800 },
  { day: "Thu", steps: 5200 }, { day: "Fri", steps: 3900 }, { day: "Sat", steps: 6100 }, { day: "Sun", steps: 4400 },
];

const RecoveryJourney = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gam = useGamification();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const rehabWeeks = profile?.rehab_weeks ?? 0;

  // ── Data queries ──
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["recovery-goals", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("recovery_goals").select("*").eq("user_id", user!.id)
        .order("timeframe_months", { ascending: true });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["exercise-videos", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("exercise_videos").select("*")
        .eq("patient_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: taskLogs = [] } = useQuery({
    queryKey: ["task-logs-rj", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("daily_tasks_log").select("date, completed")
        .eq("patient_id", user!.id).order("date", { ascending: false }).limit(200);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-rj", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("rehabilitation_sessions")
        .select("exercise_date, performance_score").eq("patient_id", user!.id)
        .order("exercise_date", { ascending: false }).limit(100);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: sleepLogs = [] } = useQuery({
    queryKey: ["sleep-rj", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("sleep_logs").select("date, hours")
        .eq("patient_id", user!.id).order("date", { ascending: false }).limit(30);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins-rj", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("check_ins").select("created_at, mood, energy_level, pain_level")
        .eq("patient_id", user!.id).order("created_at", { ascending: false }).limit(30);
      return data ?? [];
    },
    enabled: !!user,
  });

  // ── Recovery score ──
  const scoreResult = useMemo(() => computeRecoveryScore({
    taskLogs, streak: gam.currentStreak, sessions, sleepLogs, checkIns, goals,
  }), [taskLogs, gam.currentStreak, sessions, sleepLogs, checkIns, goals]);

  // ── Today's 3 Things ──
  const todayKey = `today-done-${new Date().toDateString()}`;
  const [doneToday, setDoneToday] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(todayKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const todayTasks = getTodayThings(rehabWeeks, doneToday.size);

  const toggleTodayTask = (i: number) => {
    setDoneToday(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      localStorage.setItem(todayKey, JSON.stringify([...next]));
      return next;
    });
  };

  // ── Goal wizard ──
  const [showGoalWizard, setShowGoalWizard] = useState(false);
  const [newGoals, setNewGoals] = useState([
    { text: "", months: "6" }, { text: "", months: "12" },
    { text: "", months: "18" }, { text: "", months: "24" },
  ]);

  const saveGoalsMutation = useMutation({
    mutationFn: async () => {
      const rows = newGoals.filter(g => g.text.trim()).map(g => {
        const parsed = parseGoal(g.text);
        return {
          user_id: user!.id, goal_text: g.text.trim(),
          timeframe_months: Number(g.months),
          goal_summary: parsed.goal_summary, intensity: parsed.intensity,
        };
      });
      if (!rows.length) throw new Error("Add at least one goal");
      const { error } = await supabase.from("recovery_goals").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Goals saved! 🎯" });
      queryClient.invalidateQueries({ queryKey: ["recovery-goals"] });
      setShowGoalWizard(false);
      setNewGoals([
        { text: "", months: "6" }, { text: "", months: "12" },
        { text: "", months: "18" }, { text: "", months: "24" },
      ]);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recovery_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recovery-goals"] }),
  });

  // ── Video upload ──
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("exercise-videos").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("exercise-videos").getPublicUrl(path);
      await supabase.from("exercise_videos").insert({
        patient_id: user!.id, exercise_name: "Recovery Exercise", video_url: urlData.publicUrl,
      });
    },
    onSuccess: () => {
      toast({ title: "Video uploaded! 🎬 Your doctor will be notified." });
      queryClient.invalidateQueries({ queryKey: ["exercise-videos"] });
    },
    onError: (err: any) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  // ── AI Video Feedback ──
  const [videoFeedback, setVideoFeedback] = useState<{ improvement: string; consistency: string; next_focus: string } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const requestFeedback = async () => {
    if (!videos.length) return;
    setFeedbackLoading(true);
    try {
      const avgScore = sessions.length ? sessions.reduce((a: number, s: any) => a + (s.performance_score ?? 0), 0) / sessions.length : null;
      const firstVideo = videos[videos.length - 1];
      const daysSinceFirst = Math.floor((Date.now() - new Date(firstVideo.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const { data, error } = await supabase.functions.invoke("video-feedback", {
        body: {
          exercise_name: videos[0].exercise_name,
          videos_count: videos.length,
          avg_score: avgScore,
          latest_score: sessions[0]?.performance_score ?? null,
          days_since_first: daysSinceFirst,
        },
      });
      if (error) throw error;
      setVideoFeedback(data.feedback);
    } catch {
      toast({ title: "Couldn't generate feedback right now", variant: "destructive" });
    } finally { setFeedbackLoading(false); }
  };

  // ── AI Future Projection ──
  const [projection, setProjection] = useState<{ short_term: string; mid_term: string } | null>(null);
  const [projLoading, setProjLoading] = useState(false);
  const requestProjection = async () => {
    setProjLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recovery-prediction", {
        body: {
          mode: "projection",
          rehab_weeks: rehabWeeks,
          streak: gam.currentStreak,
          tasks_completed: taskLogs.filter((t: any) => t.completed).length,
          recovery_score: scoreResult.score,
          top_goal: goals[0]?.goal_summary ?? "general recovery",
        },
      });
      if (error) throw error;
      setProjection(data.projection);
    } catch {
      toast({ title: "Couldn't generate projection", variant: "destructive" });
    } finally { setProjLoading(false); }
  };

  // ── Devices state ──
  const [deviceModal, setDeviceModal] = useState<null | "wearable" | "machine">(null);
  const [machineConnected, setMachineConnected] = useState(false);

  // ── Score trend chart (last 30 days, derived from task completion as proxy) ──
  const trendData = useMemo(() => {
    const days: { date: string; score: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const iso = d.toISOString().slice(0, 10);
      const dayLogs = taskLogs.filter((t: any) => t.date === iso);
      const completed = dayLogs.filter((t: any) => t.completed).length;
      const rate = dayLogs.length ? (completed / dayLogs.length) * 100 : null;
      days.push({
        date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        score: rate ?? 0,
      });
    }
    return days;
  }, [taskLogs]);

  const showGoalSetup = !goalsLoading && goals.length === 0 && !showGoalWizard;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
        <BackButton />
        <h1 className="text-2xl font-bold text-foreground">My Recovery Journey</h1>

        {/* ── 1. TODAY'S 3 THINGS ── */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm">Today's 3 Things</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full px-2 py-0.5">
                  <Flame className="w-3 h-3" /> {gam.currentStreak}d
                </span>
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">
                  {scoreResult.score}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {todayTasks.map((task, i) => {
                const done = doneToday.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleTodayTask(i)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      done ? "bg-primary/15" : "bg-background hover:bg-muted"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      done ? "bg-primary border-primary" : "border-border"
                    }`}>
                      {done && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className={`text-sm flex-1 ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task}
                    </span>
                  </button>
                );
              })}
            </div>
            {doneToday.size === todayTasks.length && (
              <p className="text-xs text-primary text-center font-medium">🎉 All done today — beautiful work!</p>
            )}
          </CardContent>
        </Card>

        {/* ── 2. RECOVERY SCORE ── */}
        <RecoveryScoreCard result={scoreResult} />

        {/* ── 3. RECOVERY ROADMAP ── */}
        <RecoveryRoadmap rehabWeeks={rehabWeeks} />

        {/* ── 4. GOAL SETUP / GOALS ── */}
        {showGoalSetup && (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <Target className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-lg font-semibold">Set Your Recovery Goals</h2>
              <p className="text-sm text-muted-foreground">Define up to 4 milestones to guide your journey.</p>
              <Button onClick={() => setShowGoalWizard(true)} className="rounded-xl">
                <Plus className="w-4 h-4 mr-1" /> Set My Goals
              </Button>
            </CardContent>
          </Card>
        )}

        {showGoalWizard && (
          <Card>
            <CardHeader><CardTitle className="text-base">Set Your Goals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {newGoals.map((g, i) => (
                <div key={i} className="space-y-2 border-b border-border pb-4 last:border-0">
                  <Label className="text-sm font-medium">Goal {i + 1}</Label>
                  <Input
                    placeholder={`e.g. "I want to hike 5km"`}
                    value={g.text}
                    onChange={e => {
                      const c = [...newGoals]; c[i] = { ...c[i], text: e.target.value }; setNewGoals(c);
                    }}
                  />
                  <Select value={g.months} onValueChange={v => {
                    const c = [...newGoals]; c[i] = { ...c[i], months: v }; setNewGoals(c);
                  }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Timeframe" /></SelectTrigger>
                    <SelectContent>
                      {[3, 6, 9, 12, 18, 24].map(m => <SelectItem key={m} value={String(m)}>{m} months</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowGoalWizard(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={() => saveGoalsMutation.mutate()} disabled={saveGoalsMutation.isPending} className="flex-1 rounded-xl">
                  {saveGoalsMutation.isPending ? "Saving…" : "Save Goals"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {goals.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">My Goals</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowGoalWizard(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {goals.map((goal: any) => {
              const prog = goalProgress(goal, sessions.length);
              return (
                <Card key={goal.id}>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-semibold text-sm text-foreground">{goal.goal_summary}</span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">{goal.goal_text}</p>
                        <div className="flex gap-2 mt-2 ml-6">
                          <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                            {goal.timeframe_months}mo
                          </span>
                          <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 capitalize">
                            {goal.intensity}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <GoalAlignmentBar percent={prog.percent} label={prog.label} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── 5. PROGRESS TREND ── */}
        {trendData.some(d => d.score > 0) && (
          <Card>
            <CardHeader><CardTitle className="text-base">30-Day Progress</CardTitle></CardHeader>
            <CardContent className="py-2">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ── 6. VIDEO JOURNEY ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" /> Video Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Record your exercises. Your doctor sees them automatically.
            </p>
            <input ref={fileRef} type="file" accept="video/*" className="hidden"
              onChange={e => { const file = e.target.files?.[0]; if (file) uploadMutation.mutate(file); }} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending} className="rounded-xl flex-1">
                <Upload className="w-4 h-4 mr-1" />
                {uploadMutation.isPending ? "Uploading…" : "Upload Video"}
              </Button>
              {videos.length > 0 && (
                <Button variant="outline" onClick={requestFeedback} disabled={feedbackLoading} className="rounded-xl">
                  {feedbackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1" /> AI Feedback</>}
                </Button>
              )}
            </div>

            {videoFeedback && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
                <div className="flex items-start gap-2"><span className="text-base">✨</span><p className="text-sm text-foreground/90">{videoFeedback.improvement}</p></div>
                <div className="flex items-start gap-2"><span className="text-base">📈</span><p className="text-sm text-foreground/90">{videoFeedback.consistency}</p></div>
                <div className="flex items-start gap-2"><span className="text-base">🎯</span><p className="text-sm text-foreground/90">{videoFeedback.next_focus}</p></div>
                <p className="text-[10px] text-muted-foreground italic">Encouragement only — not medical advice.</p>
              </div>
            )}

            {videos.length >= 2 && (
              <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Compare: First vs Latest</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Earlier</p>
                    <video src={videos[videos.length - 1].video_url ?? ""} controls className="w-full rounded-md max-h-32" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Recent</p>
                    <video src={videos[0].video_url ?? ""} controls className="w-full rounded-md max-h-32" />
                  </div>
                </div>
              </div>
            )}

            {videos.slice(0, 3).map((v: any) => (
              <div key={v.id} className="bg-muted rounded-lg p-3 space-y-2">
                <video src={v.video_url ?? ""} controls className="w-full rounded-md max-h-48" />
                <p className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</p>
                {v.doctor_feedback && (
                  <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-2">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{v.doctor_feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── 7. FUTURE PROJECTION ── */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Future Projection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projection ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Next 1-2 weeks</p>
                  <p className="text-sm text-foreground/90">{projection.short_term}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Mid-term</p>
                  <p className="text-sm text-foreground/90">{projection.mid_term}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={requestProjection} disabled={projLoading} className="rounded-xl">
                  {projLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={requestProjection} disabled={projLoading} className="rounded-xl w-full">
                {projLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating…</> : "Generate My Projection"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── 8. CONNECTED DEVICES — WEARABLES ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Watch className="w-5 h-5 text-primary" /> Wearables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl flex-1" onClick={() => setDeviceModal("wearable")}>
                🍎 Apple Watch
              </Button>
              <Button variant="outline" className="rounded-xl flex-1" onClick={() => setDeviceModal("wearable")}>
                ⌚ Samsung Watch
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Connected: Apple Watch (Demo)
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Moon className="w-4 h-4 text-primary" /> Sleep — Avg 7.4h
                </div>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sleepData}>
                      <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Heart className="w-4 h-4 text-destructive" /> Heart Rate — 75 bpm avg
                </div>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={heartRateData}>
                      <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="bpm" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Activity className="w-4 h-4 text-primary" /> Blood Pressure
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Systolic: <strong className="text-foreground">118</strong></span>
                  <span>Diastolic: <strong className="text-foreground">76</strong></span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Footprints className="w-4 h-4 text-primary" /> Steps — 4,243 avg
                </div>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stepsData}>
                      <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Bar dataKey="steps" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 9. REHAB MACHINES ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" /> Rehab Machines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Connect a machine to auto-track strength and adjust your exercises.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "eGym", icon: "🏋️" },
                { name: "EMS Device", icon: "⚡" },
                { name: "Physio Eq.", icon: "🦿" },
              ].map(m => (
                <Button key={m.name} variant="outline" className="rounded-xl h-auto flex-col py-3 gap-1"
                  onClick={() => { setMachineConnected(true); setDeviceModal("machine"); }}>
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-[10px]">{m.name}</span>
                </Button>
              ))}
            </div>
            {machineConnected && (
              <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Connected: eGym (Demo)
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Last strength</p>
                    <p className="font-semibold text-foreground">42 kg avg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Suggested next</p>
                    <p className="font-semibold text-foreground">3×10 @ 45 kg</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">Auto-adjusted based on your progress.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 10. SMALL WIN ── */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-primary/5">
          <CardContent className="py-4 flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {gam.currentStreak >= 7 ? `${gam.currentStreak}-day streak — incredible!` :
                 gam.currentStreak >= 3 ? `${gam.currentStreak}-day streak going strong` :
                 "Every day counts — start your streak today"}
              </p>
              <p className="text-xs text-muted-foreground">Level {gam.level} · {gam.totalPoints} pts</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Demo modals */}
        <Dialog open={deviceModal !== null} onOpenChange={() => setDeviceModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {deviceModal === "machine" ? "Connect Machine" : "Connect Device"}
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4 space-y-3">
              {deviceModal === "machine" ? <Dumbbell className="w-12 h-12 mx-auto text-primary" /> : <Watch className="w-12 h-12 mx-auto text-primary" />}
              <p className="text-sm text-muted-foreground">
                This is a <strong>demo feature</strong> still under development. Real-time
                {deviceModal === "machine" ? " machine integration" : " device connectivity"} will be available in a future update.
              </p>
              <Button variant="outline" onClick={() => setDeviceModal(null)} className="rounded-xl">Got it</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <PatientNav />
      <Chatbot />
    </div>
  );
};

export default RecoveryJourney;
