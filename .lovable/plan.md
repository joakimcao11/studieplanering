## Plan: Interaktiv studieplanering, ny handlingsplan-design, LTH/LU-mall + förhandsgranskning

Behåller all befintlig struktur, sidor och innehåll. Endast tillägg/ändringar nedan.

---

### Update 1 — Interaktiv "Stöd i studieplanering" i Mötesanteckning

**Ny komponent: `src/components/meeting/StudyPlanCanvas.tsx`**

En interaktiv vy (inspirerad av bild 1) som visas som ny `Card` "Stöd i studieplanering" i `MeetingNotesTab.tsx` direkt efter "Anteckningar / klistra in text" (ersätter dagens enkla Handlingsplan-lista – den befintliga `actionPlan`-state återanvänds som datakälla).

**Layout:** två kolumner.
- **Vänster (timeline):** En rad per termin (HT/VT + år), uppdelad i fyra slot-block: LP1, LP2, LP3, LP4 (HT visar LP1+LP2, VT visar LP3+LP4 – tomma slots i andra halvan visas grått). Två extra block per år: **Omtentamen I (april)** och **Omtentamen II (augusti)**. Varje slot har en "+"-knapp. Termin kan läggas till/tas bort med knappar.
- **Höger (sammanställning):** Cirkulärt "Antal HP"-diagram per termin (mål 30 hp = 100%), färgad ring (grön ≈30hp, gul 20–29 / 31–35, röd annars). Total HP, total studietakt%, lista per termin: "HT2026 — 22.5 hp (75%)". Använder befintliga `calculatePeriodHP`/`calculateTermHP` från `types/planning.ts` (anpassade för `ActionPlanItem`).

**"Lägg till kurs"-modal** (inspirerad av bild 2):
- Header: "Lägg till kurs" + LP-pill med ‹/› för snabbnavigering mellan LP1–LP4.
- Sökruta + LP-checkboxar (LP1–LP4) som filter.
- Lista med kurser från `useCourses(program)`: kod, namn, hp, period-badge, knapp "Lägg till".
- Knappar: "+ Lägg till extern kurs" och "+ Skapa egen kurs" (öppnar formulär: kurskod, namn, hp, periods[], studietakt 25/50/75/100%).
- Vid val placeras kursen i den slot modalen öppnades från (term + placement).

**Datamodell utökas (`ActionPlanItem` i `MeetingNotesTab.tsx`):**
```ts
type ActionPlanItem = {
  id, code, name, hp, periods,
  term: string,                 // "HT2026"
  placement: 'LP1'|'LP2'|'LP3'|'LP4'|'OmtentamenI'|'OmtentamenII',
  studyPace?: 25|50|75|100,     // ny
  isCustom?: boolean,           // ny
};
```

---

### Update 2 — Uppdaterad Handlingsplan + knappar

I samma `StudyPlanCanvas` (och i den kompakta tabell-vyn under timeline):

- Varje rad i handlingsplanen är **redigerbar inline**:
  - HP (number input)
  - Studietakt (Select 25/50/75/100%)
  - Termin (Select / fritext)
  - Placement (Select LP1..LP4 / OmtentamenI / OmtentamenII)
  - Trash-knapp
- "**+ Skapa egen kurs**"-knapp ovanför listan → fält för kurskod, namn, HP, period (LP1–LP4 multiselect), studietakt → läggs in som `isCustom: true`.

**Knapprad högst upp i `StudyPlanCanvas`:**
- "**Visa schema i TimeEdit**" → `<a href="https://cloud.timeedit.net/lu/web/lth1/" target="_blank" rel="noopener">` (extern länk-ikon).
- "**Exportera din studieplanering**" (ersätter "Dela din Studyplan") → öppnar export-dialog (se Update 4) som genererar Word-dokument med **endast** Handlingsplan + Studieplanering (timeline-tabell), utan AI-text, men med samma sidhuvud/sidfot/mall (LTH eller LU).

---

### Update 3 — Alternativ vy "Textplanering" + Agenda i Grundinformation

**`StudyPlanCanvas.tsx`** får en lokal vy-toggle (Tabs i toppen): **"Visuell planering"** (default) ↔ **"Textplanering"**.

- **Textplanering**: en strukturerad textarea per termin med rubriker LP1, LP2, LP3, LP4, Omtentamen I, Omtentamen II — fritext, sparas i `actionPlan` som `isCustom`-rader (en per ifylld rad) **eller** som separat `studyPlanText`-state om användaren bara vill ha löpande text. Vi går på det enklare alternativet: ren markdown-text (`studyPlanText: string`) som inkluderas i Word-export och AI-prompt.

**`MeetingNotesTab.tsx` – Grundinformation-kortet:**
- Lägg till nytt fält **"Agenda"** (Textarea, multiline) under befintliga grundfält. Stödjer punktlista (`- `) – renderas som bullet-list i Word-exporten och skickas till AI som `studentInfo.agenda`.

