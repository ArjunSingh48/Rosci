import { Progress } from "@/components/ui/progress";

export function GoalAlignmentBar({ percent, label }: { percent: number; label: string }) {
  const tone =
    label === "on track" ? "text-primary" :
    label === "slightly behind" ? "text-foreground" : "text-destructive";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{percent}% on track</span>
        <span className={`font-medium ${tone}`}>{label}</span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}
