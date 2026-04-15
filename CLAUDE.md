# CLAUDE.md — Instrukcije za Claude Code

> Ovaj fajl Claude Code čita automatski pri startu. Sadrži sve što treba znati o projektu, autoru i načinu rada.

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
- ⏰ Realno raspoloživo: 2–5h tjedno

---

## 📐 Pravila komunikacije s Davidom

### JEZIK
- **Sva komunikacija na HRVATSKOM jeziku**
- Tehnički termini mogu ostati na engleskom (component, state, props, hook, deploy...)
- Komentari u kodu: **na engleskom** (industry standard, lakše dijeliti kasnije)

### NAČIN OBJAŠNJAVANJA
- Prije nego napišeš kod koji koristi novi koncept → **objasni koncept prvo**
- Koristi vizualne prikaze: tablice, ASCII dijagrame, blok prikaze
- Usporedi novi koncept s nečim što David zna (najčešće C# ili SQL)
- Komentiraj svaki red novog koda prvi put kad ga uvodiš

### KORACI
- **Mali koraci, vidljiv napredak.** Bolje 1 stvar koja radi nego 5 polovičnih.
- Nakon svake promjene reci **"sad otvori localhost:3000 i provjeri"**
- Ako nešto ne radi → traži točan error, ne pretpostavljaj

### PITAJ KAD JE NEJASNO
- Ako postoji više razumnih opcija (npr. "želiš dark ili light mode?") → **pitaj kratko**, ne pretpostavljaj
- Koristi 2–4 opcije, ne open-ended pitanja

---

## 🎯 O projektu (FocusForge)

**Što je:** Pomodoro produktivna aplikacija s RPG mehanikom (XP, coins, loot) i AI-generiranim questovima vezanim uz stvarno učenje korisnika.

**USP:** Jedina Pomodoro RPG app gdje AI generira priču na temelju onoga što korisnik stvarno uči.

**Ciljana publika (faza 1):** Hrvatski srednjoškolci i studenti (15–25), Zagreb i veći gradovi.

**📖 PUNA SPECIFIKACIJA:** Vidi `focusforge-spec.md` — sve mehanike, database schema, roadmap, USP detalji.

---

## 🛠️ Tehnički stack

```
Frontend:   Next.js 15 (App Router) + TypeScript + Tailwind CSS
Backend:    Supabase (PostgreSQL + Auth + Storage)
AI:         Claude API (Haiku za questove, Sonnet za premium)
Hosting:    Vercel (auto-deploy iz GitHub-a)
Repo:       https://github.com/DavidMerkas/focusforge
Live:       https://focusforge-gules.vercel.app
```

**Već instalirano u projektu:**
- TypeScript ✅
- Tailwind CSS v4 ✅
- ESLint ✅
- App Router ✅
- Turbopack ✅
- src/ folder struktura ✅

**Još NIJE instalirano (dodaj kad zatreba):**
- shadcn/ui (komponente)
- Recharts (grafovi)
- Framer Motion (animacije)
- Supabase client
- Anthropic SDK

---

## 📍 Gdje smo SAD (v0.1 status)

✅ **Završeno:**
- Setup dev okruženja (Node, Git, VS Code)
- Next.js projekt kreiran s svim opcijama
- GitHub repo + Vercel auto-deploy pipeline
- Supabase projekt kreiran (regija: Frankfurt, free tier)
- Welcome page zamijenjen s "FocusForge 🧙" placeholderom (`src/app/page.tsx`)

🔜 **Sljedeći koraci (vidi `docs/progress.md` za detalje):**
1. Home screen UI (lik placeholder + timer display + preset gumbi) — STATIČKI
2. Timer logika (countdown, start/pause/reset)
3. XP sustav (lokalna pohrana u localStorage za sad)
4. Level-up animacija (Framer Motion)

⏳ **Ostavljeno za v0.2:** Supabase auth, baza, spremanje sesija

---

## 📁 Struktura projekta

```
focusforge/
├── src/
│   └── app/
│       ├── page.tsx           ← home screen (mijenjamo sad)
│       ├── layout.tsx         ← root layout, fonts, metadata
│       └── globals.css        ← Tailwind + global stilovi
├── public/                    ← statički fajlovi (slike, ikone)
├── docs/
│   └── progress.md            ← detaljni progress tracker
├── README.md                  ← projekt overview
├── focusforge-spec.md         ← FULL specifikacija
├── CLAUDE.md                  ← OVAJ FAJL (instrukcije)
├── AGENTS.md                  ← Next.js best practices (auto)
└── package.json               ← dependencies
```

---

## 🎨 Design smjernice

**Vibe:** Dark mode, gameri, RPG feel ali clean
**Boje (početne, mogu se mijenjati):**
- Pozadina: `bg-slate-900` (tamno siva)
- Akcent: `bg-purple-600` (RPG magija)
- Tekst: `text-white` / `text-slate-300`
- Uspjeh: `text-green-400`
- Upozorenje: `text-amber-400`

**Tipografija:** Default Next.js (Geist) je ok za sad

---

## ⚠️ Stvari koje NE radi bez pitanja

- **Ne instaliraj nove pakete** bez objašnjenja zašto su potrebni
- **Ne mijenjaj dependencies** u `package.json` ručno
- **Ne pravi velike refactore** — uvijek mali koraci
- **Ne koristi React Compiler** (eksperimentalno, ostavili smo isključeno)
- **Ne dodaj autentifikaciju ni bazu** dok ne završimo v0.1 lokalno

---

## 🔄 Workflow

1. David kaže što želi
2. Ti objasniš pristup (kratko, vizualno)
3. Ti napišeš kod (s komentarima ako je novi koncept)
4. David spremi i provjeri u browseru
5. Ako radi → commit + push
6. Update `docs/progress.md` s novom završenom stavkom

**Commit poruka format:**
```
feat: dodan timer countdown
fix: popravljen XP calculation bug
docs: update progress.md
style: dark mode za sve gumbe
```

---

**Verzija:** 1.0
**Zadnji update:** 16. travnja 2026.
