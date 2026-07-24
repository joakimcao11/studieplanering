import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FORMAT_RULES = `KRITISKA FORMATERINGSREGLER (måste följas):
- Använd ALDRIG asterisker (* eller **) för fetstil eller markering.
- Använd ALDRIG markdown-syntax: ingen #, ##, ###, _, __, >, ` + "`" + `, eller |.
- Använd ALDRIG citattecken runt rubriker eller fältvärden.
- Skriv rubriker på egen rad i vanlig text utan tecken framför.
- Lämna en tom rad mellan rubrik och innehåll.
- Använd "- " (bindestreck + mellanslag) för punktlistor.
- Använd ren, lättläst svenska. Skriv professionellt och tydligt.`;

const SYSTEM_PROMPTS: Record<string, string> = {
  "meeting-notes": `Du är ett AI-stöd för studie- och karriärvägledare vid LTH (Lunds Tekniska Högskola).
Din uppgift är att skapa en ren, strukturerad minnesanteckning från ett vägledningssamtal.

${FORMAT_RULES}

Strukturera minnesanteckningen exakt så här (rubriker som vanlig text, inga tecken framför):

Datum: <datum>
Student: <namn> (<årskull>)
Program: <program>
Studievägledare: <namn>

Bakgrund
<kort beskrivning av studentens situation>

Diskussion
<vad som togs upp under samtalet, kurser, läsperioder, HP, restkurser, omtentor>

Handlingsplan
- <konkret åtgärd 1>
- <konkret åtgärd 2>

Nästa steg
<eventuell uppföljning eller nästa möte>

Använd kurskoder och HP där det är relevant. Skriv kortfattat men fullständigt.`,

  analyze: `Du är ett AI-stöd för studie- och karriärvägledare vid LTH.
Din uppgift är att skapa en ren, strukturerad minnesanteckning från ett vägledningssamtal.

${FORMAT_RULES}

Strukturera så här (rubriker som vanlig text):

Datum: <datum>
Student: <namn> (<årskull>)
Studievägledare: <namn>

Bakgrund
<text>

Diskussion
<text>

Handlingsplan
- <punkt>

Nästa steg
<text>`,

  "email-draft": `Du är ett AI-stöd för studie- och karriärvägledare vid LTH.
Din uppgift är att skapa ett vänligt och professionellt mailutkast till studenten som en minnesanteckning av mötet.

${FORMAT_RULES}

Mailet ska:
- Börja med "Hej <förnamn>,"
- Vara varmt och professionellt i tonen
- Innehålla en kort sammanfattning av vad som diskuterades
- Lista eventuella kurser som punktlista (kurskod, namn, HP, läsperiod)
- Inkludera handlingsplan/nästa steg som punktlista om relevant
- Hålla det kortfattat och lättläst
- Avslutas med "Med vänliga hälsningar," följt av studievägledarens namn på ny rad

Skriv ren, flytande text utan markdown-tecken eller asterisker.`,

  summary: `Du är ett AI-stöd för studie- och karriärvägledare vid LTH.
Din uppgift är att skapa en strukturerad sammanställning av uppladdat material.

${FORMAT_RULES}

Strukturera sammanställningen så här (rubriker som vanlig text på egen rad):

Datum: <datum>
Student: <namn>
Studievägledare: <namn>

Sammanfattning
<övergripande beskrivning av materialet>

Huvudsakliga teman
- <tema 1>
- <tema 2>

Strukturerad översikt
<detaljerad genomgång av innehållet>

Reflektioner
<insikter och observationer>

Rekommendationer
- <konkret förslag 1>
- <konkret förslag 2>

Skriv ren text utan asterisker, citattecken eller andra markdown-tecken.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, content, images, messages, studentInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS["meeting-notes"];

    const styleTemplate = studentInfo?.styleTemplate as "short" | "standard" | "detailed" | undefined;
    const styleAppendix =
      styleTemplate === "short"
        ? "\n\nSTILINSTRUKTION: Håll svaret mycket kort (max ca 150 ord). Använd punktlistor och skriv rakt på sak. Utelämna långa förklaringar."
        : styleTemplate === "detailed"
        ? "\n\nSTILINSTRUKTION: Skriv utförligt och förklarande. Motivera resonemang och ge kontext under varje rubrik. Balansera prosa med punktlistor där det passar."
        : "";

    const aiMessages: any[] = [{ role: "system", content: systemPrompt + styleAppendix }];

    // Build a structured studentInfo block to inject as user-context
    const studentInfoBlock = studentInfo
      ? `Kontext om studenten och samtalet (använd dessa exakta värden i minnesanteckningen):
- Datum: ${studentInfo.formattedDate || studentInfo.date || ""}
- Studentens namn: ${studentInfo.studentName || "(ej angivet)"}
- Program: ${studentInfo.program || ""}
- Årskull: ${studentInfo.yearGroup || ""}
- Studievägledare: ${studentInfo.counselorName || "(ej angiven)"}

${
  Array.isArray(studentInfo.actionPlan) && studentInfo.actionPlan.length > 0
    ? `\nHandlingsplan – kurser som ska planeras in (inkludera dessa under en rubrik "Handlingsplan – kurser" som lista):\n` +
      studentInfo.actionPlan
        .map((c: any) => `- ${c.code} ${c.name} (${c.hp} hp) – ${c.term} ${c.placement}`)
        .join("\n") +
      `\n`
    : ""
}
`
      : "";

    if (mode === "analyze" || mode === "meeting-notes" || mode === "email-draft" || mode === "summary") {
      const userContent: any[] = [];

      const baseText = content || "";
      if (studentInfoBlock || baseText) {
        const prefix = mode === "email-draft"
          ? "Skapa ett mailutkast baserat på följande material:\n\n"
          : mode === "summary"
          ? "Skapa en strukturerad sammanställning av följande material:\n\n"
          : "Skapa en strukturerad minnesanteckning baserat på följande material:\n\n";
        userContent.push({ type: "text", text: `${studentInfoBlock}${prefix}${baseText}` });
      }

      if (images && images.length > 0) {
        for (const img of images) {
          userContent.push({ type: "image_url", image_url: { url: img } });
        }
        if (!content && !studentInfoBlock) {
          const defaultText = mode === "email-draft"
            ? "Skapa ett mailutkast baserat på innehållet i följande bild(er)."
            : mode === "summary"
            ? "Skapa en strukturerad sammanställning av innehållet i följande bild(er)."
            : "Analysera och transkribera innehållet i följande bild(er) och skapa en strukturerad minnesanteckning.";
          userContent.unshift({ type: "text", text: defaultText });
        }
      }

      aiMessages.push({
        role: "user",
        content: userContent.length === 1 && userContent[0].type === "text" ? userContent[0].text : userContent,
      });
    } else if (mode === "chat") {
      if (messages && messages.length > 0) {
        for (const msg of messages) {
          aiMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "För många förfrågningar. Försök igen om en stund." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-krediter slut. Kontakta administratör." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI-tjänsten är inte tillgänglig just nu." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
