## 1. Ångra senaste ändring på /student

Lägg till en enkel undo-stack för `actionPlan` i `StudentPlanning.tsx`.

- Ny `useUndoableActionPlan`-hook (eller inline `useRef<StudentActionPlanItem[][]>`) som pushar föregående state varje gång `actionPlan` ändras via användaråtgärd (lägg till, ta bort, flytta, ändra hp/takt, rensa exempel, ladda exempel, återställ).
- Maxdjup: 20 steg (räcker för typisk sessionsanvändning, undviker minnesläckor).
- Ny **"Ångra"**-knapp i headern (bredvid "Återställ plan") med `Undo2`-ikon från lucide.
  - Inaktiverad när stacken är tom.
  - Tooltip: "Ångra senaste ändring".
  - Kortkommando: `Cmd/Ctrl+Z` (globalt på sidan, ignoreras om fokus ligger i textarea/input).
- Toast på undo: "Ångrade senaste ändring".
- Autospar körs vidare som vanligt efter undo (skriver det återställda state:t till localStorage).

Notera: undo påverkar endast `actionPlan` (kursrader). Anteckningstext och AI-utkast omfattas inte — de har inbyggd textredigering i webbläsaren.

## 2. AI-mallar och förhandsvisning i AI-panelen

Utöka `StudentAiPanel.tsx` med mallval och tydlig förhandsvisning.

**Mallväljare (per läge):**
Segmented control ovanför de tre AI-knapparna som styr *ton och stil*:
- **Kort** – punktlista, max ~150 ord, rakt på sak.
- **Standard** – balanserad prosa + punktlistor (nuvarande beteende).
- **Utförlig** – fylligare, förklarande text med resonemang.

Valet skickas till `analyze-document` som ett nytt fält `styleTemplate: 'short' | 'standard' | 'detailed'` i `studentInfo`. Servern lägger till en kort stil-instruktion i systemprompten baserat på värdet. Övriga befintliga prompts påverkas inte.

**Förhandsvisning:**
Ersätt nuvarande `Textarea`-resultat med en flikad vy:
- **Förhandsvisning** (default): renderad HTML med tydlig typografi
  - Rubriker (rader som matchar `Datum:`, `Student:`, `Bakgrund`, `Diskussion`, `Handlingsplan`, `Nästa steg`, `Sammanfattning`, etc.) → `<h3>` med LTH-navy färg och bottenborder.
  - Fält på formen `Nyckel: värde` → definition-list style (fet nyckel).
  - `- `-rader → `<ul><li>`.
  - Övrigt → `<p>` med `whitespace-pre-line`.
  - Använder befintlig rensningslogik (samma som `cleanLine` i `MeetingNotesTab`) för att ta bort ev. markdown-tecken.
- **Redigera**: nuvarande textarea (så användaren fortfarande kan finjustera innan kopiering / append).

**Övrigt:**
- Behåll knapparna "Kopiera" och "Lägg till i anteckningar" — de opererar på råtexten.
- Mall-val och senaste flik persisteras via befintlig `useStudentPlanStorage` (utöka `PersistedStudentPlan` med `aiStyleTemplate` och `aiPreviewTab`).

## Tekniskt

**Filer**
- `src/pages/StudentPlanning.tsx` – undo-stack, "Ångra"-knapp, Cmd/Ctrl+Z-lyssnare, wrapper runt `setActionPlan` som pushar historik.
- `src/components/student/StudentAiPanel.tsx` – mallväljare (`ToggleGroup`), Tabs (Förhandsvisning / Redigera), formatterad HTML-render, skicka `styleTemplate` i request.
- `src/hooks/useStudentPlanStorage.ts` – lägg till `aiStyleTemplate?: 'short' | 'standard' | 'detailed'` i `PersistedStudentPlan`.
- `supabase/functions/analyze-document/index.ts` – läs `studentInfo.styleTemplate` och append:a en stil-instruktion till systemprompten (t.ex. "Håll svaret kort: max 150 ord, punktlista."). Inga breaking changes; default = "standard".

**Undo-strategi (kort)**
```ts
const historyRef = useRef<StudentActionPlanItem[][]>([]);
const applyPlan = (next: StudentActionPlanItem[] | ((p: ...) => ...)) => {
  setActionPlan(prev => {
    historyRef.current = [...historyRef.current.slice(-19), prev];
    return typeof next === 'function' ? next(prev) : next;
  });
};
const undo = () => {
  const last = historyRef.current.pop();
  if (last) setActionPlan(last);
};
```
Alla nuvarande `setActionPlan`-anrop i `StudentPlanning.tsx` byts till `applyPlan`.
