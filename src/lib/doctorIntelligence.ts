// Pure intelligence functions for the doctor portal
// All inputs come from existing Supabase tables; no DB changes.

export type Urgency = "critical" | "high" | "medium" | "low";

export type Alert = {
  id: string;
  urgency: Urgency;
  title: string;
  detail: string;
};

const URGENCY_RANK: Record<Urgency, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

export function computeAlerts(args: {
  taskLogs: Array<{ date: string; completed: boolean; skipped: boolean; created_at: string; task_category?: string }>;
  checkIns: Array<{ created_at: string; pain_level?: number | null; motivation_level?: number | null }>;
  sleepLogs: Array<{ date: string; hours: number | string }>;
  sessions: Array<{ exercise_date: string; performance_score: number | null }>;
}): Alert[] {
  const { taskLogs, checkIns, sleepLogs, sessions } = args;
  const alerts: Alert[] = [];

  // Task activity
  const lastTask = taskLogs[0]?.created_at || taskLogs[taskLogs.length - 1]?.created_at;
  const sortedTasks = [...taskLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const mostRecentTaskDate = sortedTasks[0]?.created_at;
  if (!mostRecentTaskDate) {
    alerts.push({ id: "no-tasks", urgency: "high", title: "No task history", detail: "Patient has not logged any daily tasks yet." });
  } else {
    const days = daysSince(mostRecentTaskDate);
    if (days >= 7) alerts.push({ id: "no-activity", urgency: "critical", title: `No activity in ${Math.floor(days)} days`, detail: "Patient hasn't completed or skipped any task in over a week." });
    else if (days >= 3) alerts.push({ id: "missed-3d", urgency: "high", title: `Missed exercises ${Math.floor(days)} days`, detail: "Encourage patient to resume daily routine." });
  }

  // Pain
  const recentChecks = [...checkIns].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const lastPain = recentChecks.find(c => c.pain_level != null)?.pain_level ?? null;
  if (lastPain != null && lastPain >= 8) {
    alerts.push({ id: "high-pain", urgency: "critical", title: `Pain level ${lastPain}/10`, detail: "Patient reported severe pain in latest check-in." });
  }
  const last7Pain = recentChecks.filter(c => daysSince(c.created_at) <= 7 && c.pain_level != null).map(c => c.pain_level as number);
  const prior7Pain = recentChecks.filter(c => {
    const d = daysSince(c.created_at);
    return d > 7 && d <= 14 && c.pain_level != null;
  }).map(c => c.pain_level as number);
  if (last7Pain.length && prior7Pain.length) {
    const avgNow = last7Pain.reduce((a, b) => a + b, 0) / last7Pain.length;
    const avgPrior = prior7Pain.reduce((a, b) => a + b, 0) / prior7Pain.length;
    const delta = avgPrior > 0 ? ((avgNow - avgPrior) / avgPrior) * 100 : 0;
    if (delta >= 20) {
      alerts.push({ id: "pain-up", urgency: "high", title: `Pain increased ${Math.round(delta)}%`, detail: `Avg pain rose from ${avgPrior.toFixed(1)} to ${avgNow.toFixed(1)} this week.` });
    }
  }

  // Motivation drop
  const last7Mot = recentChecks.filter(c => daysSince(c.created_at) <= 7 && c.motivation_level != null).map(c => c.motivation_level as number);
  const prior7Mot = recentChecks.filter(c => {
    const d = daysSince(c.created_at);
    return d > 7 && d <= 14 && c.motivation_level != null;
  }).map(c => c.motivation_level as number);
  if (last7Mot.length && prior7Mot.length) {
    const avgNow = last7Mot.reduce((a, b) => a + b, 0) / last7Mot.length;
    const avgPrior = prior7Mot.reduce((a, b) => a + b, 0) / prior7Mot.length;
    if (avgPrior - avgNow >= 2) {
      alerts.push({ id: "mot-drop", urgency: "high", title: "Motivation dropped", detail: `Down ${(avgPrior - avgNow).toFixed(1)} points week-over-week.` });
    }
  }

  // Adherence
  const recent14 = taskLogs.filter(t => daysSince(t.created_at) <= 14);
  if (recent14.length >= 5) {
    const adherence = recent14.filter(t => t.completed).length / recent14.length;
    if (adherence < 0.5) {
      alerts.push({ id: "low-adherence", urgency: "medium", title: `Adherence ${Math.round(adherence * 100)}%`, detail: "Patient completing less than half of daily tasks." });
    }
  }

  // Sleep
  const recent7Sleep = sleepLogs.filter(s => daysSince(s.date) <= 7);
  if (recent7Sleep.length >= 3) {
    const avg = recent7Sleep.reduce((a, s) => a + Number(s.hours), 0) / recent7Sleep.length;
    if (avg < 5) alerts.push({ id: "low-sleep", urgency: "medium", title: `Sleep ${avg.toFixed(1)}h avg`, detail: "Insufficient sleep may impair recovery." });
    else if (avg < 6) alerts.push({ id: "sleep-dip", urgency: "low", title: "Mild sleep dip", detail: `Avg ${avg.toFixed(1)}h — slightly below target.` });
  }

  // Performance flat
  const last14Sessions = sessions.filter(s => daysSince(s.exercise_date) <= 14);
  const prior14Sessions = sessions.filter(s => {
    const d = daysSince(s.exercise_date);
    return d > 14 && d <= 28;
  });
  if (last14Sessions.length >= 3 && prior14Sessions.length >= 3) {
    const avgNow = last14Sessions.reduce((a, s) => a + (s.performance_score ?? 0), 0) / last14Sessions.length;
    const avgPrior = prior14Sessions.reduce((a, s) => a + (s.performance_score ?? 0), 0) / prior14Sessions.length;
    if (Math.abs(avgNow - avgPrior) < 0.3) {
      alerts.push({ id: "plateau", urgency: "medium", title: "No progress in 2 weeks", detail: "Performance scores have plateaued." });
    }
  }

  return alerts.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]);
}

