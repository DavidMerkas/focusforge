"use client";

import { CSSProperties, ReactNode } from "react";

// Neon paleta
const N = {
  lime: "#c9ff4a",
  cyan: "#7af0ff",
  pink: "#ff6cb1",
  violet: "#a06bff",
  amber: "#ffb74a",
};

export type DioramaProps = { progress: number; avatar: string };

function Particles({ count = 20, color = "#fff", size = 1.5 }: { count?: number; color?: string; size?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${(i * 41) % 100}%`,
            left: `${(i * 67) % 100}%`,
            width: i % 4 === 0 ? size * 2 : size,
            height: i % 4 === 0 ? size * 2 : size,
            background: color,
            borderRadius: "50%",
            opacity: 0.3 + (i % 3) * 0.2,
            animation: `twinkle ${1 + (i % 5) * 0.4}s ease-in-out ${i * 0.07}s infinite`,
            boxShadow: i % 5 === 0 ? `0 0 6px ${color}` : "none",
          }}
        />
      ))}
    </>
  );
}

const wrap = (style: CSSProperties, children: ReactNode) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>{children}</div>
);

// ─── DUNGEON ──────────────────────────────────────────────────
function DioBattle({ progress, avatar }: DioramaProps) {
  const heroX = 30 + progress * 160;
  const enemyHp = Math.max(0, 1 - progress);
  const slash = progress > 0.1 && Math.floor(progress * 8) % 2 === 0;
  return wrap(
    { background: "radial-gradient(ellipse at 30% 100%, rgba(160,107,255,0.25), transparent 70%)" },
    <>
      <Particles count={10} color={N.violet} />
      <div style={{ position: "absolute", bottom: 36, left: 8, width: 30, height: 60, borderTopLeftRadius: 30, borderTopRightRadius: 30, background: "linear-gradient(180deg, rgba(160,107,255,0.15), rgba(160,107,255,0.05))", border: `1px solid ${N.lime}33` }} />
      <div style={{ position: "absolute", bottom: 36, right: 8, width: 30, height: 60, borderTopLeftRadius: 30, borderTopRightRadius: 30, background: "linear-gradient(180deg, rgba(160,107,255,0.15), rgba(160,107,255,0.05))", border: `1px solid ${N.lime}33` }} />
      <div style={{ position: "absolute", bottom: 36, left: 0, right: 0, height: 1.5, background: N.lime, boxShadow: `0 0 10px ${N.lime}, 0 0 22px ${N.lime}88` }} />
      <div style={{ position: "absolute", bottom: 56, left: 22, width: 4, height: 14, background: N.amber, borderRadius: 2, boxShadow: `0 0 14px ${N.amber}`, animation: "flicker 1.4s infinite" }} />
      <div style={{ position: "absolute", bottom: 56, right: 22, width: 4, height: 14, background: N.amber, borderRadius: 2, boxShadow: `0 0 14px ${N.amber}`, animation: "flicker 1.7s infinite" }} />
      <span style={{ position: "absolute", bottom: 38, left: heroX, fontSize: 38, transition: "left 1s linear", animation: "dungeon-swing 1.2s ease-in-out infinite", filter: `drop-shadow(0 0 8px ${N.lime})` }}>{avatar}</span>
      {slash && <span style={{ position: "absolute", bottom: 50, left: heroX + 18, fontSize: 18, color: N.cyan, textShadow: `0 0 12px ${N.cyan}`, animation: "pop 0.4s" }}>⚔</span>}
      {enemyHp > 0 && (
        <div style={{ position: "absolute", bottom: 42, right: 36, textAlign: "center" }}>
          <div style={{ width: 44, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, marginBottom: 4, overflow: "hidden" }}>
            <div style={{ width: `${enemyHp * 100}%`, height: "100%", background: N.pink, boxShadow: `0 0 8px ${N.pink}` }} />
          </div>
          <span style={{ fontSize: 32, opacity: 0.4 + enemyHp * 0.6, filter: `drop-shadow(0 0 8px ${N.violet})` }}>👻</span>
        </div>
      )}
      {progress >= 1 && <span style={{ position: "absolute", bottom: 70, right: 50, fontSize: 26, animation: "pop 0.6s", filter: `drop-shadow(0 0 10px ${N.lime})` }}>💎</span>}
    </>
  );
}

function DioCrystalMine({ progress, avatar }: DioramaProps) {
  const crystals = [
    { x: 22, y: 90, size: 14, hue: 0 },
    { x: 50, y: 75, size: 22, hue: 60 },
    { x: 100, y: 95, size: 16, hue: 120 },
    { x: 200, y: 85, size: 20, hue: 200 },
    { x: 240, y: 100, size: 12, hue: 280 },
  ];
  return wrap(
    { background: "linear-gradient(180deg, #1a0f2e 0%, #2a1844 60%, #0d081f 100%)" },
    <>
      {[20, 60, 110, 150, 200, 240].map((x, i) => (
        <div key={i} style={{ position: "absolute", top: 0, left: x, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `${20 + (i % 3) * 8}px solid rgba(160,107,255,0.25)` }} />
      ))}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, background: "linear-gradient(180deg, transparent, rgba(160,107,255,0.18))" }} />
      {crystals.map((c, i) => {
        const lit = progress > i / crystals.length;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: c.y,
              left: c.x,
              width: 0,
              height: 0,
              borderLeft: `${c.size / 2}px solid transparent`,
              borderRight: `${c.size / 2}px solid transparent`,
              borderBottom: `${c.size}px solid hsl(${c.hue} 80% 60%)`,
              filter: lit ? `drop-shadow(0 0 ${c.size}px hsl(${c.hue} 90% 60%))` : "opacity(0.4)",
              transform: `rotate(${(i % 2 ? -1 : 1) * 8}deg)`,
              transition: "filter 0.6s",
            }}
          />
        );
      })}
      <span style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", fontSize: 36, animation: "dungeon-swing 0.7s ease-in-out infinite", filter: `drop-shadow(0 0 10px ${N.lime})` }}>{avatar}</span>
      <span style={{ position: "absolute", bottom: 60, left: "calc(50% + 18px)", fontSize: 14, color: N.lime, animation: "flicker 0.7s infinite" }}>⚒</span>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", bottom: 60 + (i % 3) * 6, left: `calc(50% + ${10 + i * 4}px)`, width: 2, height: 2, background: N.lime, borderRadius: "50%", boxShadow: `0 0 6px ${N.lime}`, opacity: 0.7, animation: `twinkle ${0.8 + i * 0.1}s infinite` }} />
      ))}
    </>
  );
}

function DioBossDoor({ progress, avatar }: DioramaProps) {
  const bars = 5;
  const unlocked = Math.floor(progress * bars);
  return wrap(
    { background: "radial-gradient(ellipse at center, rgba(255,108,177,0.18), transparent 70%)" },
    <>
      <Particles count={8} color={N.pink} />
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", width: 130, height: 150, borderRadius: "65px 65px 8px 8px", background: "linear-gradient(180deg, rgba(160,107,255,0.25), rgba(40,20,80,0.6))", border: `2px solid ${N.pink}`, boxShadow: `0 0 30px ${N.pink}55, inset 0 0 20px rgba(0,0,0,0.5)` }}>
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", fontSize: 24, color: N.lime, textShadow: `0 0 12px ${N.lime}` }}>✦</div>
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} style={{ position: "absolute", top: 50 + i * 15, left: 14, right: 14, height: 4, borderRadius: 2, background: i < unlocked ? N.lime : "rgba(255,255,255,0.12)", boxShadow: i < unlocked ? `0 0 8px ${N.lime}` : "none", transition: "all 0.5s" }} />
        ))}
      </div>
      <span style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", fontSize: 32, animation: "breathe 2.4s infinite", filter: `drop-shadow(0 0 8px ${N.lime})` }}>{avatar}</span>
      <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", width: 100, height: 2, background: N.lime, boxShadow: `0 0 14px ${N.lime}`, opacity: 0.5 }} />
      {progress >= 1 && <span style={{ position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)", fontSize: 36, animation: "pop 0.6s" }}>👑</span>}
    </>
  );
}

// ─── GARDEN ───────────────────────────────────────────────────
function DioBioPlant({ progress, avatar }: DioramaProps) {
  const grow = Math.min(progress, 1);
  return wrap(
    { background: "radial-gradient(ellipse at 70% 30%, rgba(122,240,255,0.18), transparent 60%), linear-gradient(180deg, #06181a, #0a2630 100%)" },
    <>
      <Particles count={14} color={N.cyan} />
      <div style={{ position: "absolute", top: 14, right: 26, width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #d4f0ff, #6bb0c8)", boxShadow: `0 0 24px ${N.cyan}88` }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: "linear-gradient(180deg, #1a3a44, #0a1a20)" }} />
      <div style={{ position: "absolute", bottom: 36, left: 0, right: 0, height: 1.5, background: N.cyan, boxShadow: `0 0 12px ${N.cyan}` }} />
      <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", textAlign: "center", transition: "all 1s" }}>
        <div style={{ width: 3, height: 80 * grow, background: `linear-gradient(180deg, ${N.lime}, #2d6040)`, margin: "0 auto", borderRadius: 2, boxShadow: grow > 0.5 ? `0 0 8px ${N.lime}` : "none" }} />
        {grow > 0.25 && <div style={{ position: "absolute", bottom: 22, left: -16, fontSize: 18, opacity: grow, filter: `drop-shadow(0 0 6px ${N.lime})`, animation: "sway 3s infinite", transformOrigin: "right" }}>🌿</div>}
        {grow > 0.55 && <div style={{ position: "absolute", bottom: 50, right: -16, fontSize: 18, opacity: grow, filter: `drop-shadow(0 0 6px ${N.lime})`, animation: "sway 4s -1s infinite", transformOrigin: "left" }}>🌿</div>}
        {grow > 0.85 && <div style={{ position: "absolute", top: -34, left: "50%", transform: "translateX(-50%)", fontSize: 32, animation: "pop 0.6s", filter: `drop-shadow(0 0 14px ${N.pink})` }}>🌸</div>}
      </div>
      <span style={{ position: "absolute", bottom: 8, left: 18, fontSize: 32, animation: "breathe 3s infinite", filter: `drop-shadow(0 0 8px ${N.cyan})` }}>{avatar}</span>
      <span style={{ position: "absolute", bottom: 14, right: 22, fontSize: 16, filter: `drop-shadow(0 0 8px ${N.pink})`, animation: "sway 2.4s infinite" }}>🦋</span>
    </>
  );
}

function DioGreenhouse({ progress, avatar }: DioramaProps) {
  const slots = 6;
  return wrap(
    { background: "linear-gradient(180deg, #0a1828, #0a2030)" },
    <>
      <Particles count={8} color={N.lime} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 18, background: `linear-gradient(180deg, rgba(201,255,74,0.10), transparent)`, borderBottom: `1px solid ${N.lime}44` }} />
      {[20, 70, 130, 190].map((x, i) => (
        <div key={i} style={{ position: "absolute", top: 0, left: x, width: 1, height: "100%", background: `${N.lime}22` }} />
      ))}
      {Array.from({ length: slots }).map((_, i) => {
        const x = 18 + i * 42;
        const lit = progress > (i + 0.5) / slots;
        const grown = progress > i / slots;
        const h = grown ? 18 + Math.min((progress - i / slots) * slots, 1) * 30 : 0;
        return (
          <div key={i} style={{ position: "absolute", bottom: 22, left: x }}>
            <div style={{ width: 24, height: 14, background: "linear-gradient(180deg, #4a3020, #2a1810)", borderRadius: "0 0 4px 4px", position: "relative", zIndex: 1 }} />
            {grown && (
              <>
                <div style={{ position: "absolute", bottom: 14, left: 11, width: 2, height: h, background: lit ? N.lime : "#2d6040", boxShadow: lit ? `0 0 8px ${N.lime}` : "none", borderRadius: 1, transition: "all 0.6s" }} />
                {h > 26 && <div style={{ position: "absolute", bottom: 14 + h - 6, left: 4, fontSize: 12, filter: lit ? `drop-shadow(0 0 6px ${N.lime})` : "none" }}>🌿</div>}
                {h > 40 && <div style={{ position: "absolute", bottom: 14 + h, left: 6, fontSize: 14, filter: `drop-shadow(0 0 8px ${N.pink})`, animation: "pop 0.5s" }}>🌸</div>}
              </>
            )}
          </div>
        );
      })}
      <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, height: 1, background: N.lime, opacity: 0.5, boxShadow: `0 0 8px ${N.lime}` }} />
      <span style={{ position: "absolute", bottom: 4, left: 20 + progress * 200, fontSize: 26, transition: "left 1s linear", animation: "breathe 2.4s infinite", filter: `drop-shadow(0 0 8px ${N.cyan})` }}>{avatar}</span>
    </>
  );
}

