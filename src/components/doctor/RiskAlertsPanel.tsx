import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { Alert } from "@/lib/doctorIntelligence";

const URGENCY_STYLES = {
  critical: { bar: "bg-destructive", text: "text-destructive", Icon: AlertTriangle, label: "CRITICAL" },
  high: { bar: "bg-destructive/70", text: "text-destructive", Icon: AlertCircle, label: "HIGH" },
  medium: { bar: "bg-secondary", text: "text-foreground", Icon: AlertCircle, label: "MEDIUM" },
  low: { bar: "bg-muted-foreground/40", text: "text-muted-foreground", Icon: Info, label: "LOW" },
} as const;

export function RiskAlertsPanel({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          No active alerts. Patient is stable.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-destructive" /> Risk Alerts ({alerts.length})
        </p>
        {alerts.map(a => {
          const s = URGENCY_STYLES[a.urgency];
          return (
            <div key={a.id} className="flex gap-2 rounded-lg border border-border p-2.5 bg-background">
              <div className={`w-1 rounded-full ${s.bar}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <s.Icon className={`w-3.5 h-3.5 ${s.text}`} />
                  <span className={`text-[10px] font-semibold ${s.text}`}>{s.label}</span>
                  <span className="text-sm font-medium text-foreground truncate">{a.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
