import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Sparkles, Activity, Heart, Flame } from "lucide-react";
import type { ScoreResult } from "@/lib/recoveryScore";
import type { RiskLevel } from "@/lib/doctorIntelligence";

interface Props {
  score: ScoreResult;
  adherence: number;
  painTrend: { last: number | null; delta: number };
  motivation: number | null;
  risk: RiskLevel;
  aiSummary: string;
  aiLoading: boolean;
}

export function PatientStatePanel({ score, adherence, painTrend, motivation, risk, aiSummary, aiLoading }: Props) {
  const TrendIcon = score.trend === "improving" ? TrendingUp : score.trend === "declining" ? TrendingDown : Minus;
  const trendColor = score.trend === "improving" ? "text-primary" : score.trend === "declining" ? "text-destructive" : "text-muted-foreground";

  const riskVariant = risk === "high" ? "destructive" : risk === "medium" ? "secondary" : "default";
  const riskLabel = risk === "high" ? "High Risk" : risk === "medium" ? "Medium Risk" : "Low Risk";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="py-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Patient State</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-foreground">{score.score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
              <span className={`flex items-center gap-1 text-xs ${trendColor} ml-2`}>
                <TrendIcon className="w-3.5 h-3.5" />
                {score.trend}
              </span>
            </div>
          </div>
          <Badge variant={riskVariant} className="text-xs">{riskLabel}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-background/60 p-2 text-center">
            <Activity className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{adherence}%</p>
            <p className="text-[10px] text-muted-foreground">Adherence</p>
          </div>
          <div className="rounded-lg bg-background/60 p-2 text-center">
            <Heart className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{painTrend.last ?? "—"}{painTrend.last != null && "/10"}</p>
            <p className="text-[10px] text-muted-foreground">Pain {painTrend.delta > 0 ? "↑" : painTrend.delta < 0 ? "↓" : "→"}</p>
          </div>
          <div className="rounded-lg bg-background/60 p-2 text-center">
            <Flame className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{motivation != null ? motivation.toFixed(1) : "—"}</p>
            <p className="text-[10px] text-muted-foreground">Motivation</p>
          </div>
        </div>

        <div className="rounded-lg border border-primary/15 bg-background/40 p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">
              {aiLoading ? "Analyzing patient state…" : aiSummary || "AI summary unavailable."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
