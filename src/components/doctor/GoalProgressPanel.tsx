import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { goalProgress } from "@/lib/recoveryScore";
import { projectTimeToGoal } from "@/lib/doctorIntelligence";

interface Goal {
  id: string;
  goal_summary: string;
  goal_text: string;
  timeframe_months: number;
  intensity: string;
  created_at: string;
}

export function GoalProgressPanel({ goals, sessionsCount }: { goals: Goal[]; sessionsCount: number }) {
  if (!goals.length) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          Patient has not set any recovery goals yet.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Goal Tracking
        </p>
        {goals.map(g => {
          const { percent, label } = goalProgress(g, sessionsCount);
          const paceRatio = percent / 100;
          const projection = projectTimeToGoal(g, paceRatio);
          return (
            <div key={g.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm font-medium text-foreground">{g.goal_summary}</p>
                <span className="text-xs text-muted-foreground shrink-0">{g.timeframe_months}mo</span>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{percent}% progress</span>
                  <span className="font-medium text-foreground">{label}</span>
                </div>
                <Progress value={percent} className="h-1.5" />
              </div>
              <p className="text-xs text-muted-foreground italic">{projection}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
