# FocusForge — Roadmap po verzijama

> **Datum:** 16. travnja 2026.  
> **Verzija:** 2.0  
> **Pravilo:** Svaka verzija mora biti DEPLOYABLE i SHOWABLE. Nikad ne radiš 3 tjedna bez commita.

---

## Kako čitati ovaj dokument

- `[x]` = gotovo
- `[ ]` = todo
- `[~]` = u tijeku
- **DONE CRITERIA** = kad SVE stavke u verziji imaju `[x]`, verzija je gotova
- **Javi se Claudeu (chat)** = kad završiš verziju, vrati se po novi CLAUDE.md i progress.md

---

## 🎯 v0.1 — "Postoji nešto" (Travanj, Tjedan 1-2)

**Cilj:** Live link s funkcionalnim timerom i osnovnim XP sustavom. Lokalno (localStorage), bez baze.

**Tempo:** 2-5h/tjedan

### Setup
- [x] Node.js 22 + Git + VS Code
- [x] GitHub repo (DavidMerkas/focusforge)
- [x] Vercel auto-deploy
- [x] Supabase projekt (Frankfurt) — koristit ćemo u v0.2
- [x] Next.js 15 + TypeScript + Tailwind + App Router
- [x] Pripremljen CLAUDE.md i docs/progress.md

### Dashboard (statični)
- [x] Bottom navigation bar (Home, Stats placeholder, Shop placeholder, Inv placeholder, Me placeholder)
- [x] Dashboard layout: lik avatar (emoji 🧙), ime, Level 1, XP bar (0/50)
- [x] Streak display (🔥 0)
- [x] Coins display (💰 0)
- [x] "Start Focus" gumb (navigacija na setup screen)
- [x] Tjedni challenge placeholder ("Fokusiraj 100 min ovaj tjedan")

### Setup Screen
- [x] Back gumb (nazad na dashboard)
- [x] Slobodan tekst input za predmet
- [x] Recent dropdown (zadnjih 5 iz localStorage)
- [x] Ako prazno → auto "Opći fokus"
- [x] 4 preset gumba (15/25/45/90 min) — jedan aktivan
- [x] 4 scenarij gumba (⚔️🌱🚀🤡) — vizualno, bez efekta na quest još
- [x] "Start Focus" gumb

### Timer Screen
- [x] Veliki timer countdown (MM:SS)
- [x] Quest title placeholder ("Fokus sesija")
- [x] Lik emoji (🧙)
- [x] Pause / Resume gumb
- [x] Stop gumb (potvrda "Jesi siguran?")
- [x] Timer zvuk/vibra kad završi (browser API)

### Timer Logika
- [x] useState za remaining seconds
- [x] useEffect s setInterval za countdown
- [x] Start → countdown krene
- [x] Pause → countdown stane
- [x] Resume → countdown nastavlja
- [x] Stop → potvrda → nazad na dashboard (25% XP)
- [x] Timer = 0 → completion trigger

### Celebration Screen
- [x] "Sesija završena!" tekst
- [x] +XP earned (animirani counter)
- [x] +Coins earned
- [x] XP bar progress update
- [x] Level up detekcija (ako XP prelazi threshold)
- [x] Level up modal ("Level Up! 🎉")
- [x] "Želiš break?" [Da (X min)] [Skip]
- [x] Break timer (ako Da) → nazad na dashboard
- [x] Skip → nazad na dashboard

### XP/Level sustav (localStorage)
- [x] localStorage helper: save/load user data
- [x] XP formula: `xp = duration * 2`
- [x] Coins formula: `coins = Math.floor(xp * 0.1)`
- [x] Level formula: `level<10 ? 50*level^1.3 : 100*level^1.8`
- [x] XP bar progress (current XP / next level XP)
- [x] Streak tracking (last_session_date, current_streak)

### Polish
- [x] Dark mode kao default
- [ ] Light mode toggle u settings (basic)
- [x] Responsive na mobitelu (test na Chrome DevTools)
- [x] Page title: "FocusForge"
- [x] Favicon (emoji ili basic ikona)

### DONE CRITERIA za v0.1
- [ ] Svi checkboxevi gore su [x]
- [x] Live URL radi bez crasheva
- [x] Možeš proći: start → timer → XP → level up
- [x] Otvoriš na mobitelu i izgleda ok
- [ ] Pokazao si 5 frendova

---

## 🎯 v0.2 — "Podaci su sigurni" (Svibanj, Tjedan 3-4)

**Cilj:** Autentifikacija + spremanje u bazu. Korisnik se može logirati i vidjeti svoj progres na drugom uređaju.