function DioMoonForest({ progress, avatar }: DioramaProps) {
  const trees = 7;
  return wrap(
    { background: "linear-gradient(180deg, #1a0a2e 0%, #0a1828 60%, #051018 100%)" },
    <>
      <Particles count={20} color="#fff" />
      <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", width: 70 + progress * 14, height: 70 + progress * 14, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${N.cyan}88, ${N.violet}66 60%, transparent)`, boxShadow: `0 0 ${30 + progress * 30}px ${N.cyan}88`, transition: "all 1s" }} />
      {Array.from({ length: trees }).map((_, i) => {
        const lit = progress > i / trees;
        const x = 8 + i * 38 - (i % 2) * 4;
        const h = 50 + (i % 3) * 14;
        return (
          <div key={i} style={{ position: "absolute", bottom: 18, left: x }}>
            <div style={{ width: 0, height: 0, borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderBottom: `${h}px solid ${lit ? N.violet : "#1a1030"}`, filter: lit ? `drop-shadow(0 0 12px ${N.violet})` : "none", transition: "all 0.6s" }} />
            <div style={{ width: 5, height: 8, background: lit ? "#3a1a55" : "#1a0a25", margin: "0 auto", borderRadius: 1 }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 18, background: "#0a0512" }} />
      <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, height: 1, background: N.cyan, opacity: 0.4, boxShadow: `0 0 10px ${N.cyan}` }} />
      <span style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 28, filter: `drop-shadow(0 0 12px ${N.cyan})`, animation: "breathe 3.5s infinite" }}>{avatar}</span>
    </>
  );
}

