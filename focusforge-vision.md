# FocusForge — Kompletna Vizija Projekta

> **Autor:** David Merkas, Zagreb  
> **Datum:** 16. travnja 2026.  
> **Verzija vizije:** 2.0  
> **Status:** Definirana vizija, spreman za razvoj

---

## 📌 Što je FocusForge?

Pomodoro produktivna aplikacija s RPG mehanikom (XP, coins, loot) i AI-generiranim questovima vezanim uz stvarno učenje korisnika. Lik korisnika je "tihi companion" koji reagira animacijama, ne riječima.

**USP:** Jedina Pomodoro RPG app gdje AI generira priču na temelju onoga što korisnik stvarno uči.

**Ciljana publika (faza 1):** Hrvatski srednjoškolci i studenti (15–25), Zagreb i veći gradovi.

**Brand filozofija:**
- Privacy-first (nema stranaca, nema DM-a, nema javnih profila)
- Bez pritiska (blagi streak, nema push notifikacija)
- Korisnik dolazi kad želi, app ga čeka

---

## 🎮 1. Core Loop

### Što korisnik radi 80% vremena

```
1. OPEN APP → DASHBOARD
2. Vidi: lik, XP, streak, coins, weekly challenge, "Start Focus"
3. Klik "Start Focus" → SETUP SCREEN
4. Upiše predmet + odabere trajanje + odabere scenarij
5. AI generira quest → QUEST SPLASH (4 sek)
6. FOCUS MODE (timer, lik, props iz scenarija)
7. Timer = 0 → CELEBRATION (XP, coins, loot animacija)
8. "Želiš break?" → [Da / Skip]
9. Nazad na DASHBOARD
```

### Dashboard (above-the-fold, bez scrollanja)

Elementi na dashboardu:
- Lik avatar (centralno, veliki)
- Ime + Level + XP bar
- Streak (vatra + broj dana)
- Coins broj (klikabilan → Shop shortcut)
- Veliki "Start Focus" gumb (primarni CTA)
- Tjedni izazov progress bar

### Setup Screen

- **Predmet:** Slobodan tekst input + Recent dropdown (zadnjih 5 predmeta iz localStorage). Ako prazno → auto "Opći fokus".
- **Trajanje:** 4 preseta: 15min (3min break), 25min (5min break), 45min (15min break), 90min (20min break)
- **Scenarij:** 4 osnovna: ⚔️ Dungeon, 🌱 Vrt, 🚀 Svemir, 🤡 Chaos. Bira se per sesija.
- **Potioni:** Gumb "Use potion" → biraj max 2 potiona za ovu sesiju.

### Focus Mode (staged razvoj)

- v0.1-v0.3: Statika emoji lik + timer + quest title na vrhu
- v0.3: Lik + quest title + progress bar
- v0.5: CSS idle animacije (breathing, blinking)
- v0.7: Pixel art lik (1 set animacija) + 4 scene backgrounda
- v1.0: Combat sustav — lik vs neprijatelj (HP bar, tematski props, animirani environment)
- v1.5+: Drugi scenariji (kopanje, vrt uzgoj, hakiranje...) + zvukovi

### Post-Session Flow

1. Timer = 0:00
2. "Quest Completed!" animacija
3. Rewards count up (jedan po jedan): +XP, +coins, loot drop? (5-15% šanse), level up?
4. Break prompt: "Želiš break?" [Da (X min)] [Skip]
5. Nazad na dashboard

### Kazna za prekid sesije

Mekani sustav:
- Tab-switch < 30s: 100% XP
- Pauziraj sesiju: 50% XP za vrijeme do pauze
- Prekini potpuno: 25% XP za vrijeme dosad
- Streak se NE lomi ako sesija > 50% dovršena

### Frekvencija korištenja

- Varijabilno: 0-6 sesija dnevno
- Tjedni izazov > dnevni
- Blagi streak: motivira ali ne kažnjava
- Streak freeze: 1 besplatan tjedno (kupuju se dodatni u shopu)

---

## 👤 2. Lik & Progresija

### Lik koncept

- LIK = konstanta (tvoj avatar koji raste s tobom)
- SCENARIJ = varijabla (bira se per sesija)
- Lik je TIHI — ne govori, samo REAGIRA animacijama/ekspresijama
- Environment + Props pristup: lik izgleda isto, okolina + objekti su tematski

### Vizualni roadmap lika

