// Derive "Today's 3 Things" — small, achievable nudges based on phase + recent activity

export type Phase = 1 | 2 | 3 | 4;

export function getPhase(weeks: number): Phase {
  if (weeks <= 4) return 1;
  if (weeks <= 12) return 2;
  if (weeks <= 24) return 3;
  return 4;
}

const PHASE_TASKS: Record<Phase, string[]> = {
  1: [
    "Do 1 ankle pump set (1 min)",
    "Take 5 deep breaths",
    "Log how you feel today",
    "Gentle arm stretch (2 min)",
  ],
  2: [
    "Complete 1 bite-sized exercise",
    "Log a quick mood check-in",
    "Try 5 quad sets",
    "Add 1 rep to your last exercise",
  ],
  3: [
    "Practice 1 balance exercise",
    "Record a short progress video",
    "Complete 1 mobility drill",
    "Log your sleep from last night",
  ],
  4: [
    "Hit your daily streak",
    "Try a new exercise variation",
    "Reflect on this week's win",
    "Share progress with your doctor",
  ],
};

export function getTodayThings(rehabWeeks: number, completedToday: number): string[] {
  const phase = getPhase(rehabWeeks);
  const pool = PHASE_TASKS[phase];
  // Rotate based on day-of-year so it changes daily but is stable within a day
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const start = day % pool.length;
  const picks: string[] = [];
  for (let i = 0; i < 3; i++) {
    picks.push(pool[(start + i) % pool.length]);
  }
  // Mark first N as already done (visually)
  return picks;
}
