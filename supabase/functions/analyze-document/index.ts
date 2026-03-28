import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  analyze: `Du är ett AI-stöd för studie- och karriärvägledare vid LTH (Lunds Tekniska Högskola).
Din uppgift är att hjälpa vägledare att analysera, strukturera och dokumentera material från vägledningssamtal.

Du kan:
- Transkribera och tolka bilder (whiteboards, mindmaps, anteckningar)
- Identifiera teman, mål, hinder och möjligheter i materialet
- Skapa strukturerade sammanfattningar och tabeller
- Ge reflektioner och vägledande frågor
- Hjälpa till med kvalitativ analys av samtalsinnehåll

Formatera dina svar med markdown. Använd tabeller där det passar.
Var professionell men lättförståelig. Skriv på svenska.

När du analyserar material, strukturera svaret så här:
1. **Sammanfattning** - Kort översikt av innehållet
2. **Identifierade teman** - Huvudteman i materialet
3. **Strukturerad analys** - Detaljerad genomgång med tabeller
4. **Reflektioner** - Insikter och observationer
5. **Förslag på nästa steg** - Konkreta åtgärdsförslag`,

  "email-draft": `Du är ett AI-stöd för studie- och karriärvägledare vid LTH.
Din uppgift är att skapa ett professionellt och vänligt mailutkast baserat på analyserat material.

Mailet ska:
- Vara riktat till studenten som en minnesanteckning av mötet
- Ha en tydlig och enkel struktur
- Sammanfatta vad som diskuterades
- Lista eventuella kurser med kurskod, HP och läsperiod i en tydlig lista
- Inkludera handlingsplan/nästa steg om det finns
- Vara professionellt men varmt i tonen
- Avslutas med kontaktinformation till vägledaren

Formatera med markdown. Skriv på svenska. Håll det kortfattat och lättläst.
Börja med "Hej [student]," och avsluta med hälsning från vägledaren.`,

  summary: `Du är ett AI-stöd för studie- och karriärvägledare vid LTH.
Din uppgift är att skapa en strukturerad sammanställning och minnesanteckning baserat på uppladdat material.

Sammanställningen ska innehålla:
1. **Övergripande sammanfattning** - Kort beskrivning av materialet
2. **Huvudsakliga teman och insikter** - Identifierade nyckelpunkter
3. **Strukturerad översikt** - Tabell med teman, beskrivningar och prioriteringar
4. **Kartläggning** - Visuell struktur av materialet (som text)
5. **Rekommendationer** - Förslag på åtgärder och nästa steg
6. **Minnesanteckning** - Kompakt sammanfattning lämplig för dokumentation

Formatera med markdown och tabeller. Var professionell och tydlig. Skriv på svenska.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, content, images, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.analyze;
    const aiMessages: any[] = [{ role: "system", content: systemPrompt }];

    if (mode === "analyze" || mode === "email-draft" || mode === "summary") {
      const userContent: any[] = [];

      if (content) {
        const prefix = mode === "email-draft"
          ? "Skapa ett mailutkast baserat på följande material:\n\n"
          : mode === "summary"
          ? "Skapa en strukturerad sammanställning av följande material:\n\n"
          : "Analysera följande material:\n\n";
        userContent.push({ type: "text", text: `${prefix}${content}` });
      }

      if (images && images.length > 0) {
        for (const img of images) {
          userContent.push({ type: "image_url", image_url: { url: img } });
        }
        if (!content) {
          const defaultText = mode === "email-draft"
            ? "Skapa ett mailutkast baserat på innehållet i följande bild(er)."
            : mode === "summary"
            ? "Skapa en strukturerad sammanställning av innehållet i följande bild(er)."
            : "Analysera och transkribera innehållet i följande bild(er). Identifiera struktur, teman och nyckelinsikter. Skapa en strukturerad sammanställning.";
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