- v0.1-v0.3: Emoji + CSS gradijenti
- v0.5: Pixel art lik (1 sprite) + 4 backgrounds
- v0.7: Animirani props (neprijatelji, biljke, tipke)
- v1.0: Full scene animacije + combat
- v1.5+: Više scenarija, zvukovi

### Level sustav

- **Max level:** 100 (soft cap — kasniji levelovi eksponencijalno teži)
- **Brz early game:** Level 2 nakon prve sesije!

XP za level:
- Level < 10: `XP_next = 50 × level^1.3` (brzo, "hooked" osjećaj)
- Level ≥ 10: `XP_next = 100 × level^1.8` (usporava)

Realno trajanje (prosječan korisnik, 3×25min/dan, 5 dana/tj):
- Level 10: ~1 tjedan
- Level 25: ~2 mjeseca
- Level 50: ~8 mjeseci
- Level 100: ~3 godine (hardcore)

### XP formula

Base XP po sesiji:
- 15 min → 30 XP
- 25 min → 50 XP
- 45 min → 90 XP
- 90 min → 180 XP

Multiplieri:
- Streak 3+ dana: ×1.5
- Streak 7+ dana: ×1.75
- Streak 30+ dana: ×2.0
- Tjedni challenge completion: +200 XP flat
- Perk bonus: ×(1 + perk%)
- Equipped item bonus: ×(1 + equip%)

### Coins formula

- Base: 10% od zarađenog XP-a
- Prosječan korisnik: ~75 coinsa/tjedno, ~300/mjesec

### Retention politika

- NEMA kazne za dugu pauzu (level/XP/perkovi ostaju)
- Streak resetira se na 0 (normalno)
- Dobrodošlica natrag (lik reagira pozitivno)

### Passive Perks sustav (D-Lite)

- 3-5 perk slotova
- Svaki 10. level = unlock 1 slot (odabir 1 od 3 ponuđena perka)
- ~10-15 ukupno perkova u igri
- Nema respec-a
- Perkovi daju pasivne bonuse (+X% XP/coins u određenim uvjetima)

---

## 🤖 3. AI Questovi

### Koncept

AI (Claude Haiku) generira fantasy/sci-fi/cozy/meme priču na temelju onoga što korisnik uči. Quest spaja STVARNO gradivo s FANTASY narativom.

Primjer za "Fizika — elektromagnetska indukcija" + Dungeon scenarij:
> **"Bitka s Magnetskim Duhom"**  
> "Duboko u Dungeonu energije, Magnetski Duh plete nevidljiva polja. Samo onaj tko razumije elektromagnetsku indukciju može ga pobijediti. 25 minuta borbe te čekaju."

### Format

- Duljina: 2-3 rečenice (~30-50 riječi)
- Struktura: Setting → Challenge → Stakes/timing
- Jezik: Hrvatski
- JSON format: `{ "title": "...", "description": "...", "reward_hint": "..." }`

### Ton po scenariju

- ⚔️ Dungeon: Epski fantasy, dramski (Tolkien vibes)
- 🌱 Vrt: Smireno, poetično, cozy (Studio Ghibli atmosfera)
- 🚀 Svemir: Sci-fi napetost, tehno (Interstellar vibes)
- 🤡 Chaos: Meme-speak, apsurd, Gen Z (TikTok humor)
- Humor level: srednji — samo Chaos je max humoran

### Prezentacija

1. Setup → klik Start → **Quest Splash Screen** (4 sek auto-dismiss ILI klik "Let's go!")
2. Tijekom sesije: **quest title diskretno na vrhu** (tap-to-expand za opis)
3. "Skip story" gumb koji pamti izbor za buduće sesije

### Cache sustav

- 1 API poziv = 5 questova generiranih odjednom
- Shared cache (svi korisnici dijele)
- Indeksirano po (predmet, scenarij, trajanje, jezik)
- TTL: nikad ne istječe
- Pre-generiranje top 50 popularnih predmeta

### Trošak procjena

- Claude Haiku: ~0.0001€ po pozivu
- S cacheom: ~1€/mj za 500 korisnika
- Skoro besplatno

### Feedback na questove

- v0.1–v1.0: Nema — quest je što je
- v1.5+ (kad 500+ korisnika): Thumbs up/down za community quality control

### AI komentari lika

- NEMA ih. Lik je tihi companion.
- Animacije/ekspresije/particles govore umjesto riječi
- Nema dodatnih API poziva = jeftinije

### Sigurnost (prosti input)

4-slojna obrana:
1. Client-side filter (lista zabranjenih riječi HR + EN)
2. Claude built-in safety (prompt instrukcija za odbijanje neprikladnog)
3. Rate limiting (max 10 novih generiranja po korisniku dnevno)
4. Report/flag sustav u friends kontekstu (kasnije)

