import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const WellBeingRecovery = () => {
  const { user, profile } = useAuth();

  const { data: checkIns = [] } = useQuery({
    queryKey: ["check-ins-chart", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("check_ins")
        .select("*")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: true })
        .limit(30);
      return data ?? [];
    },
    enabled: !!user,
  });

  const moodMap = { great: 3, okay: 2, bad: 1 };
  const chartData = checkIns.map(c => ({
    date: new Date(c.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
    mood: moodMap[c.mood] || 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">My Recovery Journey</h1>

        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-primary">Week {profile?.rehab_weeks ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Every step forward matters. You're doing great!</p>
          </CardContent>
        </Card>

        {chartData.length > 1 && (
          <Card>
            <CardContent className="py-4">
              <p className="font-semibold text-foreground mb-3">Mood Trend</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={v => ["", "Bad", "Okay", "Great"][v]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="py-4">
            <p className="font-semibold text-foreground mb-2">Suggested Focus Areas</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Continue daily check-ins to track your emotional health</li>
              <li>• Focus on gentle mobility exercises this week</li>
              <li>• Ensure adequate protein intake for tissue repair</li>
              <li>• Practice deep breathing for pain management</li>
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

export default WellBeingRecovery;
