import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useGamification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: gamification } = useQuery({
    queryKey: ["gamification", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_gamification")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!data) {
        const { data: newRow } = await supabase
          .from("user_gamification")
          .insert({ user_id: user!.id })
          .select()
          .single();
        return newRow;
      }
      return data;
    },
    enabled: !!user,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data } = await supabase.from("badges").select("*");
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: earnedBadges = [] } = useQuery({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const awardPointsMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      if (!gamification || !user) return;
      const newTotal = (gamification.total_points ?? 0) + amount;
      const newLevel = Math.floor(newTotal / 100) + 1;
      await supabase
        .from("user_gamification")
        .update({ total_points: newTotal, level: newLevel, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      // Check point-based badges
      const pointBadges = [
        { key: "points_50", threshold: 50 },
        { key: "points_100", threshold: 100 },
        { key: "points_250", threshold: 250 },
        { key: "points_500", threshold: 500 },
      ];
      for (const pb of pointBadges) {
        if (newTotal >= pb.threshold) {
          await tryAwardBadge(pb.key);
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gamification"] }),
  });

  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!gamification || !user) return;
      const today = new Date().toISOString().split("T")[0];
      if (gamification.last_check_in_date === today) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];

      const newStreak = gamification.last_check_in_date === yStr
        ? (gamification.current_streak ?? 0) + 1
        : 1;
      const longest = Math.max(newStreak, gamification.longest_streak ?? 0);

      await supabase
        .from("user_gamification")
        .update({
          current_streak: newStreak,
          longest_streak: longest,
          last_check_in_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      // Streak badges
      const streakBadges = [
        { key: "streak_3", threshold: 3 },
        { key: "streak_7", threshold: 7 },
        { key: "streak_14", threshold: 14 },
        { key: "streak_30", threshold: 30 },
      ];
      for (const sb of streakBadges) {
        if (newStreak >= sb.threshold) await tryAwardBadge(sb.key);
      }

      return newStreak;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gamification"] }),
  });

  async function tryAwardBadge(badgeKey: string) {
    if (!user) return;
    const badge = allBadges.find((b: any) => b.key === badgeKey);
    if (!badge) return;
    const alreadyEarned = earnedBadges.some((eb: any) => eb.badge_id === badge.id);
    if (alreadyEarned) return;

    await supabase.from("user_badges").insert({ user_id: user.id, badge_id: badge.id });
    toast({
      title: `${badge.icon} Badge Unlocked!`,
      description: badge.name,
    });
    qc.invalidateQueries({ queryKey: ["user-badges"] });
  }

  return {
    gamification,
    allBadges,
    earnedBadges,
    awardPoints: (amount: number, reason: string) => awardPointsMutation.mutateAsync({ amount, reason }),
    updateStreak: () => updateStreakMutation.mutateAsync(),
    tryAwardBadge,
    level: gamification?.level ?? 1,
    totalPoints: gamification?.total_points ?? 0,
    currentStreak: gamification?.current_streak ?? 0,
    xpInLevel: (gamification?.total_points ?? 0) % 100,
  };
}