// ─── SPACE ────────────────────────────────────────────────────
function DioOrbit({ progress, avatar }: DioramaProps) {
  return wrap(
    { background: "radial-gradient(ellipse at top, #1a2880 0%, #0a1248 60%, #050828 100%)" },
    <>
      <Particles count={28} color="#fff" />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 70 + progress * 40, height: 70 + progress * 40, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${N.amber}, #c04060 60%, #4a2080)`, boxShadow: `0 0 ${20 + progress * 30}px ${N.amber}88, inset -10px -10px 20px rgba(0,0,0,0.4)`, opacity: 0.5 + progress * 0.5, transition: "all 1s" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 140 + progress * 30, height: 24 + progress * 6, border: `2px solid ${N.cyan}`, borderRadius: "50%", opacity: 0.6, transform: `translate(-50%, -50%) rotateX(70deg)`, boxShadow: `0 0 14px ${N.cyan}`, transition: "all 1s" }} />
      <span style={{ position: "absolute", top: "50%", left: "50%", fontSize: 28, transform: `translate(-50%, -50%) rotate(${progress * 360 + 30}deg) translateX(80px) rotate(-${progress * 360 + 30}deg)`, filter: `drop-shadow(0 0 10px ${N.cyan})`, transition: "transform 1s linear" }}>{avatar}</span>
    </>
  );
}