**Tempo:** 1-3h/tjedan (⚠️ MATURA PREP — ne forsirati!)

### Auth
- [x] Supabase client setup (env variables u Vercel)
- [ ] Google OAuth login
- [x] Email/Password login
- [x] Login/Register screen
- [ ] Onboarding flow (prvi put: ime lika, odabir avatara)
- [x] Logout opcija u settings

### Baza
- [x] Kreirati `users` tablicu (level, xp, coins, streak, preferences)
- [x] Kreirati `sessions` tablicu (subject, duration, xp_earned, completed)
- [ ] Migracija localStorage → Supabase (za postojeće korisnike)
- [x] RLS (Row Level Security) na svim tablicama

### Sync
- [x] Save sesija u bazu nakon completion
- [x] Load user data iz baze pri startu
- [ ] Offline fallback: localStorage ako nema neta, sync kad dođe

---

## 🎯 v0.3 — "AI magic" (Srpanj, Tjedan 1-2)

**Cilj:** AI questovi rade! Korisnik vidi personaliziranu priču.

**Tempo:** 10-15h/tjedan 🚀 LJETO

### AI Setup
- [ ] Anthropic SDK install
- [ ] Next.js API route `/api/generate-quest`
- [ ] Quest prompt template (predmet × scenarij × trajanje × jezik)
- [ ] 4 ton varijante u promptu (Dungeon/Vrt/Svemir/Chaos)
- [ ] JSON parsing odgovora

### Quest Cache
- [ ] `quest_cache` tablica u Supabase
- [ ] 1 poziv = 5 questova (batch generation)
- [ ] Shared cache (svi korisnici)
- [ ] Cache lookup prije API poziva
- [ ] Pre-generiranje top 20 predmeta

### Quest UI
- [ ] Quest splash screen (title + desc, 4 sek auto-dismiss)
- [ ] "Let's go!" gumb + "Skip story" gumb
- [ ] Quest title diskretno na vrhu timer screena
- [ ] Tap-to-expand za full desc

### Input sigurnost
- [ ] Client-side filter (lista zabranjenih riječi HR + EN)
- [ ] Prompt instrukcija za Claude: odbij neprikladne predmete
- [ ] Rate limit: max 10 novih generiranja/dan po korisniku
- [ ] Error handling: ako API padne, koristi generic quest

---

## 🎯 v0.5 — "Igra je tu" (Srpanj, Tjedan 3-4)

**Cilj:** Loot, inventory, shop — ekonomija radi.

### Loot sustav
- [ ] `items` tablica (template za sve iteme)
- [ ] `user_items` tablica (inventory korisnika)
- [ ] 80 itema (20 po scenariju × 4 scenarija)
- [ ] Drop rate logika (10-15% base, rarity distribucija)
- [ ] Loot reveal animacija na celebration screenu

### Inventory
- [ ] Inventory screen (equip + storage layout)
- [ ] 3 equip slota (na liku)
- [ ] Storage grid s filter tabovima
- [ ] Item detail view (klik → rarity, bonus, datum)
- [ ] Equip/Unequip flow
- [ ] Bonus calculation iz equipped itema

### Shop
- [ ] Shop screen (grid itema za kupovinu)
- [ ] Avatar kozmetika sekcija
- [ ] Potioni sekcija
- [ ] Utility sekcija
- [ ] Premium upgrades sekcija (extra slotovi)
- [ ] Kupovina flow (potvrda → oduzmi coinse → dodaj item)
- [ ] "Nemaš dovoljno coinsa" feedback

### Potion sustav
- [ ] Potion slot na setup screenu (max 2)
- [ ] XP Boost, Coin Boost, Loot Boost, Streak Freeze
- [ ] Potion efekt primjena na sesiju
- [ ] Potrošnja nakon sesije

---

## 🎯 v0.7 — "Streakovi i analitika" (Kolovoz, Tjedan 1-2)

**Cilj:** Stats ekran, perkovi, weekly challenges — dubina.

### Stats ekran
- [ ] Ukupne statistike (sesije, minute, dani)
- [ ] Graf zadnjih 30 dana (line chart, Recharts)
- [ ] Top 5 predmeta (pie chart)
- [ ] Heatmap kalendar (GitHub contributions stil)
- [ ] Najbolji dan ("Rekord: 3h 45min u utorak")

### Passive Perks
- [ ] Perk unlock svaki 10. level
- [ ] Perk selection screen (biraj 1 od 3)
- [ ] 10-15 perkova dizajnirano i balansirano
- [ ] Perk efekti implementirani (XP/coin bonusi)
- [ ] Perkovi vidljivi na profilu (👤 Me tab)