---

## 💎 4. Shop & Inventory

### Shop sadržaj

| Kategorija | Primjeri | Raspon cijena |
|---|---|---|
| Avatar kozmetika | Novi izgledi, frizure, boje | 30-600 coinsa |
| Potioni | XP/Coin/Loot Boost, Streak Freeze | 20-40 coinsa |
| Novi scenariji | Pirate Ship, Cyberpunk City... | 500 coinsa |
| Utility | Rename lika, reset weekly | 30-60 coinsa |
| Premium upgrades | Extra perk/inventory slotovi | 120-600 coinsa |

### Cijene (agresivno pojeftinjene)

Avatari:
- Common: 30 coinsa (~4-5 dana)
- Rare: 90 coinsa (~2 tjedna)
- Epic: 250 coinsa (~3-4 tjedna)
- Legendary: 600 coinsa (~2 mjeseca)

Potioni:
- XP Boost (+50%): 20 coinsa
- Coin Boost (+100%): 30 coinsa
- Streak Freeze: 25 coinsa
- Loot Boost (+20%): 40 coinsa

Ostalo:
- Novi scenarij: 500 coinsa
- 4. perk slot: 300 coinsa
- 5. perk slot: 600 coinsa
- Extra inventory slot: 120 coinsa
- Rename lika: 60 coinsa (prva promjena FREE)
- Reset weekly: 30 coinsa

### Dizajn pravilo

- Loot drops iz sesija ≠ shop itemi (nikad se ne preklapaju)
- Shop = "zaradio si coinse, biraj što želiš"
- Loot = "random iz scenarija, priča te prati"

### Loot sustav (iz sesija)

- Drop rate: 10-15% po sesiji
- Rarity distribucija: Common 70% (kozmetika), Rare 20% (+1-3%), Epic 8% (+3-7%), Legendary 2% (+7-12% + visual efekt)
- Loot je tematski po SCENARIJU (ne predmetu)
- 4 scenarija × ~20 itema = ~80 ukupno itema za dizajnirati
- AI quest opis MOŽE spomenuti item (ali item je iz fixed pool-a)

### Potion sustav

- Aktiviraju se PRIJE sesije (na setup screenu)
- Max 2 potiona po sesiji (bilo koja 2)
- Streak Freeze = izuzetak (instant, kad propustiš dan, ne broji se u limit)

### Inventory UI

- **Top:** Equip screen — lik u centru s 3-5 equip slotova oko njega + summary bonusa
- **Bottom:** Storage grid (~6 po redu) + filter tabovi (Sve/Dungeon/Vrt/Svemir/Chaos) + sort (Rarity/Datum/Abc)
- **Klik na item:** Detail view (rarity, scenarij, bonus, datum) + Equip/Unequip
- **Kolekcija progress:** "17/80" na dnu

### Navigacija

Bottom navigation (uvijek vidljiv):
- 🏠 Home (Dashboard)
- 📊 Stats (Grafovi, heatmap)
- 🛒 Shop
- 🎒 Inventory
- 👤 Me (Profil, perkovi, postavke)

Shortcut: Coin counter na dashboardu → klikabilan → Shop

---

## 👥 5. Social (Friends, NE Guildovi)

### Ključni zaokret od spec-a

Umjesto guildova (30 ljudi, leaderboard, grind) → **Friends 1-na-1** (prijatelji, podrška, pozitivno). Razlog: guild sustav forsira engagement, a FocusForge NE tjera korisnika. Friends model je intiman i siguran za mlade.

### Brand positioning

"Privacy-first productivity app za mlade. Tvoj mali krug, nema stranaca, nema DM-a."

### Dodavanje prijatelja

- Friend code: 6 znakova, velika slova + brojevi (npr. "DRK4M9")
- Svaki korisnik ima jedinstveni kod
- 2-way opt-in: šalje se request, mora se prihvatiti
- Nema pretrage, nema discovery-ja, nema javnih profila
- Blok/remove opcija uvijek dostupna

### Friend profil — što se vidi

Vidljivo:
- Avatar lika + equipped itemi
- Username + level + XP bar
- Streak (broj dana)
- Last active ("aktivan prije 2h")
- Broj sesija ovaj tjedan + ukupno min fokusa ovaj tjedan
- Recent achievements (3-5 zadnjih badgeva)

NE prikazujemo:
- Koji predmet uči (osobno)
- Trenutnu aktivnost (real-time tracking = kreepi)
- Sav inventory
- Top predmete
- Coins balance

