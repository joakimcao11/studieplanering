import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Course database for reference
const courseDatabase: Record<string, { name: string; hp: number; program: string }> = {
  // D-program
  FMAB65: { name: "Endimensionell analys B1", hp: 7.5, program: "D/C" },
  EDAB05: { name: "Programmering, grundkurs", hp: 10.5, program: "D/C" },
  FMAB70: { name: "Endimensionell analys B2", hp: 7.5, program: "D/C" },
  EXTA65: { name: "Kognition", hp: 4.5, program: "D" },
  FAFA60: { name: "Fotonik", hp: 5.0, program: "D" },
  EDAA01: { name: "Programmeringsteknik - fördjupningskurs", hp: 7.5, program: "D/C" },
  EDAA35: { name: "Utvärdering av programvarusystem", hp: 7.0, program: "D" },
  EDAA40: { name: "Diskreta strukturer i datavetenskap", hp: 5.0, program: "D" },
  FMAB20: { name: "Linjär algebra", hp: 6.0, program: "D" },
  EDAA75: { name: "Diskreta strukturer", hp: 7.5, program: "D/C" },
  FMAB30: { name: "Flerdimensionell analys", hp: 6.0, program: "D" },
  EDAF60: { name: "Objektorienterad modellering och design", hp: 4.5, program: "D/C" },
  EITF65: { name: "Digitalteknik", hp: 9.0, program: "D" },
  EITF45: { name: "Datorkommunikation", hp: 7.5, program: "D" },
  EDAF45: { name: "Programvaruutveckling i grupp - projekt", hp: 7.5, program: "D/C" },
  EITF70: { name: "Datorteknik", hp: 6.0, program: "D" },
  FMAF10: { name: "Tillämpad matematik - Linjära system", hp: 5.0, program: "D/C" },
  EDAF05: { name: "Algoritmer, datastrukturer och komplexitet", hp: 5.0, program: "D" },
  EITA10: { name: "Elektronik", hp: 5.0, program: "D" },
  EDAF95: { name: "Grundläggande funktionsprogrammering", hp: 5.0, program: "D" },
  FMAF01: { name: "Matematik - Funktionsteori", hp: 7.0, program: "D" },
  EDAN40: { name: "Funktionsprogrammering", hp: 7.5, program: "D" },
  FMAF05: { name: "Matematik - System och transformer", hp: 7.0, program: "D" },
  EDAP10: { name: "Flertrådad programmering", hp: 7.5, program: "D" },
  FRTF05: { name: "Reglerteknik, allmän kurs", hp: 7.5, program: "D" },
  ETSF25: { name: "Affärsdriven programvaruutveckling", hp: 7.5, program: "D/C" },
  FMSF20: { name: "Matematisk statistik, allmän kurs", hp: 7.5, program: "D" },
  EITA25: { name: "Datasäkerhet", hp: 7.5, program: "D/C" },
  FMNF05: { name: "Numerisk analys", hp: 6.0, program: "D" },
  FMIF45: { name: "Hållbarhet och resursanvändning med perspektiv på ICT", hp: 4.0, program: "D/C" },
  EITG20: { name: "Kösystem", hp: 5.0, program: "D/C" },
  EITA50: { name: "Signalbehandling i multimedia", hp: 7.5, program: "D" },
  // C-program
  EITA66: { name: "Digitalisering - realisering och systemdesign med användarperspektiv", hp: 12.0, program: "C" },
  MAMA20: { name: "Kognition och interaktionsdesign", hp: 7.5, program: "C" },
  EITA55: { name: "Kommunikationssystem", hp: 7.5, program: "C" },
  MAMF60: { name: "Interaktionsdesign, processkurs", hp: 7.5, program: "C" },
  FMAA21: { name: "Linjär algebra med numeriska tillämpningar", hp: 7.5, program: "C" },
  ETSF10: { name: "Internetprotokoll", hp: 7.5, program: "C" },
  FMSF50: { name: "Matematisk statistik, allmän kurs", hp: 7.5, program: "C" },
  ETSN11: { name: "Trådlösa nätverk och applikationer", hp: 7.5, program: "C" },
  EDAF90: { name: "Webbprogrammering", hp: 7.5, program: "C" },
  EITF06: { name: "Webbsäkerhet", hp: 7.5, program: "C" },
  MAMN01: { name: "Avancerad interaktionsdesign", hp: 7.5, program: "C" },
  EDAF75: { name: "Databasteknik", hp: 7.5, program: "C" },
  EDAG10: { name: "Vetenskapsteori för ingenjörer", hp: 5.0, program: "C" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Ingen text angavs." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build course reference string
    const courseRef = Object.entries(courseDatabase)
      .map(([code, c]) => `${code}: ${c.name} (${c.hp} hp, ${c.program})`)
      .join("\n");

    const systemPrompt = `Du är en studievägledare vid LTH (Lunds Tekniska Högskola). Din uppgift är att ta anteckningar från ett vägledningssamtal och strukturera dem till en tydlig minnesanteckning/studieplan.

KURSDATA (använd denna för att identifiera kurser från kurskoder eller kursnamn):
${courseRef}

REGLER:
1. Om en kurskod nämns (t.ex. FAFA60), inkludera alltid kursnamn och HP från kursdatan ovan.
2. Om ett kursnamn nämns (t.ex. "Fotonik"), identifiera kurskoden och HP.
3. Strukturera output med tydliga rubriker: Datum, Student, Program, Termin, Kurser per läsperiod, Omtentor, Planering framåt.
4. Ange LP (läsperiod) för varje kurs om möjligt.
5. Summera totala HP per läsperiod och totalt för terminen.
6. Skriv på svenska, enkelt och tydligt.
7. Formatera som en professionell minnesanteckning.
8. Om datum nämns i formatet YYMMDD (t.ex. 260216), tolka som 2026-02-16.
9. Om årskull nämns (t.ex. D23), ange program och antagen år.

FORMAT:
---
MINNESANTECKNING – Studievägledning LTH

Datum: [datum]
Studievägledare: [om nämnt]
Student: [namn]
Program: [program och årskull]

TERMIN: [t.ex. VT 2025]

Läsperiod 3:
- [Kurskod] [Kursnamn] – [HP] hp
  
Läsperiod 4:
- [Kurskod] [Kursnamn] – [HP] hp

Omtentor:
- [Kurskod] [Kursnamn] – [tentaperiod]

Totalt HP: [summa]
- LP3: [summa] hp
- LP4: [summa] hp

Planering framåt:
- [anteckningar om nästa steg]

---`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "För många förfrågningar, försök igen om en stund." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-krediter slut, vänligen fyll på." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Kunde inte generera minnesanteckning.";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-study-notes error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Okänt fel" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