function DioRocket({ progress, avatar }: DioramaProps) {
  const y = 140 - progress * 130;
  const trail = progress * 130;
  return wrap(
    { background: "linear-gradient(180deg, #051028 0%, #1a0f4a 50%, #2a1844 100%)" },
    <>
      <Particles count={20} color="#fff" />
      <div style={{ position: "absolute", bottom: -40, left: "50%", transform: "translateX(-50%)", width: 280, height: 80, borderRadius: "50%", background: `radial-gradient(ellipse at top, ${N.cyan}88, #0a3060 70%, transparent)`, boxShadow: `0 -10px 30px ${N.cyan}66` }} />
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 30, width: 4, height: trail, background: `linear-gradient(180deg, transparent, ${N.amber} 60%, ${N.pink})`, borderRadius: 2, boxShadow: `0 0 14px ${N.amber}`, opacity: 0.85 }} />
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: y, fontSize: 30, transition: "top 1s linear", filter: `drop-shadow(0 0 12px ${N.amber})` }}>🚀</div>
      <span style={{ position: "absolute", top: 12, left: 30, fontSize: 12, color: N.cyan, textShadow: `0 0 8px ${N.cyan}`, animation: "twinkle 2s infinite" }}>✦</span>
      <span style={{ position: "absolute", top: 30, right: 36, fontSize: 16, color: N.lime, textShadow: `0 0 10px ${N.lime}`, animation: "twinkle 2.4s infinite" }}>✦</span>
      <span style={{ position: "absolute", bottom: 12, right: 18, fontSize: 22, filter: `drop-shadow(0 0 8px ${N.cyan})`, animation: "breathe 2.4s infinite" }}>{avatar}</span>
    </>
  );
}

