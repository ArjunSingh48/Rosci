import { useParams } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { Smile, Meh, Frown, CheckCircle, Star, FileImage, Brain, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { computeRecoveryScore } from "@/lib/recoveryScore";
import {
  computeAlerts, deriveRiskLevel, expectedCurve, actualCurve, computeGap,
  adherenceByTimeOfDay, skippedByCategory, adherenceInsight,
} from "@/lib/doctorIntelligence";
import { PatientStatePanel } from "@/components/doctor/PatientStatePanel";
import { RiskAlertsPanel } from "@/components/doctor/RiskAlertsPanel";
import { ExpectedVsActualChart } from "@/components/doctor/ExpectedVsActualChart";
import { GoalProgressPanel } from "@/components/doctor/GoalProgressPanel";
import { AdherenceDeepDive } from "@/components/doctor/AdherenceDeepDive";
import { AISuggestionsPanel } from "@/components/doctor/AISuggestionsPanel";
import { WeeklySummaryCard } from "@/components/doctor/WeeklySummaryCard";
import { VideoComparisonPanel } from "@/components/doctor/VideoComparisonPanel";

const moodIcons = { great: Smile, okay: Meh, bad: Frown };

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patient } = useQuery({
    queryKey: ["patient-profile", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["patient-reports", id],
    queryFn: async () => (await supabase.from("medical_reports").select("*").eq("patient_id", id!).order("created_at", { ascending: false })).data ?? [],
    enabled: !!id,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["patient-videos", id],
    queryFn: async () => (await supabase.from("exercise_videos").select("*").eq("patient_id", id!).order("created_at", { ascending: false })).data ?? [],
    enabled: !!id,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["patient-checkins", id],
    queryFn: async () => (await supabase.from("check_ins").select("*").eq("patient_id", id!).order("created_at", { ascending: false })).data ?? [],
    enabled: !!id,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["patient-sessions", id],
    queryFn: async () => (await supabase.from("rehabilitation_sessions").select("*").eq("patient_id", id!).order("exercise_date", { ascending: false })).data ?? [],
    enabled: !!id,
  });

  const { data: mriScans = [] } = useQuery({
    queryKey: ["patient-mri", id],
    queryFn: async () => (await supabase.from("mri_scans").select("*").eq("patient_id", id!).order("created_at", { ascending: false })).data ?? [],
    enabled: !!id,
  });

  const { data: sleepLogs = [] } = useQuery({
    queryKey: ["patient-sleep", id],
    queryFn: async () => (await supabase.from("sleep_logs").select("*").eq("patient_id", id!).order("date", { ascending: false }).limit(60)).data ?? [],
    enabled: !!id,
  });

  const { data: taskLogs = [] } = useQuery({
    queryKey: ["patient-tasks-detail", id],
    queryFn: async () => (await supabase.from("daily_tasks_log").select("*").eq("patient_id", id!).order("created_at", { ascending: false }).limit(200)).data ?? [],
    enabled: !!id,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["patient-goals", id],
    queryFn: async () => (await supabase.from("recovery_goals").select("*").eq("user_id", id!).order("created_at", { ascending: false })).data ?? [],
    enabled: !!id,
  });

  const { data: gamification } = useQuery({
    queryKey: ["patient-gamification", id],
    queryFn: async () => (await supabase.from("user_gamification").select("current_streak").eq("user_id", id!).maybeSingle()).data,
    enabled: !!id,
  });

  // Report approval
  const [summaryInputs, setSummaryInputs] = useState<Record<string, string>>({});
  const approveMutation = useMutation({
    mutationFn: async ({ reportId, summary }: { reportId: string; summary: string }) => {
      await supabase.from("medical_reports").update({
        simplified_summary: summary,
        status: "approved" as const,
        approved_by: user!.id,
      }).eq("id", reportId);
    },
    onSuccess: () => {
      toast({ title: "Report approved & published!" });
      queryClient.invalidateQueries({ queryKey: ["patient-reports"] });
    },
  });

  // Video feedback
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const feedbackMutation = useMutation({
    mutationFn: async ({ videoId, feedback }: { videoId: string; feedback: string }) => {
      await supabase.from("exercise_videos").update({ doctor_feedback: feedback }).eq("id", videoId);
    },
    onSuccess: () => {
      toast({ title: "Feedback saved!" });
      queryClient.invalidateQueries({ queryKey: ["patient-videos"] });
    },
  });

  // ---------- Intelligence computations ----------
  const totalCompleted = taskLogs.filter(t => t.completed).length;
  const totalTasks = taskLogs.length;
  const adherence = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.performance_score ?? 0), 0) / sessions.length) : 0;
  const avgSleep = sleepLogs.length > 0 ? (sleepLogs.reduce((a, s) => a + Number(s.hours), 0) / sleepLogs.length).toFixed(1) : "—";

  const scoreResult = useMemo(() => computeRecoveryScore({
    taskLogs: taskLogs.map(t => ({ date: t.date, completed: t.completed })),
    streak: gamification?.current_streak ?? 0,
    sessions: sessions.map(s => ({ exercise_date: s.exercise_date, performance_score: s.performance_score })),
    sleepLogs: sleepLogs.map(s => ({ date: s.date, hours: s.hours })),
    checkIns: checkIns.map(c => ({ created_at: c.created_at, mood: c.mood, energy_level: c.energy_level, pain_level: c.pain_level })),
    goals: goals.map(g => ({ created_at: g.created_at, timeframe_months: g.timeframe_months })),
  }), [taskLogs, sessions, sleepLogs, checkIns, goals, gamification?.current_streak]);

  const alerts = useMemo(() => computeAlerts({
    taskLogs: taskLogs.map(t => ({ date: t.date, completed: t.completed, skipped: t.skipped, created_at: t.created_at, task_category: t.task_category })),
    checkIns: checkIns.map(c => ({ created_at: c.created_at, pain_level: c.pain_level, motivation_level: c.motivation_level })),
    sleepLogs: sleepLogs.map(s => ({ date: s.date, hours: s.hours })),
    sessions: sessions.map(s => ({ exercise_date: s.exercise_date, performance_score: s.performance_score })),
  }), [taskLogs, checkIns, sleepLogs, sessions]);

  const risk = useMemo(() => deriveRiskLevel({ score: scoreResult.score, adherence, alerts }), [scoreResult.score, adherence, alerts]);

  const lastPain = checkIns.find(c => c.pain_level != null)?.pain_level ?? null;
  const last7Pain = checkIns.filter(c => c.pain_level != null && (Date.now() - new Date(c.created_at).getTime()) / 86400000 <= 7).map(c => c.pain_level as number);
  const prior7Pain = checkIns.filter(c => {
    if (c.pain_level == null) return false;
    const d = (Date.now() - new Date(c.created_at).getTime()) / 86400000;
    return d > 7 && d <= 14;
  }).map(c => c.pain_level as number);
  const painDelta = (last7Pain.length && prior7Pain.length)
    ? (last7Pain.reduce((a, b) => a + b, 0) / last7Pain.length) - (prior7Pain.reduce((a, b) => a + b, 0) / prior7Pain.length)
    : 0;
  const motivationAvg = checkIns.filter(c => c.motivation_level != null).length
    ? checkIns.reduce((a, c) => a + (c.motivation_level ?? 0), 0) / checkIns.filter(c => c.motivation_level != null).length
    : null;

  const expectedData = useMemo(() => expectedCurve(patient?.rehab_weeks ?? 0), [patient?.rehab_weeks]);
  const actualData = useMemo(() => actualCurve({
    rehabWeeks: patient?.rehab_weeks ?? 0,
    sessions: sessions.map(s => ({ exercise_date: s.exercise_date, performance_score: s.performance_score })),
    taskLogs: taskLogs.map(t => ({ date: t.date, completed: t.completed })),
  }), [patient?.rehab_weeks, sessions, taskLogs]);
  const chartData = expectedData.map(e => ({ ...e, actual: actualData.find(a => a.week === e.week)?.actual ?? null }));
  const gap = computeGap(actualData, expectedData);

  const byTime = useMemo(() => adherenceByTimeOfDay(taskLogs.map(t => ({ created_at: t.created_at, completed: t.completed }))), [taskLogs]);
  const bySkipped = useMemo(() => skippedByCategory(taskLogs.map(t => ({ skipped: t.skipped, task_category: t.task_category }))), [taskLogs]);
  const insight = useMemo(() => adherenceInsight(byTime), [byTime]);

  // AI summary sentence
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  useEffect(() => {
    if (!id || !patient || aiSummary || aiLoading) return;
    setAiLoading(true);
    supabase.functions.invoke("doctor-suggestions", { body: { patientId: id, mode: "summary" } })
      .then(({ data, error }) => {
        if (error) throw error;
        setAiSummary(data?.summary || "");
      })
      .catch(() => setAiSummary("AI summary unavailable."))
      .finally(() => setAiLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, patient]);

  // Session chart
  const sessionChartData = sessions.slice(-14).reverse().map(s => ({
    date: new Date(s.exercise_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    score: s.performance_score ?? 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-1">{patient?.full_name}</h1>
        <p className="text-muted-foreground mb-4">
          Week {patient?.rehab_weeks} • {patient?.injury_level}
          {patient?.rehabilitation_stage && ` • Stage: ${patient.rehabilitation_stage}`}
        </p>

        <Tabs defaultValue="intelligence">
          <TabsList className="w-full flex-wrap h-auto">
            <TabsTrigger value="intelligence" className="flex-1">Intelligence</TabsTrigger>
            <TabsTrigger value="adherence" className="flex-1">Adherence</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">AI</TabsTrigger>
            <TabsTrigger value="videos" className="flex-1">Videos</TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">Reports</TabsTrigger>
            <TabsTrigger value="sessions" className="flex-1">Sessions</TabsTrigger>
            <TabsTrigger value="mri" className="flex-1">MRI</TabsTrigger>
            <TabsTrigger value="mood" className="flex-1">Mood</TabsTrigger>
          </TabsList>

          {/* INTELLIGENCE TAB */}
          <TabsContent value="intelligence" className="space-y-4 mt-4">
            <PatientStatePanel
              score={scoreResult}
              adherence={adherence}
              painTrend={{ last: lastPain, delta: painDelta }}
              motivation={motivationAvg}
              risk={risk}
              aiSummary={aiSummary}
              aiLoading={aiLoading}
            />
            <RiskAlertsPanel alerts={alerts} />
            <ExpectedVsActualChart data={chartData} gapLabel={gap.label} delta={gap.delta} />
            <GoalProgressPanel goals={goals as any} sessionsCount={sessions.length} />
          </TabsContent>

          {/* ADHERENCE TAB */}
          <TabsContent value="adherence" className="space-y-4 mt-4">
            <Card>
              <CardContent className="py-4 grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-bold text-primary">{adherence}%</p><p className="text-xs text-muted-foreground">Overall</p></div>
                <div><p className="text-2xl font-bold text-primary">{avgScore}/10</p><p className="text-xs text-muted-foreground">Avg Score</p></div>
                <div><p className="text-2xl font-bold text-primary">{avgSleep}h</p><p className="text-xs text-muted-foreground">Avg Sleep</p></div>
              </CardContent>
            </Card>
            <AdherenceDeepDive byTime={byTime} bySkipped={bySkipped} insight={insight} />
          </TabsContent>

          {/* AI TAB */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            <AISuggestionsPanel patientId={id!} />
            <WeeklySummaryCard patientId={id!} patientName={patient?.full_name || "Patient"} />
          </TabsContent>

          {/* VIDEOS TAB */}
          <TabsContent value="videos" className="space-y-4 mt-4">
            <VideoComparisonPanel videos={videos as any} />
            {videos.map(v => (
              <Card key={v.id}>
                <CardContent className="py-4 space-y-3">
                  <p className="font-medium text-foreground">{v.exercise_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</p>
                  {v.video_url && <video src={v.video_url} controls className="w-full rounded-md max-h-48" />}
                  {v.doctor_feedback ? (
                    <div className="bg-primary/5 rounded-lg p-2"><p className="text-sm text-foreground">{v.doctor_feedback}</p></div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea placeholder="Write feedback…" value={feedbackInputs[v.id] || ""} onChange={e => setFeedbackInputs(p => ({ ...p, [v.id]: e.target.value }))} />
                      <Button size="sm" onClick={() => feedbackMutation.mutate({ videoId: v.id, feedback: feedbackInputs[v.id] || "" })} disabled={!feedbackInputs[v.id]?.trim() || feedbackMutation.isPending} className="rounded-xl">Save Feedback</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="space-y-3 mt-4">
            {reports.map(r => (
              <Card key={r.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
                  </div>
                  {r.original_file_url && (
                    <a href={r.original_file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">View Original PDF</a>
                  )}
                  {r.status === "pending" && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Write a simplified explanation for the patient…"
                        value={summaryInputs[r.id] || ""}
                        onChange={e => setSummaryInputs(p => ({ ...p, [r.id]: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => approveMutation.mutate({ reportId: r.id, summary: summaryInputs[r.id] || "" })} disabled={!summaryInputs[r.id]?.trim() || approveMutation.isPending} className="rounded-xl">
                        <CheckCircle className="w-4 h-4 mr-1" /> Publish to Patient
                      </Button>
                    </div>
                  )}
                  {r.simplified_summary && (
                    <div className="bg-accent/20 rounded-lg p-3 border border-accent/30">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Simplified Summary</p>
                      <p className="text-sm text-foreground">{r.simplified_summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* SESSIONS TAB */}
          <TabsContent value="sessions" className="space-y-3 mt-4">
            {sessionChartData.length > 1 && (
              <Card>
                <CardContent className="py-4">
                  <p className="font-semibold text-foreground mb-3">Session Performance Trend</p>
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
            {sessions.map(s => (
              <Card key={s.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.exercise_type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.exercise_date).toLocaleDateString()}</p>
                    {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">{s.performance_score}/10</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {sessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No rehabilitation sessions logged yet.</p>}
          </TabsContent>

          {/* MRI TAB */}
          <TabsContent value="mri" className="space-y-3 mt-4">
            {mriScans.map(s => (
              <Card key={s.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.scan_type?.toUpperCase()} Scan</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{s.ai_analysis_status}</Badge>
                </CardContent>
              </Card>
            ))}
            {mriScans.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No MRI scans uploaded.</p>}
            <Card className="border-dashed border-2 border-primary/20">
              <CardContent className="py-4 text-center space-y-2">
                <Brain className="w-6 h-6 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">AI MRI analysis will be available once the computer vision module is integrated.</p>
                <div className="flex items-center justify-center gap-1 text-xs text-primary">
                  <Sparkles className="w-3 h-3" /><span>Powered by AI Recovery Engine</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MOOD TAB */}
          <TabsContent value="mood" className="space-y-3 mt-4">
            {checkIns.map(c => {
              const Icon = moodIcons[c.mood as keyof typeof moodIcons] ?? Meh;
              return (
                <Card key={c.id}>
                  <CardContent className="py-3 flex items-center gap-3">
                    <Icon className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground capitalize">{c.mood}</p>
                      {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PatientDetail;
