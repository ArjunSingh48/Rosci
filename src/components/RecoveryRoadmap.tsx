import { Card, CardContent } from "@/components/ui/card";
import { Check, MapPin } from "lucide-react";

const phases = [
  { id: 1, name: "Early Recovery", weeks: "0–4", description: "Focus on basic mobility, pain management, and mental adjustment.", milestones: ["Complete first exercise", "Build daily check-in habit", "Establish sleep routine"] },
  { id: 2, name: "Strength Building", weeks: "5–12", description: "Gradual increase in resistance exercises and endurance.", milestones: ["7-day streak", "Complete 50 exercises", "Increase rep count"] },
  { id: 3, name: "Mobility Training", weeks: "13–24", description: "Advanced mobility exercises and functional training.", milestones: ["Improved balance score", "Full session completions", "Video comparison shows progress"] },
  { id: 4, name: "Advanced Recovery", weeks: "25+", description: "Maintenance, independence, and long-term goals.", milestones: ["30-day streak", "100+ exercises", "Therapist approval on form"] },
];

function getPhase(weeks: number): number {
  if (weeks <= 4) return 1;
  if (weeks <= 12) return 2;
  if (weeks <= 24) return 3;
  return 4;
}

export function RecoveryRoadmap({ rehabWeeks }: { rehabWeeks: number }) {
  const currentPhase = getPhase(rehabWeeks);

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Recovery Roadmap</h2>
        </div>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
          <div className="space-y-4">
            {phases.map(phase => {
              const isComplete = phase.id < currentPhase;
              const isCurrent = phase.id === currentPhase;
              return (
                <div key={phase.id} className="relative pl-9">
                  {/* Dot */}
                  <div className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 ${
                    isComplete ? "bg-primary border-primary" : isCurrent ? "bg-primary/30 border-primary ring-2 ring-primary/20" : "bg-muted border-border"
                  }`}>
                    {isComplete && <Check className="w-2 h-2 text-primary-foreground absolute top-0 left-0" />}
                  </div>
                  <div className={`rounded-xl p-3 ${isCurrent ? "bg-primary/5 border border-primary/20" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{phase.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Weeks {phase.weeks}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
                    {isCurrent && (
                      <div className="mt-2 space-y-1">
                        {phase.milestones.map((m, i) => (
                          <p key={i} className="text-xs text-foreground/70">→ {m}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
