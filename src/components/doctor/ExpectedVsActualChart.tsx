import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Point { week: number; expected: number; actual: number | null }

export function ExpectedVsActualChart({ data, gapLabel, delta }: { data: Point[]; gapLabel: string; delta: number }) {
  const gapColor = Math.abs(delta) < 5 ? "text-muted-foreground" : delta > 0 ? "text-primary" : "text-destructive";
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-foreground text-sm">Expected vs Actual Recovery</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `W${v}`} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="expected" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" dot={false} name="Expected" />
            <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} connectNulls dot={{ r: 3 }} name="Actual" />
          </LineChart>
        </ResponsiveContainer>
        <p className={`text-sm mt-2 font-medium ${gapColor}`}>{gapLabel}</p>
      </CardContent>
    </Card>
  );
}