### Weekly Challenges
- [ ] Auto-generirani svakog ponedjeljka
- [ ] 2-3 challengea tjedno (total minutes, session count, subject diversity)
- [ ] Progress bar na dashboardu
- [ ] Completion reward (+200 XP, +coins)

### Achievements
- [ ] `achievements` tablica
- [ ] 15-20 achievementa (streak 7/30/100, first session, level milestones...)
- [ ] Achievement unlock notifikacija (in-app)
- [ ] Achievement prikaz na profilu

### CSS Animacije (idle)
- [ ] Lik idle breathing/bouncing (CSS animation)
- [ ] Celebration particles (confetti)
- [ ] XP bar smooth transition
- [ ] Level up modal animacija

---

## 🎯 v0.8-v0.9 — "Friends" (Kolovoz, Tjedan 3)

**Cilj:** Social sustav — dodavanje prijatelja i viđenje profila.

### Friends sustav
- [ ] `friends` tablica (user_id, friend_id, status)
- [ ] Friend code generator (6 znakova, unique)
- [ ] "Dodaj prijatelja" (unesi kod → šalje request)
- [ ] Request prihvaćanje/odbijanje
- [ ] Friends lista screen
- [ ] Friend profil view (level, streak, tjedni podaci, equipped, achievements)
- [ ] Remove friend opcija
- [ ] Block opcija

### Reactions
- [ ] Emoji reaction na friend achievements (🎉👏💪🔥)
- [ ] Notifikacija "David ti je dao 🎉" (in-app, NE push)

---

## 🎯 v1.0 — "LAUNCH" (Kolovoz, Tjedan 4)

**Cilj:** Polish, responsive, deploy, beta rollout.

### Polish
- [ ] Responsive test na 5+ uređaja (Chrome DevTools)
- [ ] Dark/Light mode toggle radi svuda
- [ ] Loading states za sve async operacije
- [ ] Error handling za sve edge cases
- [ ] Empty states (prazna friends lista, prazan inventory...)
- [ ] Onboarding tour za nove korisnike (opcionalno)

### Performance
- [ ] Lighthouse score > 80
- [ ] Largest Contentful Paint < 2.5s
- [ ] First Input Delay < 100ms

### Launch
- [ ] Landing page (što je FocusForge, screenshot, "Probaj besplatno")
- [ ] Beta rollout: Val 1 (5 frendova) → Val 2 (razred) → Val 3 (100+)
- [ ] Feedback forma (Google Forms link u app)
- [ ] Bug tracking (GitHub Issues)

---

## 🔮 v1.5+ — Post-Launch (Rujan 2026+)

- [ ] Encourage (high-five = XP boost)
- [ ] Gift sustav (pošalji potion prijatelju)
- [ ] Trading (razmjena itema)
- [ ] PWA (manifest + service worker + install)
- [ ] Engleski jezik (i18n)
- [ ] Novi scenariji (Pirate Ship, Cyberpunk, Haunted House)
- [ ] Pixel art sprites za lika
- [ ] Combat sustav (lik vs neprijatelj, HP bar)
- [ ] Monetizacija (premium tier 2-3€/mj)
- [ ] Sound efekti
- [ ] Keyboard shortcuts (space = start/pause)

---

## 📝 Changelog

### 2026-04-17
- ✅ Dashboard UI (hero card, XP bar, bottom nav)
- ✅ Setup screen (subject input, duration, scenarij)
- ✅ Timer screen (countdown, pause/resume, stop modal)
- ✅ Celebration screen (animirani XP counter, level up modal, break timer)
- ✅ localStorage sustav (XP, coins, level, streak, recent subjects)
- ✅ Polish (dark mode, favicon, page title, mobile responsive)
- ✅ Vercel deploy potvrđen

### 2026-04-16
- ✅ v0.1 setup gotov (Node, Git, VS Code, GitHub, Vercel, Supabase)
- ✅ Kompletna vizija definirana (7 sekcija)
- ✅ Roadmap razrezan na verzije
- ✅ Welcome page zamijenjen "FocusForge 🧙" placeholderom

---

## 🐛 Bugovi

(prazno za sad)

---

## 💡 Ideje za budućnost

- Custom avatari (AI generiranje slika?)
- Classroom mode za profesore
- Parent dashboard (roditelj vidi statistike djeteta)
- Multiplayer focus sesije (co-focus)
- Sezonski eventi (Halloween scenarij, Božić scenarij)
- Leaderboard (opcionalan, opt-in)
