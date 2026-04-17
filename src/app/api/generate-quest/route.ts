import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Tone descriptions for each scenario
const SCENARIO_TONES: Record<string, string> = {
  dungeon: "RPG fantasy stil, dramatičan i epski ton. Korisnik je heroj koji kreće u opasnu misiju.",
  garden: "Cozy, poetičan i smiren ton. Korisnik je vrtlar koji uzgaja znanje.",
  space:  "Sci-fi napetost, tehnički ali uzbudljiv ton. Korisnik je astronaut na misiji.",
  chaos:  "Meme-speak, Gen Z humor, apsurdno ali motivirajuće. Kaotično i smiješno.",
};

// Hardcoded quests for each scenario (used when ANTHROPIC_API_KEY is not set)
const FALLBACK_QUESTS: Record<string, { title: string; description: string }[]> = {
  dungeon: [
    { title: "Tamnica Znanja", description: "Heroju, pred tobom se proteže mračna tamnica puna tajni. Tvoje oružje je fokus, a nagrada — mudrost. Kreni naprijed i ne zastaj!" },
    { title: "Čarobnjakov Izazov", description: "Stari čarobnjak čeka na vrhu tornja. Samo onaj tko savlada ovu lekciju može proći. Pokaži što znaš!" },
  ],
  garden: [
    { title: "Sjeme Mudrosti", description: "Svako sjeme znanja treba vremena da nikne. Zasadi fokus u ovaj trenutak i promatraj kako raste razumijevanje." },
    { title: "Jutarnja Rosa", description: "Tiho jutro, mirna misao. Tvoj vrt čeka pažljive ruke i strpljiv um. Uživaj u procesu učenja." },
  ],
  space: [
    { title: "Misija Alpha-7", description: "Brodski kompjuter javlja: do odredišta ostaje točno toliko minuta. Fokusiraj sve sustave i izvedi zadatak. Zemlja gleda." },
    { title: "Svemirska Postaja", description: "Gravitacija ne postoji, ali znanje ima težinu. Pristupačno samo onima koji se usude učiti u vakuumu." },
  ],
  chaos: [
    { title: "Apsolutni Gremlin Mode", description: "ok slušaj nema vremena za objašnjenja samo UČI brate, clock is ticking, vibes immaculate, let's GOOO 🔥" },
    { title: "Speedrun života", description: "Aktualni any% rekord je upravo obrisan. Ti si novi speedrunner učenja. Chat vjeruje u tebe. POG." },
  ],
};

export async function POST(req: NextRequest) {
  const { subject, scenario, durationMin, userId } = await req.json();

  // Validate inputs
  if (!subject || !scenario || !durationMin || !userId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Create Supabase client with service role to bypass RLS for cache reads
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check cache first — reuse existing quest for same subject+scenario+duration
  const { data: cached } = await supabase
    .from("quest_cache")
    .select("title, description")
    .eq("subject", subject.toLowerCase())
    .eq("scenario", scenario)
    .eq("duration_min", durationMin)
    .limit(5);

  if (cached && cached.length > 0) {
    // Pick a random cached quest
    const quest = cached[Math.floor(Math.random() * cached.length)];
    return NextResponse.json(quest);
  }

  // Try to generate with Claude if API key exists
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });

      const tone = SCENARIO_TONES[scenario] ?? SCENARIO_TONES.dungeon;

      const message = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Generiraj kratki RPG quest za Pomodoro focus sesiju.

Predmet učenja: ${subject}
Trajanje: ${durationMin} minuta
Ton: ${tone}

Vrati SAMO JSON ovog formata (bez dodatnog teksta):
{"title": "kratki naziv questa (max 5 riječi)", "description": "motivirajući opis questa (2-3 rečenice, na hrvatskom)"}

Pravila:
- Spoji temu (${subject}) s RPG pričom
- Ne spominji eksplicitno "Pomodoro" ili "timer"
- Budi kreativan i motivirajući
- Samo JSON, ništa drugo`,
        }],
      });

      const raw = message.content[0].type === "text" ? message.content[0].text : "";
      const quest = JSON.parse(raw);

      // Save to cache for future use
      await supabase.from("quest_cache").insert({
        subject: subject.toLowerCase(),
        scenario,
        duration_min: durationMin,
        title: quest.title,
        description: quest.description,
      });

      return NextResponse.json(quest);
    } catch {
      // Fall through to fallback if Claude fails
    }
  }

  // No API key or Claude failed — use hardcoded fallback
  const fallbacks = FALLBACK_QUESTS[scenario] ?? FALLBACK_QUESTS.dungeon;
  const quest = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return NextResponse.json(quest);
}
