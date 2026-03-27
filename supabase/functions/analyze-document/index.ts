import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, content, images, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Du är ett AI-stöd för studie- och karriärvägledare vid LTH (Lunds Tekniska Högskola).
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
5. **Förslag på nästa steg** - Konkreta åtgärdsförslag`;

    // Build messages array
    const aiMessages: any[] = [{ role: "system", content: systemPrompt }];

    if (mode === "analyze") {
      // Build multimodal content for analysis
      const userContent: any[] = [];

      if (content) {
        userContent.push({
          type: "text",
          text: `Analysera följande material:\n\n${content}`,
        });
      }

      if (images && images.length > 0) {
        for (const img of images) {
          userContent.push({
            type: "image_url",
            image_url: { url: img },
          });
        }
        if (!content) {
          userContent.unshift({
            type: "text",
            text: "Analysera och transkribera innehållet i följande bild(er). Identifiera struktur, teman och nyckelinsikter. Skapa en strukturerad sammanställning.",
          });
        }
      }

      aiMessages.push({ role: "user", content: userContent.length === 1 && userContent[0].type === "text" ? userContent[0].text : userContent });
    } else if (mode === "chat") {
      // Chat mode - include conversation history
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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-krediter slut. Kontakta administratör." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI-tjänsten är inte tillgänglig just nu." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
