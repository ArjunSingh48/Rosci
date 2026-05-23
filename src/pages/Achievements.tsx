import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Chatbot } from "@/components/Chatbot";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useGamification } from "@/hooks/useGamification";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Star, Trophy, CalendarDays } from "lucide-react";

const Achievements = () => {
  const { user } = useAuth();
  const { allBadges, earnedBadges, level, totalPoints, currentStreak, xpInLevel, gamification } = useGamification();

  // Check-in history for heatmap
  const { data: checkIns = [] } = useQuery({
    queryKey: ["check-ins-heatmap", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("check_ins")
        .select("created_at")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(90);
      return data ?? [];
    },
    enabled: !!user,
  });

  const earnedBadgeIds = new Set(earnedBadges.map((eb: any) => eb.badge_id));

  // Build heatmap for last 35 days
  const heatmapDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const dateStr = d.toDateString();
    const hasCheckIn = checkIns.some((c: any) => new Date(c.created_at).toDateString() === dateStr);
    return { date: d, active: hasCheckIn };
  });

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Achievements</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="py-4 text-center">
              <Flame className="w-6 h-6 mx-auto text-orange-500 mb-1" />
              <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
              <p className="text-[10px] text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="py-4 text-center">
              <Star className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
              <p className="text-[10px] text-muted-foreground">Total Points</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="py-4 text-center">
              <Trophy className="w-6 h-6 mx-auto text-accent-foreground mb-1" />
              <p className="text-2xl font-bold text-foreground">Lv {level}</p>
              <p className="text-[10px] text-muted-foreground">Current Level</p>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card>
          <CardContent className="py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-foreground">Level {level}</span>
              <span className="text-muted-foreground">{xpInLevel}/100 XP</span>
            </div>
            <Progress value={xpInLevel} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {100 - xpInLevel} XP to Level {level + 1}
            </p>
          </CardContent>
        </Card>

        {/* Streak Heatmap */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <p className="font-semibold text-foreground text-sm">Activity (Last 35 Days)</p>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {heatmapDays.map((day, i) => (
                <div
                  key={i}
                  className={`w-full aspect-square rounded-sm ${
                    day.active ? "bg-primary" : "bg-muted"
                  }`}
                  title={day.date.toLocaleDateString()}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
              <span>Inactive</span>
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span>Active</span>
            </div>
          </CardContent>
        </Card>

        {/* Badges Grid */}
        <div>
          <h2 className="font-semibold text-foreground mb-3">Badges ({earnedBadges.length}/{allBadges.length})</h2>
          <div className="grid grid-cols-3 gap-3">
            {allBadges.map((badge: any) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <Card
                  key={badge.id}
                  className={`text-center transition-all ${
                    earned ? "border-primary/30 bg-primary/5" : "opacity-40 grayscale"
                  }`}
                >
                  <CardContent className="py-4 space-y-1">
                    <span className="text-3xl">{badge.icon}</span>
                    <p className="text-xs font-semibold text-foreground leading-tight">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{badge.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Longest Streak */}
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <p className="text-3xl font-bold text-foreground">{gamification?.longest_streak ?? 0} days</p>
          </CardContent>
        </Card>
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

export default Achievements;