### Social interakcije (roadmap)

- MVP (v1.0): Reactions (emoji likes na achievements)
- v1.5: Encourage (high-five = +5% XP boost) + Gift (pošalji potion prijatelju)
- v2.0+: Trading (razmjena itema, pažljivo s balansom)

### Namjerno izbjegnuto

- Chat/DM (safety, bullying, grooming rizik)
- 1-on-1 challenges (natjecanje nije brand)
- Public profiles/search
- Guildovi

---

## 📱 6. UX & Platforma

### Platforma

- **Primary:** Mobile-first (portrait, touch-first UI)
- **Secondary:** Desktop (centriran layout, isti UI, max-width ~480px)
- Tablet: dobije mobilni ili desktop layout (nema specifičnog)

### PWA Roadmap

- v0.1–v0.7: Obična web app (browser)
- v1.0: PWA (manifest.json + service worker + install banner)
- v1.5+: Razmišljamo native (Capacitor wrapper) samo ako 500+ aktivnih

### Push notifikacije

**NEMA. NULA. ZERO.**

"Ne možeš tjerat nekoga da uči ako ne želi."

Jedini izuzetak: in-app zvuk/vibra kad sesija završi (browser API, ne push).

### Dark/Light mode

- Oba dostupna, toggle u settings
- Default: dark mode (RPG feel, gamer publika)
- Tailwind `dark:` prefix klase

### Jezik

- v0.1–v1.0: Samo hrvatski
- v1.5+: Engleski (i18n sustav)
- UI tekst: HR
- Komentari u kodu: EN (industry standard)
- AI questovi: HR (prompt instrukcija)

### Offline podrška

- Timer MORA raditi offline (čisti JavaScript, ne treba server)
- Offline radi: timer, XP calculation, lik prikaz, cached questovi
- Online treba: novi AI quest, friends, shop, sync
- Auto sync kad se vrati internet

---

## 💰 7. Biznis & Launch

### Beta rollout plan

- Val 1 (Tjedan 1): 5 najbližih prijatelja (brutalni feedback, bug hunting)
- Val 2 (Tjedan 2-3): Tvoj razred (~25-30 ljudi, WhatsApp grupa)
- Val 3 (Tjedan 4+): Šira škola + online (100+ korisnika)

### Marketing

- Primarni kanal: Word of mouth (škola → razred → paralelke → druge škole)
- Friend code = ugrađeni viral loop
- Profesori kao amplifier
- Sekundarno (kad bude vremena): TikTok/Reels, Reddit, YouTube dev log

### Monetizacija

- Faza 1 (0-200 korisnika): POTPUNO BESPLATNO
- Faza 2 (200+): Premium tier (2-3€/mj)
- Što je premium → odlučuje se na temelju podataka (ne sad)
- Break-even: ~15€/mj trošak, 50 premium korisnika × 2€ = 100€/mj

### Troškovi

- Vercel: 0€ (free tier)
- Supabase: 0€ (free tier do 50k MAU)
- Claude API: ~1-5€/mj (s cacheom)
- Domena: ~1€/mj
- Ukupno: ~5-15€/mj

### KPI-evi

Za sad: samo broj registriranih + tjedni aktivni korisnici.
Kasnije (100+): retention, completion rate, sessions per user.

### Realan timeline

```
Travanj 2026:     v0.1 (timer + lik + XP lokalno)
Svibanj 2026:     v0.2 (auth + baza) — SPORO, matura prep
Lipanj 2026:      ⚠️ MATURA — app zamrznut
Srpanj 2026:      v0.3-v0.5 (AI, loot, shop) — TURBO MODE 🚀
Kolovoz 2026:     v0.7-v1.0 (stats, friends, polish, LAUNCH)
Rujan 2026+:      v1.5 (trading, gift, EN, PWA, monetizacija)
```

---

## 🏗️ Tehnički Stack

```
Frontend:   Next.js 15 (App Router) + TypeScript + Tailwind CSS
Backend:    Supabase (PostgreSQL + Auth + Storage)
AI:         Claude API (Haiku za questove)
Hosting:    Vercel (auto-deploy iz GitHub-a)
Repo:       https://github.com/DavidMerkas/focusforge
Live:       https://focusforge-gules.vercel.app
```

---

**Kraj vizije v2.0.**

> Ovaj dokument je izvor istine za cijeli projekt. Sve odluke su tu. Kad se nešto mijenja — ažuriraj OVDJE prvo.
