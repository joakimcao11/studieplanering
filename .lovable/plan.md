# Ingångssida, studentanpassning och komplettering

## 1. Ny startsida med två vägar
- `/` blir en ren landningssida med två stora val: **"Jag är LTH-student"** och **"Jag är studievägledare"**.
- Student → `/student` (ingen inloggning).
- Studievägledare → `/svl`, som kräver inloggning (befintlig inloggning + profilval flyttas dit).
- Nuvarande verktygsinnehåll på `/` flyttas alltså till `/svl`. Gamla bokmärken till `/` landar på startsidan.

## 2. Tydligare start på /student
- Namn och program lyfts upp i ett tydligt "Kom igång"-kort med hjälptexter.
- Programval hämtas som idag (C, D) plus ett nytt alternativ **"Eget program"** där studenten skriver in ett eget programnamn och lägger in helt egna kurser.
- Kurslistan är tom för eget program; "Skapa egen kurs" blir huvudvägen in.

## 3. Flerperiodskurser delas per läsperiod
- När en kurs anges över flera läsperioder (t.ex. LP2 + LP3) placeras kursen i **båda** perioderna i tidslinjen.
- Poängen delas jämnt: 10 hp över två perioder = 5 hp per period, och räknas så i sammanställningen per läsperiod.
- Gäller både katalogkurser och "Skapa egen kurs".

## 4. Fler placeringsalternativ
I "Var ska kursen placeras?" läggs till:
- **Mellan LP2–LP3 (flerperiod)** (utöver befintliga LP1–LP2 och LP3–LP4)
- **Ange själv** – studenten kryssar fritt i vilka läsperioder (1–4) kursen ska ligga i.

## 5. Exportformulär i två varianter
"Förhandsgranska och exportera" får två profiler för formulärsektionen:
- **Studentversion** (`/student`): namn, program, årskurs, datum – inga vägledar-/myndighetsfält.
- **Vägledarversion** (`/svl`): nuvarande fält (institution, enhet, handläggare, kontaktuppgifter, mallval LTH/LU/Anpassad).
Mallval och dokumentstruktur i övrigt är oförändrade.

## 6. Komplettering (nytt block)
- Ny sektion **"Komplettering"** i Studieplanering och Stöd i studieplanering: inlämningsuppgifter, labbar, projekt och övriga examinationer.
- Varje post: typ, kurs/kurskod, beskrivning, kopplad läsperiod (LP1–LP4) och status.
- Kompletteringar visas i tidslinjen på sin läsperiod, räknas med i sammanställningen (som egen rad, ej hp) och följer med i export (Word/PDF/TXT).
- Innehåll och rubriker anpassas per roll: studentvänligt språk på `/student`, vägledarformuleringar på `/svl`.

## Teknisk översikt
- `src/App.tsx`: ny `Home`-sida på `/`, verktyget flyttas till `/svl` (nuvarande `Index` blir `/svl`-sidan med `useAuth`-skydd).
- `src/components/meeting/StudyPlanCanvas.tsx`: `variant: 'student' | 'counselor'`-prop; utökade `PLACEMENT_CHOICES` (mellan LP2–LP3, "Ange själv"); rendera kurser i alla `periods` med hp/antal perioder; nytt `SupplementItem`-state kopplat till läsperiod.
- `src/components/export/ExportPreviewDialog.tsx`: ny `variant`-prop som styr vilka formulärfält som visas.
- `src/utils/studentExport.ts`, `wordTemplate.ts`, `wordTemplateLU.ts`: ny kompletteringssektion i exporten.
- `src/hooks/useStudentPlanStorage.ts`: sparar även eget programnamn och kompletteringar.