(Notera: existerande `BasicInfoTab` i Studieplanering-fliken har redan agenda-relaterad logik via `agenda`-state i `usePlanningState` – återanvänd den state-typen så att MeetingNotesTab och BasicInfoTab kan dela ev. agenda-mönster, men hålls som lokal state i MeetingNotesTab för enkelhets skull.)

---

### Update 4 — LTH-mall + LU-mall + förhandsgranskning

**Ny fil: `src/utils/wordTemplateLU.ts`**
Speglar `wordTemplate.ts` men i Lunds universitets stil enligt bifogad `MAll_2.docx`:
- Header: LU-logotyp (ny asset `src/assets/lu-logo.png` – placeholder tills användaren laddar upp riktig logga; faller tillbaka till text "LUNDS UNIVERSITET" om bild saknas), tre rader text: "Institution, Avdelning / Enhet etc / Handläggare, Titel".
- Under header: liten metadata-rad "Postadress … Besöksadress … Telefon … E-post … Webbadress …" i 8pt italic (motsvarar LU-mallens fotinformation som ligger högst upp).
- Body-titel: "DOKUMENTNAMN" (versaler, fet) + "Datum 20XX-XX-XX" + ev. adressat-block.
- Typsnitt: Times New Roman 11pt body, Arial 11pt rubriker (matchar LU grafisk profil). H1 "Rubrik 1", H2 "Rubrik 2".
- Ingen blå accent — neutral svart/grå.

**`src/utils/wordTemplate.ts`** behålls oförändrad (LTH-mall).

**Ny komponent: `src/components/export/ExportPreviewDialog.tsx`**
- Props: `{ open, onClose, content: { title, sections: ExportSection[] }, defaultTemplate: 'LTH'|'LU', studentInfo, onConfirm(template, editedSections) }`.
- UI: Dialog (max-w-4xl), två kolumner:
  - **Vänster**: form med
    - Mall-toggle (RadioGroup): **LTH-mall** / **LU-mall**.
    - LU-fält (visas bara om LU vald): Institution, Enhet, Handläggare/Titel, Postadress, Besöksadress, Telefon, E-post, Webbadress, Adressat (multiline), Dokumentnamn.
    - LTH-fält: Studievägledare, Datum (för header).
    - Editable textareas för varje "section" (titel + brödtext) – användaren kan justera texten innan export.
  - **Höger**: Förhandsgranskning – HTML-rendering som efterliknar layouten (logotyp-platshållare, header-rad, titel, sektioner). Rerendrar live när formuläret ändras. Inkluderar en liten note "Förhandsgranskning – exakt utseende kan skilja något från Word".
- Footer: "Avbryt" + "Ladda ner Word".

**Refaktorering av export-flöden:**
- `MeetingNotesTab.handleExportWord` → öppnar `ExportPreviewDialog` istället för att direkt generera. Vid bekräftelse anropas en ny gemensam `buildAndDownloadDocx({ template, sections, meta })` som läser från antingen `wordTemplate.ts` eller `wordTemplateLU.ts`.
- "Exportera din studieplanering"-knappen i `StudyPlanCanvas` använder samma dialog men med endast handlingsplan + timeline som sektioner (ingen AI-text).
- Befintlig `src/utils/export.ts` (Studieplanering-fliken) får också mall-val genom att exponera `template`-param till `exportToWord` och visa dialogen från `OverviewTab`/befintlig export-knapp.

---

### Filer som skapas
- `src/components/meeting/StudyPlanCanvas.tsx` — interaktiv timeline + sammanställning + textplanering
- `src/components/meeting/AddCourseToSlotDialog.tsx` — modal enligt bild 2
- `src/components/export/ExportPreviewDialog.tsx` — mall-val + förhandsgranskning
- `src/utils/wordTemplateLU.ts` — LU-stil header/footer/title-helpers
- `src/utils/buildDocx.ts` — gemensam orchestrator som väljer mall och bygger docx
- `src/assets/lu-logo.png` — platshållare (kan ersättas senare)

### Filer som ändras
- `src/components/MeetingNotesTab.tsx` — lägg till Agenda-fält, integrera StudyPlanCanvas (ersätter dagens handlingsplan-sektion), använd ExportPreviewDialog
- `src/utils/export.ts` — stöd för `template: 'LTH'|'LU'` (delegerar till `buildDocx.ts`)
- `src/components/OverviewTab.tsx` — exportknapp öppnar ExportPreviewDialog

### Filer som inte rörs
PlanningTab, SimplePlanningTab, BasicInfoTab, Admin, Statistik, LiveDemo, Login, edge functions, alla `ui/`-komponenter, `wordTemplate.ts` (LTH-mall behålls intakt).
