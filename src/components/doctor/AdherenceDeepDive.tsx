import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Clock, Layers } from "lucide-react";

interface Props {
  byTime: Array<{ slot: string; rate: number; total: number }>;
  bySkipped: Array<{ category: string; skipped: number }>;
  insight: string;
}

export function AdherenceDeepDive({ byTime, bySkipped, insight }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <p className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" /> Adherence by Time of Day
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="slot" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                {byTime.map((s, i) => (
                  <Cell key={i} fill={s.rate >= 70 ? "hsl(var(--primary))" : s.rate >= 40 ? "hsl(var(--secondary))" : "hsl(var(--destructive))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-foreground mt-2 italic">{insight}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" /> Most Skipped Categories
          </p>
          {bySkipped.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skipped tasks recorded.</p>
          ) : (
            <div className="space-y-2">
              {bySkipped.slice(0, 5).map(s => (
                <div key={s.category} className="flex justify-between items-center text-sm">
                  <span className="capitalize text-foreground">{s.category}</span>
                  <span className="text-destructive font-medium">{s.skipped} skipped</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
