# CLAUDE.md — Instrukcije za Claude Code

> Ovaj fajl Claude Code čita automatski pri startu. Sadrži sve što treba znati o projektu, autoru i načinu rada.
> **Verzija:** 2.0 (ažurirano nakon kompletnog vision sessionsa)

---

## 👤 O autoru

**Ime:** David Merkas
**Lokacija:** Zagreb, Hrvatska
**Dob:** 18 godina
**Status:** Učenik srednje škole za informatičara (smjer računalni tehničar)

**Tehničko znanje:**
- ✅ C# (solidno, glavni jezik u školi)
- ✅ SQL i baze podataka (DBP — normalne forme, joinovi, schema design)
- ✅ HTML/CSS osnove
- 🟡 JavaScript (osnove, učim usput)
- 🟡 React (jedan prijašnji projekt — Dinamo tracker)
- ❌ TypeScript (krenuo s ovim projektom)
- ❌ Next.js (krenuo s ovim projektom)
- ❌ Tailwind (krenuo s ovim projektom)

**Stil učenja:**
- 🎨 Vizualni learner — voli mockupe, dijagrame, ASCII art, blok dijagrame
- 🧠 Voli **razumjeti kako stvari rade**, ne samo copy-paste
- ⚡ Voli brz vidljiv napredak (motivacija)
- ⏰ Realno raspoloživo: varira (2-8h/tj škola, 10-20h/tj ljeto)

**Važni datumi:**
- Svibanj/Lipanj 2026: MATURA — app je sekundaran!
- Srpanj/Kolovoz 2026: Ljeto = turbo mode (10-20h/tj)

---

## 📐 Pravila komunikacije s Davidom

### JEZIK
- **Sva komunikacija na HRVATSKOM jeziku**
- Tehnički termini na engleskom ok (component, state, props, hook, deploy...)
- Komentari u kodu: **na engleskom**

### NAČIN OBJAŠNJAVANJA
- Objasni novi koncept PRIJE nego napišeš kod koji ga koristi
- Koristi vizualne prikaze: tablice, ASCII dijagrame, blok prikaze
- Usporedi s C# ili SQL kad je moguće
- Komentiraj svaki red novog koda prvi put

### KORACI
- **Mali koraci, vidljiv napredak.** Bolje 1 stvar koja radi nego 5 polovičnih.
- Nakon svake promjene: "sad otvori localhost:3000 i provjeri"
- Ako nešto ne radi → traži error, ne pretpostavljaj

### PITAJ KAD JE NEJASNO
- 2–4 opcije, ne open-ended pitanja
- Ako imaš concern o odluci → reci iskreno (David prima feedback)

---

## 🎯 O projektu (FocusForge)

**Što je:** Pomodoro RPG app s AI-generiranim questovima vezanim uz stvarno učenje.

**USP:** Jedina Pomodoro RPG app gdje AI generira priču na temelju predmeta koji korisnik uči.

**Brand filozofija:**
- Privacy-first (nema stranaca, nema DM-a, nema javnih profila)
- Bez pritiska (blagi streak, NEMA push notifikacija)
- App te čeka, ne zove te

**📖 PUNA VIZIJA:** Vidi `focusforge-vision.md` — SVE odluke su tu.
**📖 ROADMAP:** Vidi `focusforge-roadmap.md` — verzije + checkboxevi.

---

## 🛠️ Tehnički stack

```
Frontend:   Next.js 15 (App Router) + TypeScript + Tailwind CSS
Backend:    Supabase (PostgreSQL + Auth + Storage)
AI:         Claude API (Haiku za questove)
Hosting:    Vercel (auto-deploy iz GitHub-a)
Repo:       https://github.com/DavidMerkas/focusforge
Live:       https://focusforge-gules.vercel.app
```

**Već instalirano:**
- TypeScript ✅, Tailwind CSS v4 ✅, ESLint ✅
- App Router ✅, Turbopack ✅, src/ folder ✅

**Još NIJE instalirano (dodaj kad zatreba):**
- shadcn/ui, Recharts, Framer Motion
- Supabase client, Anthropic SDK

---

## 📍 Trenutni status

**Trenutna verzija:** v0.1 (u tijeku)

