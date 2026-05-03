import type { UserDataWithMeta } from "./db";

const CACHE_KEY    = "ff_user_cache";
const PENDING_KEY  = "ff_pending_sessions";

export interface PendingSession {
  id: string;
  userId: string;
  subject: string;
  durationMin: number;
  xpEarned: number;
  completed: boolean;
  createdAt: string;
}

// Save user data to localStorage after a successful Supabase load/save
export function cacheUser(userId: string, data: UserDataWithMeta): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, data }));
}

// Load cached user data — returns null if no cache or wrong user
export function getCachedUser(userId: string): UserDataWithMeta | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.userId !== userId) return null;
    return parsed.data as UserDataWithMeta;
  } catch {
    return null;
  }
}

// Add a session to the offline queue
export function queueSession(session: Omit<PendingSession, "id">): void {
  if (typeof window === "undefined") return;
  const sessions = getPendingSessions();
  sessions.push({ ...session, id: crypto.randomUUID() });
  localStorage.setItem(PENDING_KEY, JSON.stringify(sessions));
}

export function getPendingSessions(): PendingSession[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PENDING_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function removePendingSession(id: string): void {
  if (typeof window === "undefined") return;
  const remaining = getPendingSessions().filter((s) => s.id !== id);
  localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
}
