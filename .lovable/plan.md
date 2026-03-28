

## Plan: Dokumentationsstöd-uppgraderingar + Professionell Word-mall

### Update 1: "Generera mailutkast" i Dokumentationsstöd
- Ny knapp "Generera mailutkast" som visas efter analys
- Anropar edge function `analyze-document` med `mode: 'email-draft'` och analysresultatet som kontext
- System-prompt instruerar AI att skapa en professionell, kort minnesanteckning i mailformat baserat på uppladdat material
- Resultatet visas i en kopierbar textruta med "Kopiera"-knapp

**Edge function-ändring** (`analyze-document/index.ts`): Lägg till `mode: 'email-draft'` med anpassad system-prompt för att generera ett strukturerat mailutkast.

### Update 2: Modern chatt-UI (ChatGPT-stil)
Omdesign av chattkomponenten i DocumentSupportTab:
- Fullhöjds chattvy med avatar-ikoner (bot = Sparkles-ikon, user = User-ikon)
- Bättre markdown-rendering: tabeller med `remarkGfm`, kodblock med syntax-highlighting via `rehype-raw`
- Typing-indikator med animerade prickar
- Tidsstämplar per meddelande
- Chattbubblor med tydligare visuell hierarki, skuggor och rundade hörn
- Separata sektioner för kod, tabeller och vanlig text
- Beroende: lägg till `remark-gfm` för GFM-tabellstöd

### Update 3: "Skapa sammanställning"
- Ny knapp "Skapa sammanställning" bredvid "Analysera material"
- Anropar edge function med `mode: 'summary'` och en prompt som fokuserar på att skapa en minnesanteckning och översikt
- Genererar: sammanfattning, nyckelinsikter, strukturerad översikt, nästa steg
- Resultatet visas i analysresultat-kortet och kan exporteras till Word

**Edge function-ändring**: Lägg till `mode: 'summary'` med specifik system-prompt.

### Update 4: Professionell Word-mall (alla moduler)
Skapa en delad utility-funktion `createProfessionalWordDoc()` i `src/utils/export.ts` som används av alla moduler:

**Professionell mall-design:**
- **Styles**: Definierade `paragraphStyles` med Heading1-3, Normal med konsekventa fonter
- **Sidhuvud**: Titel med färgad linje under (border-bottom på paragraf)
- **Tabeller**: Professionella tabeller med `ShadingType.CLEAR`, cellpadding, färgade headers (#2E75B6 bakgrund, vit text)
- **Avstånd**: Konsekvent `spacing.before/after` med `LineRuleType.AUTO`
- **Sidfot**: Sidfottext + sidnummer + valfri logotyp med tab-stops
- **Sidmarginaler**: 1 inch (1440 DXA) runt om
- **Sektionsrubriker**: Blå accent-linje under rubriker

**Filer som ändras:**
1. `src/utils/export.ts` — Uppdatera `exportToWord` med professionell mall
2. `src/components/DocumentSupportTab.tsx` — Ny mailutkast-funktion, sammanställning, modern chatt, uppdaterad Word-export
3. `supabase/functions/analyze-document/index.ts` — Nya modes: `email-draft`, `summary`
4. `src/components/SimplePlanningTab.tsx` — Uppdatera Word-export att använda samma professionella mall-stil (via delad funktion)
5. `src/components/TextToTextTab.tsx` — Samma sak

### Tekniska detaljer

**Ny npm-dependency:** `remark-gfm` (för GFM-tabeller i markdown)

**Edge function modes (analyze-document):**
- `analyze` — befintlig, oförändrad
- `chat` — befintlig, oförändrad
- `email-draft` — ny: genererar kortfattat mailutkast med minnesanteckning
- `summary` — ny: genererar strukturerad sammanställning/minnesanteckning

**Word-mall shared styles** (används av alla exportfunktioner):
```text
┌──────────────────────────────────┐
│  [Vägledare namn + email]        │
│  ─────────────────────────────── │
│  MINNESANTECKNINGAR              │
│  ═══════════════════════════════ │
│  Syfte: ...  Datum: ...          │
│  Student: ...  Program: ...      │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Studieplanering (tabell)    │ │
│  │ Kurs │ HP │ LP │ Status    │ │
│  └─────────────────────────────┘ │
│                                  │
│  Handlingsplan                   │
│  ☐ Uppgift 1                    │
│                                  │
│  ─────────── Sidfot ──────────  │
│  LTH Vägledning    Sida X      │
└──────────────────────────────────┘
```

