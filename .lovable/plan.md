## Översikt

Tre uppdateringar baserat på referensbilden och beskrivning:
1. Ny alternativ helsides-vy (App Shell) med vänstermeny i ikoner + bred ytan, byter ut nuvarande topp-tabbar.
2. Förbättrad drag-and-drop i Visuell planering med stöd för att kursen visuellt sträcker sig över flera läsperioder (flerperiod), med korrekt HP-fördelning per LP + total HP.
3. Mötesanteckningar och "Stöd i studieplanering" hämtar program + kurser dynamiskt från admin (Supabase) istället för hårdkodade `D/C`.

---

## Update 1 — Alternativ vy (App Shell med vänstermeny)

### Ny komponent: `src/components/AppShell.tsx`
En ny full-bredds layout som kan toggla "av/på" från Header (ikon + label "Alt-vy"). När aktiv ersätter den `TabNavigation` + `container mx-auto` med:

```text
┌──────┬──────────────────────────────────────────────┐
│ logo │  Header-rad (titel + actions till höger)     │
│ ──── ├──────────────────────────────────────────────┤
│ 🏠   │                                              │
│ 🎓   │   Bred yta — innehåll för vald sektion       │
│ 📋   │   (ingen container-bredd, full-width)        │
│ 🛠   │                                              │
│ 💼   │                                              │
│ ──── │                                              │
│ ⚙   │                                              │
│ 👤   │                                              │
└──────┴──────────────────────────────────────────────┘
```

- Vänstermeny `w-16` med ikoner (lucide): `Home`, `GraduationCap` (Studieplanering), `FileText` (Mötesanteckning), `Sparkles` (Studieplan II), `Wrench` (Admin om admin), `BarChart3` (Statistik), botten: `Settings`, profilbild.
- Aktiv ikon: `bg-primary text-primary-foreground`, övriga `text-muted-foreground hover:bg-muted`.
- Tooltip på hover med svensk label.
- Innehållsväxling använder samma state som idag (`currentTab`, `showStats`, `showAdmin`) — inga dubbletter av logik.
- Header (top-rad inom shell): titel för aktuell sektion + befintliga actions (counselor-väljare, logga ut). Återanvänder `Header`-innehåll men i kompakt form.

### Toggle mellan vyer
- `MainApp.tsx` får ny state `useAltView` (default `false`, persist i `localStorage`).
- I `Header` läggs en knapp/ikon `LayoutGrid` ↔ `LayoutList` som togglar.
- När `useAltView=true`: rendera `<AppShell>` som wrappar samma sub-komponenter (`PlanningTab`, `MeetingNotesTab`, etc) — ingen logikduplicering.

### Filer
- Skapa `src/components/AppShell.tsx`
- Redigera `src/components/MainApp.tsx` (lägga in toggle-state + conditional rendering)
- Redigera `src/components/Header.tsx` (lägga in toggle-knapp)

---

## Update 2 — Drag-and-drop med flerperiodspann

### Visuellt spann över flera LP
Idag visas en flerperiodskurs bara i den första LP-cellen. Ändras till att kursen visuellt renderas i **alla** LP den tillhör med:
- Kortets bakgrund i `bg-warning/15` + vänster border `border-l-4 border-warning`.
- Etikett: `LP{periods.join('+')}` + `{totalHp} hp totalt · {hpPerLp.toFixed(1)} hp/LP`.
- Samma `id` används men varje LP-cell renderar en "ghost"-kopia av kortet. Den första cellen är "ankaret" (draggbar + raderbar), övriga är read-only spegel med visuell linje som binder ihop dem (`border-dashed` topp/höger).

### Implementering i `StudyPlanCanvas.tsx`
- Helper `getCellItems(term, placement)`:
  - Returnerar `{ anchor: ActionPlanItem[], ghost: ActionPlanItem[] }`.
  - För varje kurs vars `periods` innehåller `LP{n}` som matchar cellen men där `placement` är en annan LP, läggs i `ghost`.
- `DroppableCell` får ny prop `ghosts` och renderar dem icke-draggbara med distinkt stil.
- `DraggableCourseBlock` visar nu också `{totalHp} hp · {perLpHp} hp/LP` när `periods.length > 1`.

### Drag-and-drop fix
- `onDragEnd`: när en flerperiodskurs släpps i en ny LP, beräkna nya `periods` automatiskt:
  - Om den droppas i en enskild LP → spann reduceras till `[N]`, `placement = LP{N}`.
  - Om användaren håller `Shift` vid drop ELLER drar ankaret till en angränsande LP → utöka spannet (`periods` = sorted union).
- Som komplement: kortets högerklicks-meny ("⋮"-knapp) öppnar en popover där man kan kryssa LP1-LP4 för att själv definiera spannet (samma checkbox-grid som "Skapa egen kurs").

### Användardefinierat spann
- Ny "Redigera flerperiod" popover per kort:
  - Trigger: liten `MoreVertical`-ikon på kortet (visas på hover, utöver `Trash2`).
  - Innehåll: 4 checkboxes (LP1–LP4) + "Spara".
  - Vid spara: `updateItem(id, { periods: selected, placement: LP{minSelected} })`.

### Sammanställning
Befintlig logik (rad 320–326) fördelar redan HP per LP. Endast UI-uppdatering så att flerperiodskursens kort visar `hpPerLp = totalHp / periods.length`.

### Filer
- Redigera `src/components/meeting/StudyPlanCanvas.tsx`

---

## Update 3 — Dynamiska program i Mötesanteckningar

Idag är `programs = [{value:'D'}, {value:'C'}]` hårdkodat i `MeetingNotesTab.tsx` (rad 17–20) och årskullarna genereras endast för D/C (rad 22–28).

### Ändringar
- I `MeetingNotesTab.tsx`:
  - Importera `usePrograms` från `@/hooks/usePrograms`.
  - Bygg `programs`-listan från `usePrograms().programs` → `[{value: code, label: '${name} (${code})'}]`.
  - Generera `yearGroups` dynamiskt: för varje program-code, generera `${code}15` … `${code}30`.
  - Default `program` sätts till första programmet i listan när data laddats (om nuvarande inte finns).
- `StudyPlanCanvas` använder redan `useCourses(program)` som filtrerar på `program`-fältet i Supabase, så hela kursutbudet för det valda programmet visas automatiskt i "Lägg till kurs"-dialogen.
  - Verifiera att `useCourses` returnerar **alla** kurser för programmet (inga limits) — Supabase default är 1000 rader, vilket räcker.
- Kontroll: `programs`-tabellen och `courses.program`-fältet måste matcha. Befintlig admin (`AdminPage` → `ProgramManagementTab` + `ProgramCoursesManager`) skapar redan dessa korrekt.

### Filer
- Redigera `src/components/MeetingNotesTab.tsx`

---

## Risker / Edge cases

- **AppShell + befintliga overlays**: `OnboardingOverlay` och `AlertDialog` ligger inom `<main>` — säkerställ att de fortfarande fungerar i shell-layouten.
- **localStorage**: `useAltView` bör ha try/catch för SSR/privatläge.
- **Drag-ghost**: ghost-cellen får INTE vara droppable target själv (annars kan kursen "droppas på sig själv").
- **Programlistan tom**: om admin inte har lagt in några program, fall tillbaka till `D/C` så att appen inte kraschar.

## Filer som påverkas

Skapa:
- `src/components/AppShell.tsx`

Redigera:
- `src/components/MainApp.tsx`
- `src/components/Header.tsx`
- `src/components/meeting/StudyPlanCanvas.tsx`
- `src/components/MeetingNotesTab.tsx`
