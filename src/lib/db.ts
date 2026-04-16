import { supabase } from "./supabase";
import type { UserData } from "./storage";

// Load user data from Supabase, returns null if not found
export async function loadUserFromDB(userId: string): Promise<UserData | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    heroName: data.hero_name,
    level: data.level,
    xp: data.xp,
    coins: data.coins,
    streak: data.streak,
    lastSessionDate: data.last_session_date,
    recentSubjects: data.recent_subjects ?? [],
  };
}

// Create user row in DB for new users
export async function createUserInDB(userId: string, userData: UserData): Promise<void> {
  await supabase.from("users").insert({
    id: userId,
    hero_name: userData.heroName,
    level: userData.level,
    xp: userData.xp,
    coins: userData.coins,
    streak: userData.streak,
    last_session_date: userData.lastSessionDate,
    recent_subjects: userData.recentSubjects,
  });
}

// Save updated user data to Supabase
export async function saveUserToDB(userId: string, userData: UserData): Promise<void> {
  await supabase.from("users").update({
    hero_name: userData.heroName,
    level: userData.level,
    xp: userData.xp,
    coins: userData.coins,
    streak: userData.streak,
    last_session_date: userData.lastSessionDate,
    recent_subjects: userData.recentSubjects,
  }).eq("id", userId);
}

// Save completed session to sessions table
export async function saveSessionToDB(
  userId: string,
  subject: string,
  durationMin: number,
  xpEarned: number,
  completed: boolean
): Promise<void> {
  await supabase.from("sessions").insert({
    user_id: userId,
    subject,
    duration_min: durationMin,
    xp_earned: xpEarned,
    completed,
  });
}
