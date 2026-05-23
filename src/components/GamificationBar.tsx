import { Flame, Star, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface Props {
  streak: number;
  points: number;
  level: number;
  xpInLevel: number;
}

export function GamificationBar({ streak, points, level, xpInLevel }: Props) {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-card border cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/achievements")}
    >
      <div className="flex items-center gap-1 text-sm font-bold text-orange-500">
        <Flame className="w-5 h-5" />
        <span>{streak}</span>
      </div>
      <div className="flex items-center gap-1 text-sm font-semibold text-primary">
        <Star className="w-4 h-4" />
        <span>{points}</span>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground">Lv {level}</span>
        <Progress value={xpInLevel} className="h-2 flex-1" />
        <span className="text-[10px] text-muted-foreground">{xpInLevel}/100</span>
      </div>
      <Trophy className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}