function DioConstellation({ progress, avatar }: DioramaProps) {
  const pts = [
    { x: 30, y: 60 }, { x: 70, y: 50 }, { x: 110, y: 70 }, { x: 150, y: 60 },
    { x: 175, y: 90 }, { x: 215, y: 100 }, { x: 245, y: 120 },
  ];
  const total = pts.length - 1;
  const litLines = Math.floor(progress * total);
  const partialFrac = progress * total - litLines;
  return wrap(
    { background: "radial-gradient(ellipse at top right, rgba(122,240,255,0.18), transparent 60%), linear-gradient(180deg, #050828 0%, #0a0a30 100%)" },
    <>
      <Particles count={30} color="#fff" />
      <svg viewBox="0 0 280 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {pts.slice(0, -1).map((p, i) => {
          const next = pts[i + 1];
          const visible = i < litLines;
          const partial = i === litLines ? partialFrac : 0;
          const x2 = visible ? next.x : p.x + (next.x - p.x) * partial;
          const y2 = visible ? next.y : p.y + (next.y - p.y) * partial;
          return (
            <line key={i} x1={p.x} y1={p.y} x2={x2} y2={y2} stroke={N.cyan} strokeWidth="1.2" opacity={visible ? 0.9 : partial > 0 ? 0.7 : 0} style={{ filter: `drop-shadow(0 0 4px ${N.cyan})`, transition: "all 0.4s" }} />
          );
        })}
        {pts.map((p, i) => {
          const lit = progress * pts.length >= i;
          return <circle key={i} cx={p.x} cy={p.y} r={lit ? 3 : 2} fill={lit ? N.cyan : "#fff"} opacity={lit ? 1 : 0.45} style={{ filter: lit ? `drop-shadow(0 0 6px ${N.cyan})` : "none", transition: "all 0.4s" }} />;
        })}
      </svg>
      <span style={{ position: "absolute", bottom: 14, left: 20, fontSize: 24, animation: "space-float 4s infinite", filter: `drop-shadow(0 0 10px ${N.cyan})` }}>{avatar}</span>
      <div style={{ position: "absolute", bottom: 16, right: 18, fontSize: 9, fontWeight: 800, color: N.cyan, letterSpacing: 1.5, textTransform: "uppercase", textShadow: `0 0 8px ${N.cyan}` }}>{Math.round(progress * 100)}% mapirano</div>
    </>
  );
}

// ─── CHAOS ────────────────────────────────────────────────────
function DioGlitch({ progress, avatar }: DioramaProps) {
  const chars = "01アイウエ✦✧⚡#@";
  return wrap(
    { background: "linear-gradient(135deg, #0a0228 0%, #1a0540 50%, #28084a 100%)" },
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: -20,
            left: i * 28,
            color: i % 2 ? N.pink : N.lime,
            textShadow: `0 0 8px ${i % 2 ? N.pink : N.lime}`,
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: 700,
            animation: `chaos-code-fall ${2 + (i % 4) * 0.5}s linear ${i * 0.2}s infinite`,
            whiteSpace: "pre",
            opacity: 0.7,
          }}
        >
          {chars.split("").map((c, j) => <div key={j}>{c}</div>)}
        </div>
      ))}
      <div style={{ position: "absolute", top: 60 + progress * 30, left: 0, right: 0, height: 3, background: N.cyan, boxShadow: `0 0 10px ${N.cyan}`, opacity: 0.6, animation: "glitch-slide 0.4s infinite" }} />
      <div style={{ position: "absolute", top: 130 - progress * 20, left: 0, right: 0, height: 1.5, background: N.pink, boxShadow: `0 0 8px ${N.pink}`, opacity: 0.7 }} />
      <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 50, animation: "chaos-wild 1.2s infinite", filter: `drop-shadow(2px 0 0 ${N.pink}) drop-shadow(-2px 0 0 ${N.cyan})` }}>{avatar}</span>
      <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${N.pink}, ${N.lime}, ${N.cyan})`, boxShadow: `0 0 10px ${N.pink}`, transition: "width 1s linear" }} />
      </div>
    </>
  );
}

function DioCarnival({ progress, avatar }: DioramaProps) {
  const colors = [N.lime, N.cyan, N.pink, N.amber];
  return wrap(
    { background: "linear-gradient(180deg, #2a0840 0%, #ff6cb1 70%, #ffb74a 100%)" },
    <>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${(i * 37) % 100}%`,
            left: `${(i * 53) % 100}%`,
            width: 6,
            height: 8,
            borderRadius: i % 2 ? "50%" : 1,
            background: colors[i % 4],
            boxShadow: `0 0 6px ${colors[i % 4]}`,
            animation: `chaos-spin ${1.4 + (i % 5) * 0.3}s linear ${i * 0.07}s infinite`,
            opacity: 0.7,
          }}
        />
      ))}
      {[
        { x: 24, y: 30, c: N.cyan },
        { x: 220, y: 24, c: N.lime },
        { x: 60, y: 70, c: N.amber },
      ].map((b, i) => (
        <div key={i} style={{ position: "absolute", top: b.y, left: b.x, animation: `breathe ${2.4 + i * 0.4}s infinite` }}>
          <div style={{ width: 20, height: 24, borderRadius: "50%", background: b.c, boxShadow: `0 0 14px ${b.c}88`, position: "relative" }}>
            <div style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "3px solid transparent", borderRight: "3px solid transparent", borderTop: `4px solid ${b.c}` }} />
          </div>
          <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.4)", margin: "0 auto" }} />
        </div>
      ))}
      <span style={{ position: "absolute", top: "55%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 50, animation: "chaos-wild 1.4s infinite", filter: `drop-shadow(0 0 14px ${N.lime})` }}>{avatar}</span>
      <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, height: 6, background: "rgba(0,0,0,0.3)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: `repeating-linear-gradient(45deg, ${N.pink}, ${N.pink} 4px, ${N.lime} 4px, ${N.lime} 8px)`, boxShadow: `0 0 10px ${N.lime}`, transition: "width 1s linear" }} />
      </div>
    </>
  );
}

