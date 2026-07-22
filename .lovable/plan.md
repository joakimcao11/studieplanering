# /student: AI-anteckningar, autospar och återställ

## 1. AI-anteckningar för studenten
Lägg till en "Anteckningar & AI"-panel på `/student` (ovanför eller bredvid `StudyPlanCanvas`).

- Textarea för fria anteckningar (kopplas till befintlig `studyPlanText`, eller egen `studentNotes` – se Tekniskt).
- Tre knappar med samma AI-flöden som i `MeetingNotesTab`:
  - **Generera minnesanteckning**
  - **Skapa sammanställning**
  - **Generera mailutkast**
- Anropar befintliga edge functions (`generate-study-notes`, `generate-email-draft`) med student-anpassade prompts (ingen STVL/counselor-kontext, tonen riktad till studenten själv, inkluderar aktuell `actionPlan` som kurslista).
- Resultat visas i ett redigerbart fält under knapparna och skrivs (efter bekräftelse) tillbaka till anteckningsfältet så det följer med i export.
- Laddningsindikator + toast för fel (rate limit / credits).

## 2. Autospar i webbläsaren
Persistera hela student-planen i `localStorage` under nyckeln `lth_student_plan_v1`.

Sparat innehåll:
- `studentName`, `program`
- `actionPlan` (kurser + placeringar)
- `studyPlanText` (anteckningar)
- ev. AI-genererat utkast
- `updatedAt` (ISO-tid)

Beteende:
- Läses in en gång vid mount (om finns → hoppa över onboarding-autoöppning).
- Skrivs debounced (~400 ms) vid varje ändring via en liten `useLocalStoragePlan`-hook.
- Diskret "Sparat kl HH:MM"-text i headern.

## 3. Enklare hantering av exempelrader
Gör exempelkurserna tydligt urskiljbara och massanterbara:

- Märk exempelrader med `isExample: true` (utökar `ActionPlanItem` lokalt i `StudentPlanning`).
- I `StudyPlanCanvas`-listan visas en liten "Exempel"-badge på dessa rader (kräver liten prop-genomsläpp, eller så filtrerar vi i student-vyn utan att röra canvas – se Tekniskt).
- Ny knapp **"Rensa exempelkurser"** ovanför canvas, synlig endast när minst en `isExample`-rad finns. Tar bort alla exempelrader men behåller egna.
- När användaren redigerar en exempelrad tas `isExample`-flaggan bort automatiskt (raden räknas då som "egen").

## 4. Återställ plan
Knapp **"Återställ plan"** i headern (bredvid export-menyn) med bekräftelsedialog (`AlertDialog`).

Vid bekräftelse:
- Nollställ `actionPlan`, `studyPlanText`, ev. AI-utkast.
- Behåll `studentName` och `program` som default (går att avmarkera i dialogen: "Rensa även namn och program").
- Radera `localStorage`-nyckeln.
- Toast: "Planen är återställd".

---

## Tekniskt

**Filer som ändras/skapas**
- `src/pages/StudentPlanning.tsx` – ny AI-panel, autospar-hook, "Rensa exempel"- och "Återställ"-knappar, `isExample`-taggning i `loadExamplePlan`.
- `src/hooks/useStudentPlanStorage.ts` (ny) – debounced load/save mot `localStorage`.
- `src/components/student/StudentAiPanel.tsx` (ny) – textarea + tre AI-knappar, anropar edge functions via `supabase.functions.invoke`.
- `src/components/student/StudentOnboarding.tsx` – litet tillägg: nämn autospar + återställning i sista steget.
- `supabase/functions/generate-study-notes/index.ts` och `generate-email-draft/index.ts` – *ingen ändring krävs*; vi skickar student-anpassad prompt/kontext från klienten. (Om prompten är hårdkodad server-side lägger vi till en valfri `audience: 'student'`-parameter – kontrolleras vid implementation.)

**Datamodell**
```ts
type StudentActionPlanItem = ActionPlanItem & { isExample?: boolean };
type PersistedStudentPlan = {
  studentName: string;
  program: string;
  actionPlan: StudentActionPlanItem[];
  studyPlanText: string;
  aiDraft?: string;
  updatedAt: string;
};
```

**Exempel-badge utan att röra `StudyPlanCanvas`**
Enklaste vägen: håll `isExample` bara i `StudentPlanning` och rendera badge/rensning i ett litet infoband ovanför canvas ("3 exempelkurser kvar — [Rensa exempelkurser]"). Då slipper vi ändra den delade komponenten. Om vi senare vill ha badge direkt på raden kan vi lägga till en valfri `renderRowBadge`-prop.

**AI-anrop**
Återanvänd samma `supabase.functions.invoke("generate-study-notes", { body: { notes, courses, audience: "student", mode: "minnesanteckning" | "sammanstallning" } })`-mönster som `MeetingNotesTab`. Mailutkast går mot `generate-email-draft`. Ingen counselor-data skickas.
