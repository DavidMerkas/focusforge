export default function Home() {
  // Static values for now — later these come from state/localStorage
  const heroName = "Hero";
  const level = 1;
  const xp = 30;
  const xpToNext = 100;
  const xpPercent = (xp / xpToNext) * 100;

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* HEADER */}
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          FocusForge <span>🧙</span>
        </h1>
        <div className="text-sm text-slate-300">
          XP: <span className="text-purple-400 font-semibold">{xp}</span> / {xpToNext}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-10">
        {/* Hero card */}
        <section className="flex flex-col items-center gap-3">
          <div className="text-8xl">🧙‍♂️</div>
          <div className="text-xl font-semibold">{heroName}</div>
          <div className="text-sm text-purple-400">Level {level}</div>

          {/* XP bar — width is set via inline style because the value is dynamic */}
          <div className="w-64 h-3 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-purple-600 transition-all"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <div className="text-xs text-slate-400">
            {xp} / {xpToNext} XP
          </div>
        </section>

        {/* Timer display */}
        <section className="text-8xl font-mono font-bold tracking-wider">
          25:00
        </section>

        {/* Preset selector */}
        <section className="flex gap-2 flex-wrap justify-center">
          {[15, 25, 45, 90].map((min) => (
            <button
              key={min}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm transition"
            >
              {min} min
            </button>
          ))}
        </section>

        {/* Controls */}
        <section className="flex gap-3">
          <button className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold transition">
            ▶ Start
          </button>
          <button className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold transition">
            ⏸ Pause
          </button>
          <button className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold transition">
            ↻ Reset
          </button>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="px-6 py-4 border-t border-slate-800 text-center text-sm text-slate-400">
        Made with ⚡ by David
      </footer>
    </main>
  );
}
