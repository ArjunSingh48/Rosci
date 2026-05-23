import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Moon } from "lucide-react";

const WellBeingSleep = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hours, setHours] = useState("7");
  const [quality, setQuality] = useState("fair");
  const [notes, setNotes] = useState("");

  const { data: logs = [] } = useQuery({
    queryKey: ["sleep-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("sleep_logs")
        .select("*")
        .eq("patient_id", user!.id)
        .order("date", { ascending: false })
        .limit(14);
      return data ?? [];
    },
    enabled: !!user,
  });

  const todayLog = logs.find(l => l.date === new Date().toISOString().split("T")[0]);

  const logMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("sleep_logs").insert({
        patient_id: user!.id,
        hours: parseFloat(hours),
        quality: quality as any,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Sleep logged!" });
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["sleep-logs"] });
    },
  });

  const avgHours = logs.length > 0
    ? (logs.reduce((sum, l) => sum + Number(l.hours), 0) / logs.length).toFixed(1)
    : "—";

  const getFeedback = () => {
    if (!todayLog) return null;
    const h = Number(todayLog.hours);
    if (h >= 7) return "You slept well — good for recovery! 🌟";
    if (h >= 5) return "You slept less than usual. Pain or fatigue may be affecting sleep.";
    return "Very little sleep. Consider speaking with your doctor about sleep quality.";
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">My Sleep</h1>

        {todayLog ? (
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="py-4 text-center">
              <Moon className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-lg font-semibold text-foreground">{todayLog.hours}h — {todayLog.quality}</p>
              <p className="text-sm text-muted-foreground mt-1">{getFeedback()}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-4 space-y-4">
              <p className="font-semibold text-foreground">Log today's sleep</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Hours</Label>
                  <Input type="number" min={0} max={24} step={0.5} value={hours} onChange={e => setHours(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} className="resize-none" />
              <Button onClick={() => logMutation.mutate()} disabled={logMutation.isPending} className="w-full rounded-xl">
                {logMutation.isPending ? "Saving…" : "Log Sleep"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">Average (last 14 days): <span className="font-bold text-foreground">{avgHours}h</span></p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <p className="font-semibold text-foreground text-sm">Recent Logs</p>
          {logs.map(l => (
            <Card key={l.id}>
              <CardContent className="py-3 flex justify-between items-center">
                <span className="text-sm text-foreground">{l.date}</span>
                <span className="text-sm font-medium text-foreground">{l.hours}h — <span className="capitalize">{l.quality}</span></span>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

export default WellBeingSleep;
