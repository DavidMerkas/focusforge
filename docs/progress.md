# 📊 FocusForge — Progress Tracker

> Živi dokument. Ažurira se nakon svake završene stavke.
> Format: `[x]` = gotovo, `[ ]` = todo, `[~]` = u tijeku

---

## 🎯 v0.1 — "Postoji nešto" (Tjedan 1-2)

**Cilj:** Live link s funkcionalnim timerom i osnovnim XP sustavom (lokalno, bez baze).

### Setup
- [x] Node.js 22 + Git + VS Code instalirani
- [x] GitHub račun (DavidMerkas)
- [x] Vercel račun + povezan s GitHub-om
- [x] Supabase projekt kreiran (Frankfurt, free tier) — koristit ćemo u v0.2
- [x] Next.js 15 projekt s TypeScript + Tailwind + App Router
- [x] Prvi push na GitHub
- [x] Vercel auto-deploy radi → https://focusforge-gules.vercel.app

### Home screen UI (statički)
- [x] Welcome page zamijenjen s "FocusForge 🧙" placeholderom
- [ ] Layout: header + main content + footer
- [ ] Lik kartica (avatar emoji + ime + level + XP bar)
- [ ] Timer display (statični "25:00")
- [ ] Start/Pause/Reset gumbi (samo izgled)
- [ ] Preset selector (15/25/45/90 min)

### Timer logika
- [ ] useState za remaining time
- [ ] useEffect s setInterval za countdown
- [ ] Start funkcija
- [ ] Pause funkcija
- [ ] Reset funkcija
- [ ] On complete → trigger XP gain
- [ ] Switch focus → break mode automatski

### XP sustav (lokalno)
- [ ] localStorage helper funkcije (save/load)
- [ ] XP calculation: `xp = duration * 2`
- [ ] Level calculation: `level = floor(sqrt(xp/100)) + 1`
- [ ] XP bar progress
- [ ] Level-up trigger

### Level-up animacija
- [ ] Install Framer Motion
- [ ] Modal "Level Up!"
- [ ] Confetti effect (opcionalno)

### Polish
- [ ] Responsive na mobitelu
- [ ] Dark mode kao default
- [ ] Favicon
- [ ] Page title ("FocusForge — Focus & Forge Yourself")

---

## 🔮 v0.2 — "Wow, zanimljivo" (Tjedan 3-4)

- [ ] Supabase client setup
- [ ] Google OAuth login
- [ ] Email/Password login
- [ ] User profile tablica
- [ ] Sessions tablica
- [ ] Spremanje sesija u bazu (umjesto localStorage)
- [ ] Coins sustav

---

## 🔮 v0.3 — "AI magic" (Tjedan 5-6)

- [ ] Anthropic SDK setup
- [ ] Quest cache tablica
- [ ] API route za quest generation
- [ ] AI komentari likova
- [ ] Mod selector (RPG/Sci-fi/Meme/Cozy)

---

## 📝 Changelog (po datumima)

### 2026-04-16
- ✅ Setup gotov, prvi deploy live
- ✅ Welcome page → FocusForge placeholder
- ✅ Pripremljen CLAUDE.md i progress.md za Claude Code

---

## 🐛 Bugovi za popraviti

(prazno za sad)

---

## 💡 Ideje za kasnije

- Sound efekti (8-bit "level up" zvuk)
- Custom avatari preko AI generiranja slika
- Dark/Light mode toggle (default dark)
- Keyboard shortcuts (space = start/pause)