export type RiskLevel = "low" | "medium" | "high";
export function deriveRiskLevel(args: {
  score: number;
  adherence: number;
  alerts: Alert[];
}): RiskLevel {
  const { score, adherence, alerts } = args;
  if (alerts.some(a => a.urgency === "critical")) return "high";
  if (score < 40 || adherence < 40 || alerts.filter(a => a.urgency === "high").length >= 2) return "high";
  if (score < 60 || adherence < 60 || alerts.some(a => a.urgency === "high" || a.urgency === "medium")) return "medium";
  return "low";
}

// Expected vs Actual recovery curve.
// Baseline 30 → target 80 over 24 weeks (linear). Returns weekly points up to current week + 4 future.
export function expectedCurve(rehabWeeks: number, weeksToShow = 16): Array<{ week: number; expected: number }> {
  const start = Math.max(0, rehabWeeks - weeksToShow + 4);
  const out: Array<{ week: number; expected: number }> = [];
  for (let w = start; w <= rehabWeeks + 4; w++) {
    const expected = Math.min(80, 30 + (w / 24) * 50);
    out.push({ week: w, expected: Math.round(expected) });
  }
  return out;
}

export function actualCurve(args: {
  rehabWeeks: number;
  sessions: Array<{ exercise_date: string; performance_score: number | null }>;
  taskLogs: Array<{ date: string; completed: boolean }>;
  weeksToShow?: number;
}): Array<{ week: number; actual: number | null }> {
  const { rehabWeeks, sessions, taskLogs, weeksToShow = 16 } = args;
  const start = Math.max(0, rehabWeeks - weeksToShow + 4);
  const out: Array<{ week: number; actual: number | null }> = [];
  for (let w = start; w <= rehabWeeks; w++) {
    const weeksAgo = rehabWeeks - w;
    const cutoffStart = (weeksAgo + 1) * 7;
    const cutoffEnd = weeksAgo * 7;
    const sess = sessions.filter(s => {
      const d = (Date.now() - new Date(s.exercise_date).getTime()) / 86400000;
      return d >= cutoffEnd && d < cutoffStart;
    });
    const tasks = taskLogs.filter(t => {
      const d = (Date.now() - new Date(t.date).getTime()) / 86400000;
      return d >= cutoffEnd && d < cutoffStart;
    });
    const sessScore = sess.length ? (sess.reduce((a, s) => a + (s.performance_score ?? 0), 0) / sess.length) * 10 : null;
    const taskScore = tasks.length ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : null;
    let actual: number | null = null;
    if (sessScore != null && taskScore != null) actual = Math.round(sessScore * 0.6 + taskScore * 0.4);
    else if (sessScore != null) actual = Math.round(sessScore);
    else if (taskScore != null) actual = Math.round(taskScore);
    out.push({ week: w, actual });
  }
  return out;
}

