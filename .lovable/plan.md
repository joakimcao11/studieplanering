## Plan: 4 uppdateringar till Mötesanteckningar och Export

### Update 1 — HP per läsperiod + drag-and-drop i visuell planering
Fil: `src/components/meeting/StudyPlanCanvas.tsx`

- **HP per LP i sammanställningen:** I högerpanelen "Sammanställning" lägg till en sektion under varje termin som listar HP per läsperiod (LP1–LP4 + Omt I/II). Samma färgkodning som termin (grön nära mål, gul, röd) men målet per LP är ~15 hp (en termin = 30 hp / 2 LP).
- **Drag & drop mellan LP-celler:** Använd redan-installerade `@dnd-kit/core` (verifieras via package.json). Varje LP-ruta blir en `DroppableContainer` (term + placement). Varje kursblock blir `DraggableItem`. Vid drop uppdateras `term` + `placement` på item via befintlig `setActionPlan`. Fungerar på samma sätt mellan LP1–LP4 och Omt I/II (även mellan terminer). Behåll befintlig knapp "Lägg till" och papperskorgen.

### Update 2 — Välj placering när kurs läggs till
Fil: `src/components/meeting/StudyPlanCanvas.tsx`

- I "Lägg till kurs"-modalen: när man klickar "Lägg till" på en kurs i listan, öppnas en liten popover/dialog som frågar "Var ska kursen placeras?" med val:
  - LP1, LP2, LP3, LP4
  - "Mellan LP1–LP2" (placeras som LP1 men markerad multi-period via `periods` = ['1','2'])
  - "Mellan LP3–LP4"
  - Omtentamen I, Omtentamen II
- Förvalt val är aktuell placement från modalkontexten. Default-knapp "Lägg till"-flödet får fortfarande snabbval för LP men kräver bekräftelse av termin/period.

### Update 3 — Helskärmsläge (ny vy, behåll standard)
Nya filer:
- `src/components/meeting/StudyPlanFullscreen.tsx` — fullskärms-overlay (`fixed inset-0 z-50 bg-background`) med:
  - Vänster vertikal sidomeny (~64px bred, sticky) med ikoner (Hem, Planering, Verktyg, Inställningar, profil längst ner). Använder befintliga lucide-ikoner och `--primary`/`--secondary` färger.
  - Huvudyta `flex-1 w-full max-w-none`. Tidslinje sträcker sig horisontellt över hela bredden.
  - Varje termin = horisontell rad. LP1–LP4 + Omt I/II som breda kolumner (`grid-cols-6` med `min-w-[1200px]` + `overflow-x-auto`).
  - Bredare kursblock som visar kurskod, namn, hp, studietakt tydligt.
  - Höger panel (sammanställning) collapsible via knapp.
  - "Avsluta helskärmsläge"-knapp i topp högt upp.
  - Återanvänder samma drag-and-drop, samma `actionPlan` state, samma "Lägg till kurs"-modal från StudyPlanCanvas (extraheras till delad fil `useStudyPlanLogic.ts` om enkelt; annars duplicera kontrollerat).
- I `StudyPlanCanvas.tsx`: lägg till knapp "Helskärmsläge" intill "Visa schema i TimeEdit". Knappen öppnar `<StudyPlanFullscreen … />`.

Färger, typografi, knappstil = identiska med befintlig design (samma shadcn-komponenter, semantiska tokens). Standardvyn rörs ej.

### Update 4 — Editerbara LTH-mall sektioner + LU-logo
Filer: `src/components/export/ExportPreviewDialog.tsx`, `src/utils/wordTemplate.ts`, `src/assets/lu-logo.svg` (ny), `src/utils/wordTemplateLU.ts`

- **LTH-mall metadatafält** (i `ExportPreviewDialog`, samma princip som LU): nytt state `lth` med fält:
  - Dokumentnamn, Datum (finns), Institution/Avdelning ("Lunds Tekniska Högskola"), Enhet ("Studie- och karriärvägledningen"), Handläggare/Titel ("Studievägledare"), Postadress, Besöksadress, Telefon, E-post, Webbadress, Adressat (valfritt).
- Skicka dessa till `buildGovHeader`/`buildGovFooter` (utöka signaturerna att ta `LthHeaderInfo`/`LthFooterInfo` med fallback till nuvarande default-värden så inga andra anrop bryts).
- Live-preview i högerkolumnen för LTH visar redigerade värden direkt.
- **LU-logo:** Kopiera `user-uploads://lubild.svg` → `src/assets/lu-logo.svg` (för HTML-preview) **och** generera/exportera en PNG-variant `src/assets/lu-logo.png` för docx ImageRun (kräver PNG/JPG). Uppdatera `wordTemplateLU.ts` `buildLuHeader` att ladda och visa logon istället för/bredvid texten "LUNDS UNIVERSITET". Uppdatera HTML-preview i `ExportPreviewDialog` att rendera samma SVG/PNG.

### Påverkan / risker
- `wordTemplate.ts` signaturändring: `buildGovHeader/Footer` får valfria parametrar med default-värden → bakåtkompatibelt med övriga anrop (`OverviewTab`, `export.ts`).
- Drag-and-drop använder redan installerade `@dnd-kit/core` + `@dnd-kit/utilities`.
- Ingen ändring av datamodell, edge functions, AI-prompter eller `usePlanningState`.