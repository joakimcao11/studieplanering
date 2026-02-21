import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, program, yearGroup, counselorName, counselorEmail, terms, notes, actionItems, date } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build course summary
    let courseSummary = "";
    if (terms && Array.isArray(terms)) {
      terms.forEach((term: any) => {
        const semLabel = term.customSemesterLabel || (term.semester === "HT" ? "Hösttermin" : "Vårtermin");
        const year = term.customYearLabel || term.year;
        courseSummary += `\n${semLabel} ${year}:\n`;
        
        const p1Label = term.semester === "HT" ? "LP1" : "LP3";
        const p2Label = term.semester === "HT" ? "LP2" : "LP4";
        
        if (term.lp1?.length > 0) {
          courseSummary += `  ${p1Label}:\n`;
          term.lp1.forEach((c: any) => {
            const pace = c.studyPace && c.studyPace !== 100 ? ` [${c.studyPace}%]` : "";
            courseSummary += `    - ${c.code}: ${c.name} (${c.hp} hp)${pace}\n`;
          });
        }
        if (term.lp2?.length > 0) {
          courseSummary += `  ${p2Label}:\n`;
          term.lp2.forEach((c: any) => {
            const pace = c.studyPace && c.studyPace !== 100 ? ` [${c.studyPace}%]` : "";
            courseSummary += `    - ${c.code}: ${c.name} (${c.hp} hp)${pace}\n`;
          });
        }
      });
    }

    // Build action items
    let actionItemsText = "";
    if (actionItems && Array.isArray(actionItems) && actionItems.length > 0) {
      actionItemsText = "\nHandlingsplan:\n";
      actionItems.forEach((item: any) => {
        actionItemsText += `- ${item.activity}${item.comment ? ` (${item.comment})` : ""}${item.done ? " ✓" : ""}\n`;
      });
    }

    const systemPrompt = `Du är en studievägledare vid LTH. Din uppgift är att skriva ett professionellt och vänligt mailutkast till en student som sammanfattar ett vägledningsmöte.

REGLER:
1. Skriv på svenska, tydligt och professionellt men vänligt.
2. Inkludera alla kurskoder, HP och läsperioder.
3. Mailet ska vara en minnesanteckning från mötet.
4. Inkludera handlingsplanen om den finns.
5. Avsluta med kontaktuppgifter till studievägledaren.
6. Formatera som ren text (inget HTML), redo att kopieras och klistras in i e-post.
7. Ämnesrad ska föreslås separat i början.`;

    const userContent = `Skapa ett mailutkast baserat på följande information:

Student: ${studentName || "Ej angivet"}
Program: ${program || "Ej angivet"}${yearGroup ? ` (${yearGroup})` : ""}
Datum: ${date || new Date().toLocaleDateString("sv-SE")}
Studievägledare: ${counselorName || "Ej angivet"}
E-post studievägledare: ${counselorEmail || "Ej angivet"}

Planerade kurser:${courseSummary || "\nInga kurser planerade."}
${actionItemsText}
${notes ? `\nÖvriga anteckningar:\n${notes}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "För många förfrågningar, försök igen om en stund." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-krediter slut." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Kunde inte generera mailutkast.";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-email-draft error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Okänt fel" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
