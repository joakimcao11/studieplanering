

## Plan: Slå ihop "Importera plan" + "Dokumentationsstöd" → "Mötesanteckning"

Behåller all befintlig struktur, design och innehåll. Endast följande ändras enligt instruktionerna.

### 1. Ny sammanslagen modul "Mötesanteckning"

**Ny fil: `src/components/MeetingNotesTab.tsx`**

En enda flik som kombinerar all funktionalitet från `TextToTextTab` (Importera plan) och `DocumentSupportTab` (Dokumentationsstöd) i en sammanhållen vy:

**Sektion A — Grundinformation (från Importera plan)**
- Datum, Studentens namn, Program, Årskull, Studievägledare (samma fält som idag)
- Datum-värdet används i Word-export som det dokumentdatum AI:n också ska använda

**Sektion B — Ladda upp material (från Dokumentationsstöd)**
- Drag & drop-zon för bilder, PDF, Word (max 10 MB)
- Filchipsen med thumbnails och radera-knapp
- Textarea för att klistra in text (samma som "Dina anteckningar" från Importera plan, döpt till "Anteckningar / klistra in text")

**Sektion C — Tre AI-knappar**
- **"Generera minnesanteckning"** (ersätter "Analysera material" + "Importera plan"-flödet)
  - Använder förbättrad prompt som producerar **ren text utan markdown-skräp** (inga `**`, inga `"`, inga `#`)
  - Använder studentinfo + uppladdat material + textinput tillsammans
  - Skickar `datum`, `studentName`, `program`, `yearGroup`, `counselorName` som strukturerad kontext till AI
- **"Skapa sammanställning"** (förbättrad — ren text, tydlig struktur, korrekt datum)
- **"Generera mailutkast"** (förbättrad — vänligt mail som börjar "Hej [namn]," och avslutas med vägledarens namn)

**Sektion D — Resultat**
- Redigerbar Textarea (precis som i Importera plan idag) så användaren kan finjustera innan export
- Tre knappar: **Kopiera**, **Spara ändringar**, **Exportera som Word-dokument**
- **Ingen chatt** — borttagen helt enligt instruktion

### 2. Förbättrad Word-export (städar bort markdown-skräp)

**I `MeetingNotesTab.tsx`:** Ny export-funktion som:
- **Strippar markdown-tecken** innan rendering: tar bort `**`, `__`, `*`, `_`, `#`, `>` och konverterar till riktiga Word-formatering (fet, kursiv, rubriker)
- **Tar bort onödiga citattecken** runt rubriker och fält
- Använder myndighetsmallen (`buildGovHeader`, `buildGovTitle`, `buildGovFooter`, `GOV_PAGE_PROPS`) som redan finns
- **Datum i sidhuvud = datum från Grundinformation** (inte `new Date()`)
- **Vägledarnamn i sidhuvud = vald studievägledare** från COUNSELORS-listan
- Filnamn: `Minnesanteckning_[StudentNamn]_[YYYY-MM-DD].docx`

**Hjälpfunktion `cleanMarkdownToRuns(text)`** som parsar en rad och returnerar `TextRun[]` med rätt formatering — så `**fet**` blir verklig fet text i Word, inte synliga asterisker.

### 3. Förbättrade AI-prompts (edge functions)

**`supabase/functions/analyze-document/index.ts` — uppdatera 3 prompts:**

- **`analyze` / nytt mode `meeting-notes`** — Ny prompt som tar emot `studentInfo` (namn, program, kull, datum, vägledare) och returnerar en **ren, strukturerad minnesanteckning** med rubriker som vanlig text (utan `**` runt) och utan onödiga citattecken. Format:
  ```
  Datum: 2026-04-21
  Student: Anna Andersson (D23)
  Studievägledare: Joakim Cao
  
  Bakgrund
  [text]
  
  Diskussion
  [text]
  
  Handlingsplan
  - Punkt 1
  - Punkt 2
  ```
  Instruktion till AI: **"Använd ALDRIG asterisker (`*`, `**`) eller markdown-syntax. Skriv rubriker på egen rad utan tecken framför. Använd inte citattecken runt rubriker eller fältvärden."**

- **`summary`** — Samma regel: ren text, tydliga rubriker, datum från användarens input, inga `**`.

- **`email-draft`** — Vänligt mail "Hej [förnamn]," → kort sammanfattning → kursplanering som punktlista → "Med vänliga hälsningar, [vägledare]". Inga `**`, inga onödiga citattecken.

Body utökas med valfritt fält `studentInfo: { name, program, yearGroup, date, counselorName }` som flätas in i system-/user-prompten.

### 4. Navigering & integration

**`src/components/TabNavigation.tsx`:**
- Ersätt `{ id: 4, label: 'Importera plan', icon: FileText }` och `{ id: 5, label: 'Dokumentationsstöd', icon: FileSearch }` med **en** flik:
  - `{ id: 4, label: 'Mötesanteckning', icon: FileText }`
- Behåll `Studieplanering (1)` och `Snabbplanering (3)` orörda

**`src/components/MainApp.tsx`:**
- Rendera `<MeetingNotesTab />` när `currentTab === 4`
- Ta bort case för `currentTab === 5`
- Behåll allt annat (header, footer, statistik, admin) orört

**`src/components/OnboardingOverlay.tsx`:**
- Slå ihop onboarding-content för tab 4 + 5 till **en** ny tab 4 "Mötesanteckning" med 3 steg:
  1. "Fyll i grundinformation" (datum, student, vägledare)
  2. "Ladda upp eller klistra in material" (bilder, PDF, text)
  3. "Generera & exportera" (minnesanteckning / sammanställning / mailutkast → Word)
- Behåll onboarding för tab 1 och 3 oförändrad
- Ta bort tab 5-content

### 5. Behålls oförändrat
- `TextToTextTab.tsx` och `DocumentSupportTab.tsx` — filerna **lämnas kvar** (för bakåtkompatibilitet) men används inte längre i navigeringen
- `generate-study-notes` edge function — lämnas kvar (kan användas av `MeetingNotesTab` för det rena text-flödet utan bilder)
- Hela "Studieplanering", "Snabbplanering", Admin, Statistik, Live-demo, Login — orörda
- Word-mall-helpers i `src/utils/wordTemplate.ts` — orörda (återanvänds)

### Filer
**Skapas:**
- `src/components/MeetingNotesTab.tsx`

**Ändras:**
- `src/components/TabNavigation.tsx` (en flik istället för två)
- `src/components/MainApp.tsx` (rendera ny tab)
- `src/components/OnboardingOverlay.tsx` (slå ihop tab 4+5)
- `supabase/functions/analyze-document/index.ts` (rena prompts utan markdown-skräp + studentInfo-stöd)

