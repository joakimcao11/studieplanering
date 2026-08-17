# Sammanställning, validering, läsår och omstrukturerad sidordning

## 1. Utökad sammanställningsvy före export
- Ny sektion "Sammanställning inför export" i studieplaneringen (både /svl och /student).
- Summerar per läsår och per läsperiod: kurser (hp, med flerperiodskurser delade jämnt) plus kompletteringar (antal, ej hp).
- Jämför mot krav: 30 hp per termin och 15 hp per läsperiod som standardmål, samt räknar studietakt i procent.
- Visar tydlig status per rad: OK (grön), avvikelse (gul), stor avvikelse (röd).

## 2. Validering med varningar före export
- Varningslista genereras automatiskt: läsperiod över/under målet, termin som inte når 100 % takt, kurs utan vald läsperiod, komplettering utan kopplad läsperiod, samt kontroll att flerperiodskursers delade hp summerar till kursens totala hp.
- Varningarna visas i sammanställningsvyn och som en sammanfattande ruta i "Förhandsgranska och exportera". Export blockeras inte, men användaren måste se varningarna.

## 3. Sök och filter för kursrader på /student
- Sök- och filterfält ovanför kurslistan/planeringen: fritext på kurskod och namn, samt filter på termin, läsperiod och kurstyp (katalogkurs/egen kurs).
- Matchande kursrader lyfts fram; snabbknappar för att byta läsperiod eller ta bort direkt från träfflistan.

## 4. Läsår och omtentablock
- "HT2026"/"VT2027" blir redigerbara: klick på rubriken låter användaren byta namn/år.
- Knapp "Lägg till läsår" som skapar HT/VT-par, samt möjlighet att ta bort läsår.
- OMT I och OMT II flyttas ut ur terminsrutnätet (som nu blir LP1–LP4) och får ett eget block "Omtentamensperioder" placerat under studieplaneringsöversikten.
- Gäller både vanligt läge och helskärmsläge, på /svl och /student.

## 5. Exportknappen flyttas ner
- "Exportera din studieplanering" tas bort från översta knappraden och placeras sist i planeringsflödet, som ett tydligt avslutssteg efter sammanställning och varningar.
- TimeEdit- och helskärmsknappen blir kvar högst upp.

## 6. AI-panelen blir en valbar extrafunktion
- "Anteckningar & AI" / "Generera med AI" blir hopfälld bakom en knapp ("Öppna AI-stöd") och ligger längst ner på sidan på både /student och /svl.
- Komplettering skickas automatiskt med i underlaget till minnesanteckning, sammanställning och mailutkast, med egen rubrik i genererad text.

## 7. Ordning och nya fält
- /svl: "Återställ plan" läggs till i "Stöd i studieplanering". I "Grundinformation" flyttas Agenda upp direkt efter Årskull och Studievägledare. "Anteckningar / klistra in text" och "Ladda upp material" flyttas ner efter "Stöd i studieplanering".
- /student: nytt "Grundinformation"-kort högst upp med namn, program (inkl. eget program) och årskull, som återanvänds i sammanställning och export.

## Teknisk översikt
- `src/components/meeting/StudyPlanCanvas.tsx`: läsårsstate blir redigerbart (namn + lägg till/ta bort), `PLACEMENT_ORDER` delas i LP-rutnät och separat omtentablock, ny validerings- och sammanställningsberäkning (hp per LP inkl. delning), ny sök/filterrad för studentvarianten, exportknappen flyttas till botten, `Återställ plan`-callback-prop.
- Ny `src/components/meeting/PreExportSummary.tsx` för sammanställning + varningar, återanvänd i canvas och i `ExportPreviewDialog`.
- `src/components/export/ExportPreviewDialog.tsx`: visar varningslista före export.
- `src/components/MeetingNotesTab.tsx`: omordning av sektioner, agenda flyttas, AI-block hopfällt längst ner.
- `src/pages/StudentPlanning.tsx`: nytt Grundinformation-kort, AI-panel hopfälld längst ner, läsårsstate persistas.
- `src/components/student/StudentAiPanel.tsx` + `supabase/functions/analyze-document/index.ts`: kompletteringar skickas med i `studentInfo` och vävs in i prompten för alla tre lägen.
- `src/hooks/useStudentPlanStorage.ts`: sparar grundinformation och läsår.
