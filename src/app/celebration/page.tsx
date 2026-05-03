"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { applySession, xpForNextLevel } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { loadUserFromDB, saveUserToDB, saveSessionToDB, rollLoot, getEquippedBonuses, savePotions, savePerks, type ItemData } from "@/lib/db";
import { updateChallengeProgress } from "@/lib/challenges";
import { checkAndGrantAchievements, type AchievementGrant } from "@/lib/achievements";
import { cacheUser, getCachedUser, queueSession } from "@/lib/offline";
import { getPotionMultipliers, decrementPotions, type PotionId, type PotionCounts } from "@/lib/potions";
import { getPerkXpMult, getPerkCoinMult, isPerkLevel, perkSlotsAt, rollPerkChoices, PERKS, type PerkId, type PerkDef } from "@/lib/perks";

const RARITY_COLORS: Record<string, string> = {
  common:    "#9aa6a6",
  rare:      "#4a9eff",
  epic:      "#b060ff",
  legendary: "#f4b03a",
};
const RARITY_LABELS: Record<string, string> = {
  common: "Obično", rare: "Rijetko", epic: "Epsko", legendary: "Legendarno",
};

const CONFETTI_COLORS = ["#ff9b7a", "#6fc6b0", "#ffd479", "#ff7a59", "#8dc7ea", "#b060ff"];

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    duration: `${1.5 + Math.random() * 2}s`,
    delay: `${Math.random() * 0.8}s`,
    size: `${8 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
  }));
  return (
    <>
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece" style={{
          left: p.left, backgroundColor: p.color,
          width: p.size, height: p.size, borderRadius: p.borderRadius,
          animationDuration: p.duration, animationDelay: p.delay,
        }} />
      ))}
    </>
  );
}

function CelebrationContent() {
  const router = useRouter();
  const params = useSearchParams();

  const duration = Number(params.get("duration") ?? 25);
  const subject  = params.get("subject") ?? "Opći fokus";
  const scenario = params.get("scenario") ?? "dungeon";
  const avatar   = params.get("avatar") ?? "🧙‍♂️";

  const validatedRef = useRef(false);
  useEffect(() => {
    if (validatedRef.current) return;
    validatedRef.current = true;
    const valid = sessionStorage.getItem("ff_session_complete");
    if (!valid) { router.replace("/"); return; }
    sessionStorage.removeItem("ff_session_complete");
  }, [router]);

  const appliedRef = useRef(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpAfter, setXpAfter] = useState(0);
  const [xpToNext, setXpToNext] = useState(50);
  const [leveledUp, setLeveledUp] = useState(false);
  const [lootItem, setLootItem] = useState<ItemData | null>(null);
  const [achievementGrants, setAchievementGrants] = useState<AchievementGrant[]>([]);
  const [achIndex, setAchIndex] = useState(0);
  const [sessionOffline, setSessionOffline] = useState(false);
  const [perkChoices, setPerkChoices] = useState<PerkDef[] | null>(null);
  const [showPerkModal, setShowPerkModal] = useState(false);

  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;
    async function apply() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.replace("/login"); return; }

      // Try online path first
      let userData = await loadUserFromDB(authUser.id);

      // Offline fallback — use cached user data
      if (!userData) {
        const cached = getCachedUser(authUser.id);
        if (!cached) { router.replace("/"); return; }

        const result = applySession(cached, duration, subject);
        cacheUser(authUser.id, { ...result.updated, onboarded: true });
        queueSession({
          userId: authUser.id,
          subject,
          durationMin: duration,
          xpEarned: result.xpEarned,
          completed: true,
          createdAt: new Date().toISOString(),
        });
        setSessionOffline(true);
        setXpEarned(result.xpEarned);
        setCoinsEarned(result.coinsEarned);
        setLevel(result.updated.level);
        setXpAfter(result.updated.xp);
        setXpToNext(xpForNextLevel(result.updated.level));
        setLeveledUp(result.leveledUp);
        return;
      }

      // Online path
      const { xpBonus, coinBonus } = await getEquippedBonuses(authUser.id);

      // Read active potions (chosen on setup screen) and apply multipliers
      let activePotions: PotionId[] = [];
      try {
        const raw = sessionStorage.getItem("ff_active_potions");
        if (raw) activePotions = JSON.parse(raw) as PotionId[];
      } catch {}
      sessionStorage.removeItem("ff_active_potions");

      const potionMul = getPotionMultipliers(activePotions);
      const userPerks = (userData.perks ?? []) as PerkId[];
      const perkXpMul = getPerkXpMult(userPerks, duration, userData.level);
      const perkCoinMul = getPerkCoinMult(userPerks);

      const result = applySession(userData, duration, subject);
      const totalXP    = Math.round((result.xpEarned    + xpBonus)   * potionMul.xpMult   * perkXpMul);
      const totalCoins = Math.round((result.coinsEarned + coinBonus) * potionMul.coinMult * perkCoinMul);
      // Re-apply with bonuses on top (update coins manually since applySession doesn't know bonuses)
      result.updated.xp    = Math.max(0, result.updated.xp    - result.xpEarned    + totalXP);
      result.updated.coins = Math.max(0, result.updated.coins - result.coinsEarned + totalCoins);
      await saveUserToDB(authUser.id, result.updated);
      cacheUser(authUser.id, { ...result.updated, onboarded: true });
      await saveSessionToDB(authUser.id, subject, duration, totalXP, true);
      await updateChallengeProgress(authUser.id, duration);
      const item = await rollLoot(authUser.id, scenario, duration);
      setLootItem(item);

      // Load context for achievement check
      const { data: sessions } = await supabase
        .from("sessions")
        .select("duration_min, scenario")
        .eq("user_id", authUser.id);
      const totalSessions = sessions?.length ?? 0;
      const totalMinutes  = (sessions ?? []).reduce((s, r) => s + r.duration_min, 0);
      const scenariosUsed = [...new Set((sessions ?? []).map((s) => s.scenario).filter(Boolean))];
      const { data: friends } = await supabase
        .from("friends")
        .select("id")
        .eq("user_id", authUser.id)
        .eq("status", "accepted")
        .limit(1);
      const grants = await checkAndGrantAchievements(authUser.id, {
        totalSessions,
        totalMinutes,
        streak: result.updated.streak,
        level: result.updated.level,
        scenariosUsed,
        hasFriend: (friends?.length ?? 0) > 0,
      });
      // Apply coin/xp rewards from achievements
      if (grants.length > 0) {
        const bonusCoins = grants.reduce((s, g) => s + g.coinsGranted, 0);
        const bonusXP    = grants.reduce((s, g) => s + g.xpGranted, 0);
        if (bonusCoins > 0 || bonusXP > 0) {
          result.updated.coins += bonusCoins;
          result.updated.xp   += bonusXP;
          await saveUserToDB(authUser.id, result.updated);
        }
        setAchievementGrants(grants);
      }
      // Decrement used potions
      if (activePotions.length > 0) {
        const nextPotions: PotionCounts = decrementPotions(userData.potions ?? {}, activePotions);
        await savePotions(authUser.id, nextPotions);
      }

      // Check for new perk slot (every 10 levels)
      const ownedPerks = (userData.perks ?? []) as PerkId[];
      const newSlots = perkSlotsAt(result.updated.level) - ownedPerks.length;
      if (newSlots > 0 && isPerkLevel(result.updated.level)) {
        setPerkChoices(rollPerkChoices(ownedPerks));
      }

      setXpEarned(totalXP);
      setCoinsEarned(totalCoins);
      setLevel(result.updated.level);
      setXpAfter(result.updated.xp);
      setXpToNext(xpForNextLevel(result.updated.level));
      setLeveledUp(result.leveledUp);
    }
    apply();
  }, [duration, subject, scenario, router]);

  async function pickPerk(perkId: PerkId) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const userData = await loadUserFromDB(authUser.id);
    if (!userData) return;
    const next = [...(userData.perks ?? []), perkId] as PerkId[];
    await savePerks(authUser.id, next);
    setShowPerkModal(false);
    setPerkChoices(null);
  }

  const [displayXP, setDisplayXP] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLoot, setShowLoot] = useState(false);
  const [breakTimer, setBreakTimer] = useState<number | null>(null);

  useEffect(() => {
    if (xpEarned === 0) return;
    let frame = 0;
    const total = 40;
    const interval = setInterval(() => {
      frame++;
      const p = frame / total;
      setDisplayXP(Math.floor(xpEarned * p));
      setDisplayCoins(Math.floor(coinsEarned * p));
      if (frame >= total) {
        clearInterval(interval);
        setDisplayXP(xpEarned);
        setDisplayCoins(coinsEarned);
        if (leveledUp) setShowLevelUp(true);
        else if (perkChoices && perkChoices.length > 0) setShowPerkModal(true);
        else if (lootItem) setShowLoot(true);
        else if (achievementGrants.length > 0) setAchIndex(0);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [xpEarned, coinsEarned, leveledUp, lootItem]);

  useEffect(() => {
    if (breakTimer === null || breakTimer <= 0) return;
    const id = setTimeout(() => setBreakTimer((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [breakTimer]);

  useEffect(() => { if (breakTimer === 0) router.push("/"); }, [breakTimer, router]);

  const xpBarPercent = xpToNext > 0 ? Math.min((xpAfter / xpToNext) * 100, 100) : 100;

  const Modal = ({ children }: { children: React.ReactNode }) => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(59,74,74,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", zIndex: 60 }}>
      <div className="ff-card animate-pop" style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {children}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen pb-10" style={{ maxWidth: 480, margin: "0 auto" }}>
      <Confetti />

      {sessionOffline && (
        <div style={{ background: "#fff3cd", borderBottom: "1px solid #ffc107", padding: "8px 20px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#856404" }}>
          📵 Offline — XP je spremljen lokalno, sync pri sljedećem spajanju
        </div>
      )}

      <header className="flex justify-end px-5 pt-6 pb-2">
        <Link href="/" style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(255,255,255,0.6)", border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", textDecoration: "none", color: "var(--ink)", backdropFilter: "blur(8px)" }}>✕</Link>
      </header>

      {/* Hero mini scene */}
      <div className="px-5 flex flex-col items-center gap-2">
        <div style={{ position: "relative", width: "100%", height: 140, background: "radial-gradient(circle at 20% 80%, #8fd7b0 0 30px, transparent 31px), radial-gradient(circle at 85% 85%, #8fd7b0 0 24px, transparent 25px), linear-gradient(180deg, #e8f8d0, #c8eee0)", borderRadius: 24, overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: -8, left: 0, right: 0, height: 36, background: "radial-gradient(ellipse at center, rgba(143,215,176,0.9), transparent 70%)" }} />
          <div style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", textAlign: "center" }}>
            <span className="animate-breathe" style={{ fontSize: 56, display: "inline-block", filter: "drop-shadow(0 4px 6px rgba(59,74,74,0.15))" }}>{avatar}</span>
          </div>
          <span className="animate-twinkle" style={{ position: "absolute", top: 10, right: 14, fontSize: 14, color: "var(--accent-3)" }}>✨</span>
        </div>

        <div className="animate-pop" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
          🎉 Sesija završena!
        </div>
        <div style={{ color: "var(--ink-soft)", fontSize: 13, fontWeight: 700 }}>Odlično si se fokusirao {duration} minuta</div>
      </div>

      <div className="px-5 flex flex-col gap-4 mt-4">
        {/* Rewards card */}
        <div className="ff-card">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { icon: "⭐", label: "Iskustvo", val: displayXP, unit: "XP", color: "#b060ff" },
              { icon: "🪙", label: "Coinsi",   val: displayCoins, unit: "coins", color: "var(--coin)" },
            ].map(({ icon, label, val, unit, color }, i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i === 0 ? "1px dashed rgba(59,74,74,0.12)" : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 800, fontSize: 14 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 12, background: "color-mix(in oklab, var(--accent-2) 25%, white)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</span>
                  {label}
                </div>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, color }}>+{val}</span>
              </div>
            ))}
          </div>

          {/* XP bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-soft)", marginBottom: 6, fontWeight: 700 }}>
              <span>⭐ Level {level}</span>
              <span>{xpAfter} / {xpToNext} XP</span>
            </div>
            <div className="ff-xpbar">
              <div className="ff-xpbar-fill" style={{ width: `${xpBarPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Break / skip */}
        {breakTimer === null ? (
          <div className="flex flex-col gap-3">
            <button className="ff-btn ghost" onClick={() => setBreakTimer(5 * 60)}>☕ Uzmi pauzu (5 min)</button>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button className="ff-btn mint" style={{ fontSize: 17 }}>Preskoči pauzu →</button>
            </Link>
          </div>
        ) : (
          <div className="ff-card flex flex-col items-center gap-2">
            <p style={{ color: "var(--ink-soft)", fontSize: 13, fontWeight: 700, margin: 0 }}>Pauza završava za</p>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 600, color: "var(--ink)" }}>
              {Math.floor(breakTimer / 60).toString().padStart(2, "0")}:{(breakTimer % 60).toString().padStart(2, "0")}
            </span>
            <Link href="/" style={{ fontSize: 12, color: "var(--ink-faint)", textDecoration: "none" }}>Preskoči pauzu</Link>
          </div>
        )}
      </div>

      {/* Level Up modal */}
      {showLevelUp && (
        <Modal>
          <div style={{ fontSize: 56 }}>⭐</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink)" }}>Level Up!</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--accent)", fontWeight: 600 }}>Level {level}</div>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, textAlign: "center", margin: 0 }}>Nastavljaš biti heroj!</p>
          <button className="ff-btn" style={{ width: "100%" }} onClick={() => {
            setShowLevelUp(false);
            if (perkChoices && perkChoices.length > 0) setShowPerkModal(true);
            else if (lootItem) setShowLoot(true);
            else if (achievementGrants.length > 0) setAchIndex(0);
          }}>Nastavi 🎉</button>
        </Modal>
      )}

      {/* Perk pick modal */}
      {showPerkModal && perkChoices && (
        <Modal>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: 1.2 }}>Novi perk slot!</p>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--accent)" }}>Odaberi perk</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            {perkChoices.map((p) => (
              <button
                key={p.id}
                onClick={async () => {
                  await pickPerk(p.id);
                  if (lootItem) setShowLoot(true);
                  else if (achievementGrants.length > 0) setAchIndex(0);
                }}
                style={{
                  appearance: "none", border: "1px solid rgba(201,255,74,0.30)",
                  background: "rgba(201,255,74,0.06)", color: "var(--ink)",
                  padding: 12, borderRadius: 14, textAlign: "left", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-body)",
                  fontWeight: 600, fontSize: 14,
                }}
              >
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <span style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--accent)" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{p.description}</div>
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Achievement modal — prikazuje se jedan po jedan */}
      {!showLevelUp && !showLoot && achIndex < achievementGrants.length && (() => {
        const grant = achievementGrants[achIndex];
        const ach   = grant.achievement;
        const rewardText = grant.coinsGranted > 0 ? `+${grant.coinsGranted} coins`
          : grant.xpGranted > 0 ? `+${grant.xpGranted} XP`
          : grant.itemGranted ? `${grant.itemGranted.name} (${grant.itemGranted.rarity})`
          : "";
        return (
          <Modal>
            <p style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Achievement otključan!</p>
            <div style={{ fontSize: 56 }}>{ach.icon}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)", textAlign: "center" }}>{ach.title}</div>
            <p style={{ color: "var(--ink-soft)", fontSize: 13, textAlign: "center", margin: 0 }}>{ach.description}</p>
            {rewardText && (
              <div style={{ background: "color-mix(in oklab, var(--accent-3) 30%, white)", borderRadius: 14, padding: "8px 18px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>
                🎁 {rewardText}
              </div>
            )}
            <button className="ff-btn" style={{ width: "100%" }} onClick={() => setAchIndex((i) => i + 1)}>
              {achIndex < achievementGrants.length - 1 ? "Sljedeći →" : "Super! 🎉"}
            </button>
          </Modal>
        );
      })()}

      {/* Loot modal */}
      {showLoot && lootItem && (
        <Modal>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700, margin: 0 }}>Predmet pronađen!</p>
          <div style={{ fontSize: 64 }}>{lootItem.icon}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: RARITY_COLORS[lootItem.rarity] }}>{lootItem.name}</div>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: RARITY_COLORS[lootItem.rarity], background: "rgba(0,0,0,0.06)", padding: "4px 10px", borderRadius: 999 }}>{RARITY_LABELS[lootItem.rarity]}</span>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, textAlign: "center", margin: 0 }}>{lootItem.description}</p>
          <button className="ff-btn mint" style={{ width: "100%" }} onClick={() => { setShowLoot(false); if (achievementGrants.length > 0) setAchIndex(0); }}>Uzmi! 🎒</button>
        </Modal>
      )}
    </main>
  );
}

export default function CelebrationPage() {
  return <Suspense><CelebrationContent /></Suspense>;
}