✅ **Završeno:**
- Dev okruženje setup
- Next.js projekt + GitHub + Vercel pipeline
- Supabase projekt kreiran (Frankfurt)
- Welcome page → "FocusForge 🧙" placeholder

🔜 **Sljedeći korak:**
Pogledaj `focusforge-roadmap.md` → sekcija v0.1 za točan checklist.

---

## 📁 Struktura projekta

```
focusforge/
├── src/
│   └── app/
│       ├── page.tsx           ← home/dashboard (mijenjamo sad)
│       ├── layout.tsx         ← root layout, fonts, metadata
│       └── globals.css        ← Tailwind + global stilovi
├── public/                    ← statički fajlovi
├── docs/
│   └── progress.md            ← (zamijenjen s focusforge-roadmap.md)
├── focusforge-vision.md       ← KOMPLETNA VIZIJA (SVE odluke)
├── focusforge-roadmap.md      ← ROADMAP PO VERZIJAMA (checkboxevi)
├── focusforge-spec.md         ← stari spec (reference only)
├── README.md
├── CLAUDE.md                  ← OVAJ FAJL
├── AGENTS.md                  ← Next.js best practices (auto)
└── package.json
```

---

## 🎨 Design smjernice

**Vibe:** Dark mode default, RPG feel ali clean. Light mode dostupan.

**Dark mode boje:**
- Pozadina: `bg-slate-900`
- Sekundarna: `bg-slate-800`
- Akcent: `bg-purple-600` (RPG magija)
- Tekst: `text-white` / `text-slate-300`
- Uspjeh: `text-green-400`
- Upozorenje: `text-amber-400`
- Rarity: Common `text-gray-400`, Rare `text-blue-400`, Epic `text-purple-400`, Legendary `text-yellow-400`

**Light mode:** Inverzne vrijednosti, definiraj kad dođeš do toga.

**Tipografija:** Default Next.js (Geist)

**Layout:**
- Mobile-first (portrait, touch-first)
- Desktop: centriran, max-width ~480px
- Bottom nav: 🏠📊🛒🎒👤

---

## 🎮 Ključne mehanike (quick reference)

### XP
- 15min=30XP, 25min=50XP, 45min=90XP, 90min=180XP
- Streak multiplier: 3+d ×1.5, 7+d ×1.75, 30+d ×2.0

### Coins
- 10% od XP-a

### Level
- level<10: `50 × level^1.3`
- level≥10: `100 × level^1.8`
- Max: 100 (soft cap)

### Perk slotovi
- Unlock svaki 10. level (lvl 10, 20, 30...)
- Dodatni slotovi kupljivi u shopu (300, 600 coinsa)

### Loot
- 10-15% drop rate po sesiji
- Common 70%, Rare 20%, Epic 8%, Legendary 2%
- Tematski po SCENARIJU (ne predmetu)

### Potion
- Max 2 po sesiji, biraj prije starta
- Streak Freeze = izuzetak (instant)

### 4 Scenarija
- ⚔️ Dungeon (RPG fantasy, dramatic ton)
- 🌱 Vrt (Cozy, poetično, smireno)
- 🚀 Svemir (Sci-fi napetost)
- 🤡 Chaos (Meme-speak, Gen Z)

---

## ⚠️ Stvari koje NE radi bez pitanja

- **Ne instaliraj pakete** bez objašnjenja zašto
- **Ne mijenjaj package.json** ručno
- **Ne pravi velike refactore** — mali koraci
- **Ne koristi React Compiler** (isključeno)
- **Ne dodaj auth/bazu** dok ne završimo v0.1
- **Ne dodaj push notifikacije** (NEMA ih, dizajnerska odluka)
- **Ne dodaj guildove** (zamijenjeni Friends sustavom)
- **Ne dodaj chat/DM** (safety odluka)

---

## 🔄 Workflow

1. David kaže što želi
2. Ti objasniš pristup (kratko, vizualno)
3. Ti napišeš kod (komentari ako je novi koncept)
4. David spremi i provjeri
5. Ako radi → commit + push
6. Update `focusforge-roadmap.md` (checkbox → [x])

**Commit poruka format:**
```
feat: dodan timer countdown
fix: popravljen XP calculation bug
docs: update roadmap
style: dark mode za gumbe
refactor: extract timer logic to hook
```

---

**Verzija:** 2.0
**Zadnji update:** 16. travnja 2026.
