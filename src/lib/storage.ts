// All user progress is stored in localStorage under this key
const STORAGE_KEY = "focusforge_user";

export interface UserData {
  heroName: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  lastSessionDate: string | null; // ISO date string e.g. "2026-04-17"
  recentSubjects: string[];       // last 5 subjects used
}

const DEFAULT_USER: UserData = {
  heroName: "Hero",
  level: 1,
  xp: 0,
  coins: 0,
  streak: 0,
  lastSessionDate: null,
  recentSubjects: [],
};

export function loadUser(): UserData {
  if (typeof window === "undefined") return DEFAULT_USER;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_USER;
  try {
    return { ...DEFAULT_USER, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER;
  }
}

export function saveUser(data: UserData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// How much XP is needed to reach the next level
export function xpForNextLevel(level: number): number {
  if (level < 10) return Math.floor(50 * Math.pow(level, 1.3));
  return Math.floor(100 * Math.pow(level, 1.8));
}

// Calculate XP earned from a session (duration in minutes)
export function calcXP(durationMin: number): number {
  return durationMin * 2;
}

// Calculate coins earned from XP
export function calcCoins(xp: number): number {
  return Math.floor(xp * 0.1);
}

// Apply earned XP/coins to user, handle level ups and streak
export function applySession(
  user: UserData,
  durationMin: number,
  subject: string
): { updated: UserData; xpEarned: number; coinsEarned: number; leveledUp: boolean } {
  const xpEarned = calcXP(durationMin);
  const coinsEarned = calcCoins(xpEarned);

  let { level, xp, coins, streak, lastSessionDate, recentSubjects } = user;

  // Update streak
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (lastSessionDate === today) {
    // already had a session today, streak unchanged
  } else if (lastSessionDate === yesterday) {
    streak += 1;
  } else {
    streak = 1; // reset streak
  }

  // Apply XP, handle level up
  xp += xpEarned;
  coins += coinsEarned;
  let leveledUp = false;

  let threshold = xpForNextLevel(level);
  while (xp >= threshold && level < 100) {
    xp -= threshold;
    level += 1;
    leveledUp = true;
    threshold = xpForNextLevel(level);
  }

  // Track recent subjects (keep last 5, no duplicates)
  const updatedSubjects = [
    subject,
    ...recentSubjects.filter((s) => s !== subject),
  ].slice(0, 5);

  const updated: UserData = {
    ...user,
    level,
    xp,
    coins,
    streak,
    lastSessionDate: today,
    recentSubjects: updatedSubjects,
  };

  return { updated, xpEarned, coinsEarned, leveledUp };
}
