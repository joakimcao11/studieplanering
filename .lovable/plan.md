

## Plan

### Update 1: HT2026 som standard i Studieplanering
I `src/hooks/usePlanningState.ts`:
- Ändra default från `[createEmptyTerm('VT', '2026')]` till `[createEmptyTerm('HT', '2026')]`
- Samma ändring i `resetPlan`
- Befintlig `addTerm`-logik ger automatiskt VT2027 som nästa termin (HT → VT, +1 år)

### Update 2: Ny "Live-demo" sida på `/demo`

**Ny route i `src/App.tsx`:** Lägg till `<Route path="/demo" element={<LiveDemo />} />` ovanför catch-all.

**Ny fil `src/pages/LiveDemo.tsx`** — fristående demosida (inget login krävs):

**Layout (nordisk, pedagogisk, inspirerande):**
- Hero-sektion: LTH-logo, rubrik "Live-demo", undertext "Se hur verktyget fungerar på under 3 minuter"
- Stor primär CTA-knapp "▶ Starta simulering"
- Sekundär knapp "Spela om" (visas efter avslutad demo)
- Stegindikator (progress bar + 5 steg: Studieplanering → Importera plan → Dokumentationsstöd → Admin → Statistik)

**Simuleringsmotor (intern):**
- En timeline-baserad sequencer: array av "scener" med varaktighet i ms och callbacks som uppdaterar visuellt state
- Total längd ~2:45 min, fördelat:
  - Intro-overlay (5s): "Möt Student A — Datateknik 2023"
  - Scen 1 — Studieplanering (50s): markörfärd, "klick" på programväljare D, fyller i HT2026 + VT2027 med kurser i LP1/LP2/LP3/LP4 (>15 hp/period, 30 hp/termin), highlight på HP-stapel som fylls
  - Scen 2 — Studentinfo + Handlingsplan (25s): skriver "Student A", väljer kull 2023, lägger till två handlingspunkter ("Kontakta kursansvarig för omregistrering", "Boka uppföljningsmöte i slutet av terminen")
  - Scen 3 — Importera plan (25s): klistrar in samtalsanteckning, AI-bubbla "genererar minnesanteckning"
  - Scen 4 — Dokumentationsstöd (25s): drar in bild av whiteboard, visar AI-analys, chattbubbla
  - Scen 5 — Admin & Statistik (20s): visar dashboard-kort
  - Outro (10s): "Ladda ner underlag" → animerad PDF-modal som scrollar
- Hela demon visas inom en mock-app-frame (inte den riktiga appen) → snabb, deterministisk, alltid lika

**Visuella komponenter inuti `LiveDemo.tsx`:**
- `<DemoCursor />` — animerad muspekare som följer en path mellan target-koordinater (CSS transform, transition: ease-out)
- `<DemoHighlight />` — pulserande ring runt aktivt element (box-shadow + scale)
- `<DemoTooltip />` — tooltip som följer markören med kort förklaringstext
- Mock-skärmar: `<MockPlanering />`, `<MockImport />`, `<MockDocSupport />`, `<MockAdmin />`, `<MockStats />` — förenklade visuella kopior av riktiga skärmar (återanvänder Card, Badge, Button från ui-kit, samma färger)
- Skärmövergångar: fade + slide (Framer-Motion-stil med CSS transitions, 300ms)

**Kontroller:**
- Pause/Resume-knapp under simuleringen
- Hoppa till nästa steg-knapp
- Restart-knapp
- Progress bar synkroniserad med scenen

**Designtoken:** återanvänd befintlig palett (LTH marinblå, vit, ljusgrå accent #2E75B6) från `index.css`. Mjuka rundade hörn (rounded-2xl), subtila skuggor, generös padding.

### Update 3: Word-mall i myndighetsstil

**Ändra `src/utils/export.ts` `exportToWord`:**

Ny struktur (gäller minnesanteckning från Studieplanering/Snabbplanering/Importera plan/Dokumentationsstöd):

**Sidhuvud (på första sidan, högerjusterat block):**
- LTH-logo (vänster) + textblock (höger):
  - "Studievägledningssamtal" (fet)
  - Vägledarens namn
  - Datum
- Tunn horisontell linje under sidhuvudet

**Brödtext:**
- Huvudrubrik "MINNESANTECKNING" — versaler, fet, centrerad eller vänster, stor (32pt), med blå underlinje
- Därefter befintligt innehåll (student, program, agenda, studieplanering, handlingsplan, anteckningar) med snyggare myndighetsstil:
  - Times New Roman / Arial 11pt brödtext
  - 1.15 radavstånd
  - Styckesavstånd 6pt efter
  - Rubriker H2 i mörkblå (#003366)

**Sidfot (på alla sidor):**
```
Postadress Lunds Tekniska Högskola, Studentservice, Box 118, 221 00 Lund
Besöksadress Klas Anshelms Väg 10
Telefon 046-222 72 89   E-post joakim.cao@lth.lu.se
Webbadress www.student.lth.se
```
- 9pt, grå (#555), centrerad
- Tunn linje över sidfoten
- Sidnummer "Sida X av Y" till höger

**Logo:** Använd `src/assets/lth-logo.png` (laddas via `fetch` + arrayBuffer som befintliga koden gör för footer-bild) i sidhuvudet på sida 1, transformation ~120x60px.

**Tillämpning:** Eftersom samma `exportToWord` redan används av Studieplanering, och `SimpleSummaryStep` + `TextToTextTab` + `DocumentSupportTab` har egna export-funktioner — uppdatera även dessa tre att kalla samma nya helper `buildGovernmentDocxSections()` så alla fyra moduler får identisk myndighetsmall.

### Filer som ändras
- `src/hooks/usePlanningState.ts` — HT2026 default
- `src/App.tsx` — `/demo` route
- `src/utils/export.ts` — myndighetsmall + sidfot/sidhuvud
- `src/components/TextToTextTab.tsx`, `src/components/simple-planning/SimpleSummaryStep.tsx`, `src/components/DocumentSupportTab.tsx` — synkronisera Word-export med nya mallen

### Filer som skapas
- `src/pages/LiveDemo.tsx` — demosidan
- `src/components/demo/DemoCursor.tsx`
- `src/components/demo/DemoStage.tsx` (sequencer + progress)
- `src/components/demo/MockScreens.tsx` (5 mock-skärmar)

### Behåller
Allt befintligt innehåll, struktur, sidor, tabeller och logik orörd.