function DioVortex({ progress, avatar }: DioramaProps) {
  const colors = [N.pink, N.cyan, N.lime, N.amber];
  return wrap(
    { background: "radial-gradient(circle at center, #2a0860 0%, #050020 80%)" },
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 40 + i * 28,
            height: 40 + i * 28,
            borderRadius: "50%",
            border: `2px solid ${colors[i % 4]}`,
            opacity: 0.4,
            transform: `translate(-50%, -50%) rotate(${i * 25 + progress * 180}deg)`,
            boxShadow: `0 0 14px ${colors[i % 4]}66`,
            transition: "transform 1.5s linear",
            borderStyle: i % 2 ? "dashed" : "solid",
          }}
        />
      ))}
      {["✦", "⚡", "✧", "◆", "★", "◇"].map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            fontSize: 14,
            color: colors[i % 4],
            textShadow: `0 0 10px ${colors[i % 4]}`,
            transform: `translate(-50%, -50%) rotate(${i * 60 + progress * 120}deg) translateY(-${50 + progress * 30}px)`,
            transition: "transform 1s linear",
          }}
        >
          {s}
        </span>
      ))}
      <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 44, animation: "chaos-wild 1.4s infinite", filter: `drop-shadow(0 0 14px ${N.pink})` }}>{avatar}</span>
    </>
  );
}

// ─── REGISTRY ────────────────────────────────────────────────
export type Scenario = "dungeon" | "garden" | "space" | "chaos";
export type Variant = 1 | 2 | 3;

export const DIORAMAS: Record<Scenario, Record<Variant, (p: DioramaProps) => ReactNode>> = {
  dungeon: { 1: DioBattle, 2: DioCrystalMine, 3: DioBossDoor },
  garden:  { 1: DioBioPlant, 2: DioGreenhouse, 3: DioMoonForest },
  space:   { 1: DioOrbit, 2: DioRocket, 3: DioConstellation },
  chaos:   { 1: DioGlitch, 2: DioCarnival, 3: DioVortex },
};

export const VARIANT_LABELS: Record<Scenario, Record<Variant, string>> = {
  dungeon: { 1: "Bitka", 2: "Rudnik kristala", 3: "Vrata bossa" },
  garden:  { 1: "Bio-cvijet", 2: "Staklenik", 3: "Mjesečeva šuma" },
  space:   { 1: "Orbita", 2: "Lansiranje", 3: "Zviježđe" },
  chaos:   { 1: "Glitch matrix", 2: "Karneval", 3: "Vrtlog" },
};

export function Diorama({ scenario, variant, progress, avatar }: { scenario: Scenario; variant: Variant; progress: number; avatar: string }) {
  const C = DIORAMAS[scenario]?.[variant] ?? DIORAMAS.dungeon[1];
  return <>{C({ progress, avatar })}</>;
}
