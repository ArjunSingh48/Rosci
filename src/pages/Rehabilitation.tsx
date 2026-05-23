import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { Chatbot } from "@/components/Chatbot";
import { PatientNav } from "@/components/PatientNav";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Video, Upload, MessageSquare, Star, FileImage } from "lucide-react";
import { useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const exerciseList = [
  { name: "Quad Sets", description: "Tighten the front of your thigh, hold for 5 seconds, then release." },
  { name: "Ankle Pumps", description: "Move your ankles up and down repeatedly to improve circulation." },
  { name: "Passive Leg Raise", description: "With assistance, gently raise your leg and hold briefly." },
  { name: "Seated Breathing Stretch", description: "Sit upright and take deep breaths while gently stretching your arms overhead." },
  { name: "Arm Mobility Stretch", description: "Slowly move your arms in circular motions to maintain shoulder mobility." },
];

const Rehabilitation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const mriRef = useRef<HTMLInputElement | null>(null);
  const [sessionScores, setSessionScores] = useState<Record<string, number>>({});
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [compareVideo1, setCompareVideo1] = useState<string>("");
  const [compareVideo2, setCompareVideo2] = useState<string>("");

  const { data: videos = [] } = useQuery({
    queryKey: ["exercise-videos", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercise_videos")
        .select("*")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["rehab-sessions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("rehabilitation_sessions")
        .select("*")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: mriScans = [] } = useQuery({
    queryKey: ["mri-scans", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("mri_scans")
        .select("*")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, exerciseName }: { file: File; exerciseName: string }) => {
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("exercise-videos").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("exercise-videos").getPublicUrl(path);
      await supabase.from("exercise_videos").insert({
        patient_id: user!.id,
        exercise_name: exerciseName,
        video_url: urlData.publicUrl,
      });
    },
    onSuccess: () => {
      toast({ title: "Video uploaded!" });
      queryClient.invalidateQueries({ queryKey: ["exercise-videos"] });
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const sessionMutation = useMutation({
    mutationFn: async ({ exerciseType, score, notes }: { exerciseType: string; score: number; notes: string }) => {
      await supabase.from("rehabilitation_sessions").insert({
        patient_id: user!.id,
        exercise_type: exerciseType,
        performance_score: score,
        notes: notes || null,
      });
    },
    onSuccess: (_d, vars) => {
      toast({ title: `Session logged for ${vars.exerciseType}!` });
      setSessionScores(p => { const n = { ...p }; delete n[vars.exerciseType]; return n; });
      setSessionNotes(p => { const n = { ...p }; delete n[vars.exerciseType]; return n; });
      queryClient.invalidateQueries({ queryKey: ["rehab-sessions"] });
    },
  });

  const mriUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("mri-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("mri-images").getPublicUrl(path);
      await supabase.from("mri_scans").insert({
        patient_id: user!.id,
        scan_file_url: urlData.publicUrl,
        scan_type: "mri",
      });
    },
    onSuccess: () => {
      toast({ title: "MRI scan uploaded!" });
      queryClient.invalidateQueries({ queryKey: ["mri-scans"] });
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Rehabilitation</h1>
        <p className="text-sm text-muted-foreground">Early-stage exercises to support your recovery. Record and share with your doctor.</p>

        {/* MRI Upload Section */}
        <Card className="border-primary/20">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">MRI Scans</h3>
            </div>
            <input ref={mriRef} type="file" accept="image/*,.dcm" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (file) mriUploadMutation.mutate(file);
            }} />
            <Button variant="outline" size="sm" onClick={() => mriRef.current?.click()} disabled={mriUploadMutation.isPending} className="rounded-xl">
              <Upload className="w-4 h-4 mr-1" /> Upload MRI Scan
            </Button>
            {mriScans.length > 0 && (
              <div className="space-y-1">
                {mriScans.slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s.ai_analysis_status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Comparison */}
        {videos.length >= 2 && (
          <Card className="border-accent/20">
            <CardContent className="py-4 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" /> Video Comparison
              </h3>
              <p className="text-xs text-muted-foreground">Compare your exercise videos side by side to see your progress.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Earlier video</label>
                  <Select value={compareVideo1} onValueChange={setCompareVideo1}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {videos.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>{v.exercise_name} — {new Date(v.created_at).toLocaleDateString()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {compareVideo1 && (
                    <video src={videos.find((v: any) => v.id === compareVideo1)?.video_url ?? ""} controls className="w-full rounded-md max-h-36" />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Recent video</label>
                  <Select value={compareVideo2} onValueChange={setCompareVideo2}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {videos.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>{v.exercise_name} — {new Date(v.created_at).toLocaleDateString()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {compareVideo2 && (
                    <video src={videos.find((v: any) => v.id === compareVideo2)?.video_url ?? ""} controls className="w-full rounded-md max-h-36" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {exerciseList.map(exercise => {
          const exerciseVideos = videos.filter(v => v.exercise_name === exercise.name);
          const recentSessions = sessions.filter(s => s.exercise_type === exercise.name);
          const score = sessionScores[exercise.name] ?? 5;

          return (
            <Card key={exercise.name}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground">{exercise.description}</p>
                  </div>
                  <Video className="w-8 h-8 text-primary shrink-0" />
                </div>

                {/* Session Scoring */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Performance Score</span>
                    <span className="flex items-center gap-1 text-sm font-bold text-primary">
                      <Star className="w-3 h-3" /> {score}/10
                    </span>
                  </div>
                  <Slider
                    value={[score]}
                    onValueChange={([v]) => setSessionScores(p => ({ ...p, [exercise.name]: v }))}
                    min={1} max={10} step={1}
                  />
                  <Textarea
                    placeholder="Session notes (optional)…"
                    value={sessionNotes[exercise.name] || ""}
                    onChange={e => setSessionNotes(p => ({ ...p, [exercise.name]: e.target.value }))}
                    className="resize-none text-sm h-16"
                  />
                  <Button
                    size="sm"
                    onClick={() => sessionMutation.mutate({ exerciseType: exercise.name, score, notes: sessionNotes[exercise.name] || "" })}
                    disabled={sessionMutation.isPending}
                    className="rounded-xl w-full"
                  >
                    Log Session
                  </Button>
                </div>

                {recentSessions.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Last session: {new Date(recentSessions[0].created_at).toLocaleDateString()} — Score: {recentSessions[0].performance_score}/10
                  </div>
                )}

                <input
                  ref={el => { fileRefs.current[exercise.name] = el; }}
                  type="file" accept="video/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) uploadMutation.mutate({ file, exerciseName: exercise.name });
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => fileRefs.current[exercise.name]?.click()} disabled={uploadMutation.isPending} className="rounded-xl">
                  <Upload className="w-4 h-4 mr-1" /> Upload Video
                </Button>

                {exerciseVideos.map(v => (
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
          );
        })}
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

export default Rehabilitation;
