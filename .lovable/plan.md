## Plan: Tab-omordning, Handlingsplan i Mötesanteckning, UX-förbättringar i Studieplanering

Behåller all befintlig struktur, design, sidor och innehåll. Endast tilläggen nedan görs.

---

### Update 1 — Tab-ordning + namnbyte

**Fil: `src/components/TabNavigation.tsx`**
Ändra `tabs`-arrayen till denna ordning (id behålls för bakåtkompatibilitet med `MainApp`):
```
1. Mötesanteckning   (id: 4, icon: FileText)
2. Studieplanering   (id: 1, icon: GraduationCap)
3. Studieplan II     (id: 3, icon: Sparkles)
```

**Fil: `src/hooks/usePlanningState.ts`**
Ändra default-värdet för `currentTab` (eller motsvarande initialiserare) från nuvarande till `4` så Mötesanteckning blir startflik.

**Fil: `src/components/OnboardingOverlay.tsx`**
Byt ev. textreferenser från "Snabbplanering" till "Studieplan II" i onboarding för tab 3.

Inga ändringar i `MainApp.tsx`-routing (id 4 = Mötesanteckning, id 1 = Studieplanering, id 3 = Studieplan II behålls).

---

### Update 2 — "Handlingsplan" i Mötesanteckning

**Fil: `src/components/MeetingNotesTab.tsx`** — lägg till en ny sektion **direkt efter** "Anteckningar / klistra in text"-textarean (i Section B, Card "Ladda upp material"), eller som ny `Card` "Handlingsplan" mellan Section B och Section C.

#### Innehåll i sektionen
- Hämta program-/kurslistan via `useCourses(program)` (drar alla kurser från admin via Supabase-tabellen `courses`).
- En sökbar/scrollbar lista med alla kurser för valt program: kurskod · namn · HP · LP-period(er).
  - Använd samma filter/sökmönster som i `CourseSelector` (sök på kod/namn, filter för LP1–LP4).
- Per kurs: knapp "Lägg till i handlingsplan" → öppnar liten dropdown/popover där användaren väljer:
  - **Termin** (HT/VT + år, fritext-år tillåtet)
  - **Period**: LP1, LP2, LP3, LP4, eller **Omtentamen (april/augusti)**
- Vald kurs visas i en kompakt tabell "Handlingsplan" ovanför listan med kolumner:
  - Kurskod | Namn | HP | Termin | Period | (X-knapp för att ta bort)

#### State (lokalt i MeetingNotesTab)
```ts
type ActionPlanItem = {
  id: string;
  code: string;
  name: string;
  hp: number;
  periods: string[];      // från DB, för visning
  term: string;           // ex "HT2026"
  placement: 'LP1'|'LP2'|'LP3'|'LP4'|'Omtentamen';
};
const [actionPlan, setActionPlan] = useState<ActionPlanItem[]>([]);
```

#### Integration med AI och Word-export
- Skicka `actionPlan` som del av `studentInfo` (ny nyckel `actionPlan`) till edge function `analyze-document`. Prompt för `meeting-notes`/`summary`/`email-draft` instrueras att inkludera "Handlingsplan – kurser"-block.
- I Word-exporten: rendera handlingsplanen som en riktig docx-tabell (kolumner: Kurskod, Namn, HP, Termin, Period) **innan** den AI-genererade texten — eller efter rubrik "Handlingsplan" om sådan saknas i AI-texten.

---

### Update 3 — UX-förbättringar i Studieplanering (PlanningTab)

**Fil: `src/components/CourseSelector.tsx`**
- Vid klick på en kurs (eller "+"-knappen): istället för dagens placerings-dialog, lägg in kursen **direkt** i den LP som matchar kursens första `period`-värde i den för tillfället valda terminen.
  - Mappning:
    - Kurs med period `'1'` → om vald termin är HT → `lp1`; om VT → fortfarande `lp1`-slot men labeln visas som LP3 (befintlig logik).
    - Kurs med period `'3'` → välj automatiskt en HT-termin om den valda är VT (eller behåll vald termin men sätt `lp1`-slot, eftersom HT-LP1 = LP1, VT-LP1 = LP3 i UI).
  - Implementation: lägg till hjälpfunktion `getRecommendedSlot(course, term)`:
    - Om `term.semester==='HT'` → period `'1'`/`'2'` → `lp1`/`lp2`. Period `'3'`/`'4'` → varna och föreslå att byta till VT-termin (toast: "Denna kurs ges i LP3/LP4 – välj en VT-termin").
    - Om `term.semester==='VT'` → period `'3'`/`'4'` → `lp1`/`lp2` (visas som LP3/LP4). Period `'1'`/`'2'` → toast "Denna kurs ges i HT".
- Lägg en "Snabb-placering"-toggle (default på): när på → kursen läggs in direkt i rekommenderad LP utan dialog. När av → behåll nuvarande dialog för att ange completedHP/restkurs.

**Fil: `src/components/PlanningTab.tsx`**
- Förenkla "Lägg till termin"-flödet: ersätt det nuvarande tomma year-fältet med snabbknappar "+ HT2026", "+ VT2027" baserat på senaste tillagda termin (auto-suggested next term), plus en "Egen termin..."-knapp som öppnar nuvarande formulär.
- Visuella förbättringar:
  - Highlight "rekommenderad LP" med subtil ring runt droppable när en kurs är vald i CourseSelector (skicka `recommendedSlot` ner till `DroppablePeriod`).
  - Visa kursens LP-period(er) som badge i CourseSelector-listan (redan delvis gjort) — säkerställ att den syns alltid.
- Auto-fokusera nyligen tillagd termin (scroll-to-view).

**Fil: `src/components/DroppablePeriod.tsx`**
- Acceptera ny prop `isRecommended?: boolean` → lägg `ring-2 ring-primary/40` när true.

#### Rekommendationslogik (sammanfattning)
```text
period '1'  → HT-termin, LP1-slot
period '2'  → HT-termin, LP2-slot
period '3'  → VT-termin, LP1-slot (visas som LP3)
period '4'  → VT-termin, LP2-slot (visas som LP4)
multi (1+2) → HT, lp1 (delas över båda – nuvarande studyPace-logik)
multi (3+4) → VT, lp1
```

---

### Filer som ändras
- `src/components/TabNavigation.tsx` (ordning + namnbyte)
- `src/hooks/usePlanningState.ts` (default tab = 4)
- `src/components/OnboardingOverlay.tsx` (textbyte "Snabbplanering" → "Studieplan II")
- `src/components/MeetingNotesTab.tsx` (handlingsplan-sektion + Word-tabell + studentInfo-utökning)
- `src/components/CourseSelector.tsx` (snabb-placering enligt kurs-period)
- `src/components/PlanningTab.tsx` (rekommenderad slot, snabbknappar för terminer)
- `src/components/DroppablePeriod.tsx` (ring-highlight för rekommenderad slot)
- `supabase/functions/analyze-document/index.ts` (prompts: använd `studentInfo.actionPlan` om tillgänglig)

### Filer som inte rörs
Allt annat: Studieplan II (SimplePlanningTab), Admin, Statistik, Live-demo, Login, OverviewTab, BasicInfoTab, export-helpers i `wordTemplate.ts`, alla UI-komponenter i `ui/`.