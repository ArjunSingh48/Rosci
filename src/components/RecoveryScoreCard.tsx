import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import type { ScoreResult } from "@/lib/recoveryScore";

export function RecoveryScoreCard({ result }: { result: ScoreResult }) {
  const [open, setOpen] = useState(false);
  const { score, trend, breakdown } = result;

  const TrendIcon = trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus;
  const trendColor =
    trend === "improving" ? "text-primary" : trend === "declining" ? "text-destructive" : "text-muted-foreground";
  const trendLabel =
    trend === "improving" ? "Improving" : trend === "declining" ? "Needs attention" : "Steady";

  // Circular progress
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="py-5">
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r={radius}
                stroke="hsl(var(--primary))"
                strokeWidth="8" fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{score}</span>
              <span className="text-[10px] text-muted-foreground">of 100</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Recovery Score</p>
            <h2 className="text-lg font-semibold text-foreground">
              {score >= 75 ? "Strong momentum" : score >= 50 ? "Steady progress" : score >= 25 ? "Building up" : "Just getting started"}
            </h2>
            <div className={`flex items-center gap-1 mt-1 text-sm ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="font-medium">{trendLabel}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setOpen(o => !o)}
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          How is this calculated? {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {open && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {[
              { label: "Daily tasks", val: breakdown.tasks, weight: "25%" },
              { label: "Consistency", val: breakdown.consistency, weight: "20%" },
              { label: "Exercise performance", val: breakdown.performance, weight: "20%" },
              { label: "Sleep", val: breakdown.sleep, weight: "10%" },
              { label: "Mood & energy", val: breakdown.wellbeing, weight: "10%" },
              { label: "Goal alignment", val: breakdown.goalAlignment, weight: "15%" },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-2 text-xs">
                <span className="flex-1 text-muted-foreground">{row.label}</span>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${row.val}%` }} />
                </div>
                <span className="text-foreground font-medium w-8 text-right">{Math.round(row.val)}</span>
                <span className="text-muted-foreground w-8 text-right">{row.weight}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
