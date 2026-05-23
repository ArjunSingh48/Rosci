// Pure recovery score engine — deterministic, client-side
// All inputs are arrays of records pulled from existing tables.

export type ScoreInputs = {
  taskLogs: Array<{ date: string; completed: boolean }>;
  streak: number;
  sessions: Array<{ exercise_date: string; performance_score: number | null }>;
  sleepLogs: Array<{ date: string; hours: number | string }>;
  checkIns: Array<{ created_at: string; mood?: string; energy_level?: string | null; pain_level?: number | null }>;
  goals: Array<{ created_at: string; timeframe_months: number }>;
};

export type ScoreBreakdown = {
  tasks: number;
  consistency: number;
  performance: number;
  sleep: number;
  wellbeing: number;
  goalAlignment: number;
};

export type ScoreResult = {
  score: number;
  trend: "improving" | "plateau" | "declining";
  breakdown: ScoreBreakdown;
};

const WEIGHTS = {
  tasks: 0.25,
  consistency: 0.20,
  performance: 0.20,
  sleep: 0.10,
  wellbeing: 0.10,
  goalAlignment: 0.15,
};

const moodToNum: Record<string, number> = {
  great: 100, good: 80, okay: 60, low: 40, bad: 20, neutral: 60,
};
const energyToNum: Record<string, number> = {
  high: 100, medium: 65, low: 35,
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function scoreTasks(taskLogs: ScoreInputs["taskLogs"], windowDays = 14): number {
  const cutoff = daysAgo(windowDays);
  const recent = taskLogs.filter(t => new Date(t.date) >= cutoff);
  if (!recent.length) return 0;
  const completed = recent.filter(t => t.completed).length;
  return clamp((completed / recent.length) * 100);
}

function scoreConsistency(streak: number): number {
  // 7-day streak = 70, 14 = 100, capped
  return clamp((streak / 14) * 100);
}

function scorePerformance(sessions: ScoreInputs["sessions"]): number {
  const recent = sessions.slice(-10);
  if (!recent.length) return 0;
  const avg = recent.reduce((a, s) => a + (s.performance_score ?? 0), 0) / recent.length;
  return clamp(avg * 10);
}

function scoreSleep(sleepLogs: ScoreInputs["sleepLogs"], windowDays = 7): number {
  const cutoff = daysAgo(windowDays);
  const recent = sleepLogs.filter(s => new Date(s.date) >= cutoff);
  if (!recent.length) return 0;
  const avg = recent.reduce((a, s) => a + Number(s.hours), 0) / recent.length;
  // 7-9h ideal → 100, scale down on either side
  if (avg >= 7 && avg <= 9) return 100;
  if (avg < 7) return clamp((avg / 7) * 100);
  return clamp(100 - (avg - 9) * 15);
}

function scoreWellbeing(checkIns: ScoreInputs["checkIns"], windowDays = 7): number {
  const cutoff = daysAgo(windowDays);
  const recent = checkIns.filter(c => new Date(c.created_at) >= cutoff);
  if (!recent.length) return 0;
  let sum = 0;
  let count = 0;
  for (const c of recent) {
    const m = moodToNum[c.mood ?? "neutral"] ?? 60;
    const e = energyToNum[c.energy_level ?? "medium"] ?? 60;
    const painPenalty = c.pain_level != null ? (10 - Math.min(10, c.pain_level)) * 10 : 70;
    sum += (m + e + painPenalty) / 3;
    count++;
  }
  return clamp(sum / count);
}

function scoreGoalAlignment(
  goals: ScoreInputs["goals"],
  sessions: ScoreInputs["sessions"],
): number {
  if (!goals.length) return 50; // neutral when no goals
  const sessionsCount = sessions.length;
  let total = 0;
  for (const g of goals) {
    const elapsedMs = Date.now() - new Date(g.created_at).getTime();
    const elapsedMonths = elapsedMs / (1000 * 60 * 60 * 24 * 30);
    const expectedPace = elapsedMonths / Math.max(1, g.timeframe_months); // 0..1
    // Expect ~12 sessions per month of timeframe
    const expectedSessions = expectedPace * (g.timeframe_months * 12);
    const ratio = expectedSessions > 0 ? sessionsCount / expectedSessions : 1;
    total += clamp(ratio * 100);
  }
  return clamp(total / goals.length);
}

export function computeRecoveryScore(inputs: ScoreInputs): ScoreResult {
  const breakdown: ScoreBreakdown = {
    tasks: scoreTasks(inputs.taskLogs),
    consistency: scoreConsistency(inputs.streak),
    performance: scorePerformance(inputs.sessions),
    sleep: scoreSleep(inputs.sleepLogs),
    wellbeing: scoreWellbeing(inputs.checkIns),
    goalAlignment: scoreGoalAlignment(inputs.goals, inputs.sessions),
  };

  const score = Math.round(
    breakdown.tasks * WEIGHTS.tasks +
    breakdown.consistency * WEIGHTS.consistency +
    breakdown.performance * WEIGHTS.performance +
    breakdown.sleep * WEIGHTS.sleep +
    breakdown.wellbeing * WEIGHTS.wellbeing +
    breakdown.goalAlignment * WEIGHTS.goalAlignment
  );

  // Trend: compare last 7d vs prior 7d task completion rate
  const last7Tasks = scoreTasks(inputs.taskLogs, 7);
  const cutoff14 = daysAgo(14);
  const cutoff7 = daysAgo(7);
  const prior = inputs.taskLogs.filter(t => {
    const d = new Date(t.date);
    return d >= cutoff14 && d < cutoff7;
  });
  const priorRate = prior.length
    ? (prior.filter(t => t.completed).length / prior.length) * 100
    : last7Tasks;
  const delta = last7Tasks - priorRate;
  const trend: ScoreResult["trend"] =
    delta > 5 ? "improving" : delta < -5 ? "declining" : "plateau";

  return { score, trend, breakdown };
}

export function goalProgress(
  goal: { created_at: string; timeframe_months: number },
  sessionsCount: number,
): { percent: number; label: string } {
  const elapsedMs = Date.now() - new Date(goal.created_at).getTime();
  const elapsedMonths = elapsedMs / (1000 * 60 * 60 * 24 * 30);
  const timePercent = clamp((elapsedMonths / goal.timeframe_months) * 100);
  const expectedSessions = (elapsedMonths / goal.timeframe_months) * goal.timeframe_months * 12;
  const paceRatio = expectedSessions > 0 ? sessionsCount / expectedSessions : 1;
  const percent = Math.round(clamp(((timePercent + clamp(paceRatio * 100)) / 2)));
  const label =
    paceRatio >= 0.9 ? "on track" :
    paceRatio >= 0.6 ? "slightly behind" : "needs a boost";
  return { percent, label };
}
