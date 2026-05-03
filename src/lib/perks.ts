// Perk sustav — trajni passive bonusi.
// Korisnik bira 1 od 3 svaki 10. level (10, 20, 30, ...).
// Pohranjeni kao niz perk ID-eva u users.perks (jsonb).

export type PerkId =
  | "scholar"      // +5% XP
  | "merchant"     // +5% coins
  | "lucky"        // +3% drop rate
  | "marathoner"   // +10% XP za 90+ min sesije
  | "sprinter"     // +15% XP za 15 min sesije
  | "ironwill"     // streak multiplier × 1.1
  | "treasurehunter" // +1% rare upgrade chance
  | "alchemist"    // potions traju 2 sesije
  | "veteran"      // +2% XP za svaku 5. razinu (skalira)
  | "collector";   // +5% coins na svaki loot drop

export interface PerkDef {
  id: PerkId;
  name: string;
  icon: string;
  description: string;
}

export const PERKS: Record<PerkId, PerkDef> = {
  scholar:        { id: "scholar",        name: "Učenjak",         icon: "📚", description: "+5% XP-a iz svake sesije." },
  merchant:       { id: "merchant",       name: "Trgovac",         icon: "💰", description: "+5% coinsa iz svake sesije." },
  lucky:          { id: "lucky",          name: "Sretnik",         icon: "🍀", description: "+3% šanse za loot drop." },
  marathoner:     { id: "marathoner",     name: "Maratonac",       icon: "🏃", description: "+10% XP za sesije 90+ min." },
  sprinter:       { id: "sprinter",       name: "Sprinter",        icon: "⚡", description: "+15% XP za sesije od 15 min." },
  ironwill:       { id: "ironwill",       name: "Željezna volja",  icon: "🛡", description: "Streak multiplier ×1.1." },
  treasurehunter: { id: "treasurehunter", name: "Lovac na blago",  icon: "🗺", description: "+1% šanse za rariji loot." },
  alchemist:      { id: "alchemist",      name: "Alkemičar",       icon: "⚗️", description: "Napitci traju 2 sesije umjesto 1." },
  veteran:        { id: "veteran",        name: "Veteran",         icon: "🎖", description: "+2% XP po svakom 5. levelu." },
  collector:      { id: "collector",      name: "Kolekcionar",     icon: "📦", description: "+5% coinsa kad ti padne loot." },
};

export const PERK_LIST: PerkDef[] = Object.values(PERKS);

// Returns true if the user has unlocked a new perk slot at this level
export function isPerkLevel(level: number): boolean {
  return level > 0 && level % 10 === 0;
}

// Number of perk slots earned by reaching `level`
export function perkSlotsAt(level: number): number {
  return Math.floor(level / 10);
}

// Pick 3 random perks the user doesn't already own
export function rollPerkChoices(owned: PerkId[]): PerkDef[] {
  const ownedSet = new Set(owned);
  const pool = PERK_LIST.filter((p) => !ownedSet.has(p.id));
  if (pool.length <= 3) return pool;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// Calculate XP multiplier from perks for a given session
export function getPerkXpMult(perks: PerkId[], durationMin: number, level: number): number {
  let mult = 1;
  if (perks.includes("scholar"))     mult += 0.05;
  if (perks.includes("marathoner") && durationMin >= 90) mult += 0.10;
  if (perks.includes("sprinter")   && durationMin <= 15) mult += 0.15;
  if (perks.includes("veteran"))     mult += 0.02 * Math.floor(level / 5);
  return mult;
}

export function getPerkCoinMult(perks: PerkId[]): number {
  let mult = 1;
  if (perks.includes("merchant")) mult += 0.05;
  return mult;
}

export function getPerkLootMult(perks: PerkId[]): number {
  let mult = 1;
  if (perks.includes("lucky")) mult += 0.03;
  return mult;
}

export function getPerkStreakMult(perks: PerkId[]): number {
  return perks.includes("ironwill") ? 1.1 : 1;
}
