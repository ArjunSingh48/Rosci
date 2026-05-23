import { TopBar } from "@/components/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Users, FileText, Video, Clock, BarChart3, Activity, Brain, Sparkles, Heart, Moon, Apple } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: patientIds = [] } = useQuery({
    queryKey: ["doctor-patient-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("doctor_patients").select("patient_id").eq("doctor_id", user!.id);
      return data?.map(a => a.patient_id) ?? [];
    },
    enabled: !!user,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["doctor-patients", patientIds],
    queryFn: async () => {
      if (!patientIds.length) return [];
      const { data } = await supabase.from("profiles").select("*").in("id", patientIds);
      return data ?? [];
    },
    enabled: patientIds.length > 0,
  });

  const { data: pendingReports = [] } = useQuery({
    queryKey: ["pending-reports", patientIds],
    queryFn: async () => {
      if (!patientIds.length) return [];
      const { data } = await supabase
        .from("medical_reports")
        .select("*, profiles:patient_id(full_name)")
        .in("patient_id", patientIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: patientIds.length > 0,
  });

  const { data: recentVideos = [] } = useQuery({
    queryKey: ["recent-videos", patientIds],
    queryFn: async () => {
      if (!patientIds.length) return [];
      const { data } = await supabase
        .from("exercise_videos")
        .select("*, profiles:patient_id(full_name)")
        .in("patient_id", patientIds)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: patientIds.length > 0,
  });

  const { data: taskStats = { total: 0, completed: 0 } } = useQuery({
    queryKey: ["doctor-task-stats", patientIds],
    queryFn: async () => {
      if (!patientIds.length) return { total: 0, completed: 0 };
      const { data } = await supabase.from("daily_tasks_log").select("completed").in("patient_id", patientIds);
      const total = data?.length ?? 0;
      const completed = data?.filter(t => t.completed).length ?? 0;
      return { total, completed };
    },
    enabled: patientIds.length > 0,
  });

  const { data: moodData = [] } = useQuery({
    queryKey: ["doctor-mood-stats", patientIds],
    queryFn: async () => {
      if (!patientIds.length) return [];
      const { data } = await supabase.from("check_ins").select("mood, created_at").in("patient_id", patientIds).order("created_at", { ascending: true }).limit(50);
      return data ?? [];
    },
    enabled: patientIds.length > 0,
  });

  const { data: sleepData = [] } = useQuery({
    queryKey: ["doctor-sleep-stats", patientIds],
    queryFn: async () => {
      if (!patientIds.length) return [];
      const { data } = await supabase.from("sleep_logs").select("hours, date, patient_id").in("patient_id", patientIds).order("date", { ascending: true }).limit(50);
      return data ?? [];
    },
    enabled: patientIds.length > 0,
  });

  const { data: mriScans = [] } = useQuery({
    queryKey: ["doctor-mri-scans", patientIds],
    queryFn: async () => {
      if (!patientIds.length) return [];
      const { data } = await supabase.from("mri_scans").select("*").in("patient_id", patientIds).order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
    enabled: patientIds.length > 0,
  });

  const adherenceRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  // Mood trend chart
  const moodValues: Record<string, number> = { great: 3, okay: 2, bad: 1 };
  const moodChartData = moodData.slice(-20).map(m => ({
    date: new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
    mood: moodValues[m.mood] ?? 2,
  }));

  // Sleep chart
  const sleepChartData = sleepData.slice(-20).map(s => ({
    date: new Date(s.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    hours: Number(s.hours),
  }));

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Doctor Dashboard</h1>

        <Tabs defaultValue="overview">
          <TabsList className="w-full flex-wrap">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="patients" className="flex-1">Patients</TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">Reports</TabsTrigger>
            <TabsTrigger value="vitals" className="flex-1">Vitals</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <Card><CardContent className="py-4 text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-primary">{patients.length}</p>
                <p className="text-xs text-muted-foreground">Patients</p>
              </CardContent></Card>
              <Card><CardContent className="py-4 text-center">
                <FileText className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-destructive">{pendingReports.length}</p>
                <p className="text-xs text-muted-foreground">Pending Reports</p>
              </CardContent></Card>
              <Card><CardContent className="py-4 text-center">
                <BarChart3 className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-primary">{adherenceRate}%</p>
                <p className="text-xs text-muted-foreground">Adherence Rate</p>
              </CardContent></Card>
              <Card><CardContent className="py-4 text-center">
                <Activity className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-primary">{mriScans.length}</p>
                <p className="text-xs text-muted-foreground">MRI Scans</p>
              </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-2 mt-4">
            {patients.map((p: any) => (
              <Card key={p.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/doctor/patient/${p.id}`)}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{p.full_name}</p>
                    <p className="text-sm text-muted-foreground">Week {p.rehab_weeks} • {p.injury_level} • {p.rehabilitation_stage || "early"}</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </CardContent>
              </Card>
            ))}
            {patients.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No patients assigned yet.</p>}
          </TabsContent>

          <TabsContent value="reports" className="space-y-2 mt-4">
            {pendingReports.map((r: any) => (
              <Card key={r.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/doctor/patient/${r.patient_id}`)}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-secondary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </CardContent>
              </Card>
            ))}
            {pendingReports.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending reports.</p>}
          </TabsContent>

          {/* Vitals Tab */}
          <TabsContent value="vitals" className="space-y-4 mt-4">
            {moodChartData.length > 1 && (
              <Card>
                <CardContent className="py-4">
                  <p className="font-semibold text-foreground mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Patient Mood Trends</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={moodChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => ["", "Bad", "Okay", "Great"][v] || ""} />
                      <Tooltip formatter={(v: number) => ["", "Bad", "Okay", "Great"][v] || ""} />
                      <Bar dataKey="mood" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {sleepChartData.length > 1 && (
              <Card>
                <CardContent className="py-4">
                  <p className="font-semibold text-foreground mb-3 flex items-center gap-2"><Moon className="w-4 h-4 text-primary" /> Patient Sleep Data</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={sleepChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}h`} />
                      <Tooltip formatter={(v: number) => `${v}h`} />
                      <Bar dataKey="hours" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {moodChartData.length <= 1 && sleepChartData.length <= 1 && (
              <p className="text-sm text-muted-foreground text-center py-4">Patient vitals data will appear here as patients log sleep and mood.</p>
            )}
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            <Card className="border-dashed border-2 border-primary/20">
              <CardContent className="py-8 text-center space-y-4">
                <Brain className="w-8 h-8 text-primary mx-auto" />
                <h3 className="text-lg font-semibold text-foreground">AI Spine Analysis</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  AI spine analysis coming soon. This module will provide MRI analysis results, predicted recovery trajectories, injury region visualization, and rehabilitation recommendations.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mt-4">
                  {["MRI Analysis", "Recovery Prediction", "Injury Detection", "3D Spine Model"].map(label => (
                    <div key={label} className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <p className="text-xs text-primary mt-1">Coming Soon</p>
                    </div>
                  ))}
                </div>
                {mriScans.length > 0 && (
                  <div className="mt-4 text-left max-w-sm mx-auto space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Recent MRI Uploads</p>
                    {mriScans.slice(0, 3).map(s => (
                      <div key={s.id} className="flex justify-between text-xs bg-muted rounded p-2">
                        <span className="text-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                        <Badge variant="secondary" className="text-xs">{s.ai_analysis_status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center gap-1 text-xs text-primary pt-2">
                  <Sparkles className="w-3 h-3" />
                  <span>Powered by AI Recovery Engine</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DoctorDashboard;
