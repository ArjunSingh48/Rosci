import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { GamificationBar } from "@/components/GamificationBar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGamification } from "@/hooks/useGamification";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Brain, TrendingUp, Activity, Heart, Moon, Flame, CalendarDays, Star, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const RecoveryInsights = () => {
  const { user, profile } = useAuth();
  const gam = useGamification();
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");
  const limit = timeRange === "week" ? 7 : 30;

  const { data: taskLogs = [] } = useQuery({
    queryKey: ["task-logs-insights", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("daily_tasks_log").select("*").eq("patient_id", user!.id).order("date", { ascending: true });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["rehab-sessions-insights", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("rehabilitation_sessions").select("*").eq("patient_id", user!.id).order("exercise_date", { ascending: true });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: sleepLogs = [] } = useQuery({
    queryKey: ["sleep-insights", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("sleep_logs").select("*").eq("patient_id", user!.id).order("date", { ascending: true }).limit(30);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["check-ins-insights", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("check_ins").select("created_at").eq("patient_id", user!.id).order("created_at", { ascending: false }).limit(90);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Task completion chart
  const dateMap: Record<string, { total: number; completed: number }> = {};
  taskLogs.forEach((t: any) => {
    if (!dateMap[t.date]) dateMap[t.date] = { total: 0, completed: 0 };
    dateMap[t.date].total++;
    if (t.completed) dateMap[t.date].completed++;
  });
  const taskChartData = Object.entries(dateMap).slice(-limit).map(([date, v]) => ({
    date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    rate: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
  }));

  const sessionChartData = sessions.slice(-limit).map((s: any) => ({
    date: new Date(s.exercise_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    score: s.performance_score ?? 0,
  }));

  const sleepChartData = sleepLogs.slice(-limit).map((s: any) => ({
    date: new Date(s.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    hours: Number(s.hours),
  }));

  const totalCompleted = taskLogs.filter((t: any) => t.completed).length;
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((a: number, s: any) => a + (s.performance_score ?? 0), 0) / sessions.length) : 0;
  const avgSleep = sleepLogs.length > 0 ? (sleepLogs.reduce((a: number, s: any) => a + Number(s.hours), 0) / sleepLogs.length).toFixed(1) : "—";

  // Heatmap
  const heatmapDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (34 - i));
    const dateStr = d.toDateString();
    return { date: d, active: checkIns.some((c: any) => new Date(c.created_at).toDateString() === dateStr) };
  });

  // Milestones
  const milestones = gam.earnedBadges.slice(0, 5).map((eb: any) => ({
    icon: eb.badges?.icon ?? "🏅",
    name: eb.badges?.name ?? "Badge",
    date: new Date(eb.earned_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <GamificationBar streak={gam.currentStreak} points={gam.totalPoints} level={gam.level} xpInLevel={gam.xpInLevel} />

        <h1 className="text-2xl font-bold text-foreground">Progress Dashboard</h1>

        {/* Time toggle */}
        <div className="flex gap-2">
          {(["week", "month"] as const).map(t => (
            <button key={t} onClick={() => setTimeRange(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${timeRange === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {t === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold text-primary">{totalCompleted}</p><p className="text-[10px] text-muted-foreground">Tasks Done</p></CardContent></Card>
          <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold text-primary">{avgScore}/10</p><p className="text-[10px] text-muted-foreground">Avg Score</p></CardContent></Card>
          <Card><CardContent className="py-3 text-center"><p className="text-2xl font-bold text-primary">{avgSleep}h</p><p className="text-[10px] text-muted-foreground">Avg Sleep</p></CardContent></Card>
        </div>

        {/* Activity Heatmap */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <p className="font-semibold text-foreground text-sm">Daily Activity</p>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {heatmapDays.map((day, i) => (
                <div key={i} className={`w-full aspect-square rounded-sm ${day.active ? "bg-primary" : "bg-muted"}`} title={day.date.toLocaleDateString()} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Bars */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="font-semibold text-foreground">Recovery Progress</p>
            {[
              { label: "Rehabilitation", icon: Activity, value: Math.min(100, totalCompleted * 2) },
              { label: "Mobility", icon: Heart, value: avgScore * 10 },
              { label: "Sleep Quality", icon: Moon, value: sleepLogs.length > 0 ? Math.round((Number(avgSleep) / 8) * 100) : 0 },
            ].map(({ label, icon: Icon, value }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><Icon className="w-3 h-3" /> {label}</span>
                  <span className="text-foreground font-medium">{value}%</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Task Completion Chart */}
        {taskChartData.length > 1 && (
          <Card>
            <CardContent className="py-4">
              <p className="font-semibold text-foreground mb-3">Task Completion Rate</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={taskChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Session Performance */}
        {sessionChartData.length > 1 && (
          <Card>
            <CardContent className="py-4">
              <p className="font-semibold text-foreground mb-3">Rehab Performance</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sessionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Sleep Trend */}
        {sleepChartData.length > 1 && (
          <Card>
            <CardContent className="py-4">
              <p className="font-semibold text-foreground mb-3">Sleep Trend</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={sleepChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}h`} />
                  <Tooltip formatter={(v: number) => `${v}h`} />
                  <Area type="monotone" dataKey="hours" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" /> Recent Milestones
              </p>
              <div className="space-y-2">
                {milestones.map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-xl">{m.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recovery Prediction */}
        <AIPredictionCard
          rehabWeeks={profile?.rehab_weeks ?? 0}
          streak={gam.currentStreak}
          totalPoints={gam.totalPoints}
          tasksCompleted={totalCompleted}
        />

        {/* Tips */}
        <Card>
          <CardContent className="py-4 space-y-2">
            <p className="font-semibold text-foreground">Focus Areas</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Keep your daily streak going for bonus points</li>
              <li>• Try bite-sized exercises when energy is low</li>
              <li>• Log mood daily to track emotional recovery</li>
              <li>• Celebrate every milestone — you've earned it!</li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

function AIPredictionCard({ rehabWeeks, streak, totalPoints, tasksCompleted }: { rehabWeeks: number; streak: number; totalPoints: number; tasksCompleted: number }) {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("recovery-prediction", {
        body: { rehab_weeks: rehabWeeks, streak, total_points: totalPoints, tasks_completed: tasksCompleted, avg_mood: "neutral" },
      });
      if (fnError) throw fnError;
      setPrediction(data.prediction);
    } catch (e: any) {
      setError("Could not generate prediction right now.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="font-semibold text-foreground text-sm">AI Recovery Prediction</p>
        </div>
        {prediction ? (
          <p className="text-sm text-foreground/80 leading-relaxed">{prediction}</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <Button variant="outline" size="sm" onClick={fetchPrediction} disabled={loading} className="rounded-xl">
            {loading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</> : "Generate Prediction ✨"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default RecoveryInsights;