export function computeGap(actual: Array<{ week: number; actual: number | null }>, expected: Array<{ week: number; expected: number }>): { delta: number; label: string } {
  const lastActual = [...actual].reverse().find(a => a.actual != null);
  if (!lastActual) return { delta: 0, label: "Not enough data" };
  const exp = expected.find(e => e.week === lastActual.week)?.expected ?? 0;
  const delta = ((lastActual.actual! - exp) / Math.max(1, exp)) * 100;
  if (Math.abs(delta) < 5) return { delta, label: "On track with expected recovery" };
  return {
    delta,
    label: delta > 0
      ? `Patient is ${Math.round(delta)}% ahead of expected recovery`
      : `Patient is ${Math.round(Math.abs(delta))}% behind expected recovery`,
  };
}

// Adherence patterns
export function adherenceByTimeOfDay(taskLogs: Array<{ created_at: string; completed: boolean }>): Array<{ slot: string; rate: number; total: number }> {
  const slots = [
    { slot: "Morning (5–11)", min: 5, max: 11 },
    { slot: "Afternoon (12–17)", min: 12, max: 17 },
    { slot: "Evening (18–22)", min: 18, max: 22 },
    { slot: "Night (23–4)", min: 23, max: 28 }, // 23-4 wraps
  ];
  return slots.map(s => {
    const inSlot = taskLogs.filter(t => {
      const h = new Date(t.created_at).getHours();
      if (s.min === 23) return h >= 23 || h <= 4;
      return h >= s.min && h <= s.max;
    });
    const rate = inSlot.length ? Math.round((inSlot.filter(t => t.completed).length / inSlot.length) * 100) : 0;
    return { slot: s.slot, rate, total: inSlot.length };
  });
}

export function skippedByCategory(taskLogs: Array<{ skipped: boolean; task_category?: string }>): Array<{ category: string; skipped: number }> {
  const map: Record<string, number> = {};
  for (const t of taskLogs) {
    if (!t.skipped) continue;
    const k = t.task_category || "other";
    map[k] = (map[k] || 0) + 1;
  }
  return Object.entries(map).map(([category, skipped]) => ({ category, skipped })).sort((a, b) => b.skipped - a.skipped);
}

export function adherenceInsight(byTime: ReturnType<typeof adherenceByTimeOfDay>): string {
  const withData = byTime.filter(s => s.total >= 2);
  if (!withData.length) return "Not enough data to detect time-of-day patterns yet.";
  const worst = withData.reduce((a, b) => (a.rate < b.rate ? a : b));
  const best = withData.reduce((a, b) => (a.rate > b.rate ? a : b));
  if (best.rate - worst.rate < 15) return "Adherence is consistent across the day.";
  return `Patient consistently performs best in the ${best.slot.toLowerCase()} and skips most in the ${worst.slot.toLowerCase()}.`;
}

// Goal projection
export function projectTimeToGoal(goal: { created_at: string; timeframe_months: number }, paceRatio: number): string {
  const elapsedMonths = (Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
  const remaining = Math.max(0, goal.timeframe_months - elapsedMonths);
  if (paceRatio <= 0) return "Pace too low to project";
  const projected = remaining / Math.max(0.3, Math.min(2, paceRatio));
  if (projected < 1) return `Projected: ~${Math.round(projected * 4)} weeks to goal`;
  return `Projected: ~${projected.toFixed(1)} months to goal`;
}
