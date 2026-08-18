# Planering: DnD, PDF-export, terminordning, omtentamen och /svl-flöde

## 1. Dra-och-släpp för kurser och komplettering
Kurser går redan att dra mellan läsperioder. Kompletteringar visas i dag som statiska rutor i planeringsrutnätet.

- Gör kompletteringsrutorna dragbara (samma greppikon och känsla som kurser).
- Vid släpp uppdateras kompletteringens termin och läsperiod automatiskt, både i tabellen och i sammanställningen.
- Omtentamensrutorna tar bara emot kurser, inte kompletteringar.
- Gäller både vanligt läge och helskärmsläge, på /svl och /student.

## 2. PDF-export av sammanställning och komplettering
- Lägg till en PDF-knapp bredvid Word-exporten i "Förhandsgranska och exportera", så samma innehåll (handlingsplan, komplettering, sammanställning, textplanering) kan sparas som PDF.
- PDF:en följer samma sektionsordning och redigeringar som gjorts i förhandsgranskningen.
- Tillgängligt för både /svl och /student.

## 3. Rätt terminordning och exakta poäng
- Terminer sorteras kronologiskt: HT2026, VT2027, HT2027, VT2028 ... (i dag hamnar HT före VT inom samma år, vilket ger fel ordning).
- "Lägg till termin" föreslår nästa termin i den kronologiska följden.
- Poäng avrundas inte längre till en decimal: 7,5 hp i 50 % visas som 3,75 hp. Gäller kursrutor, sammanställning, validering och export.

## 4. Omtentamensperioder separeras från studietakten
- När en kurs läggs till i blocket "Omtentamensperioder" väljs Omtentamen I (april) eller Omtentamen II (augusti) direkt – inga läsperiodsval visas där.
- Kurser i omtentamensperioder placeras aldrig i LP1–LP4 och skapar inga "spök"-rutor i läsperioderna.
- Sammanställningen räknar inte med omtentamenskurser i hp per termin, hp per läsperiod eller studietakt. De visas i stället som en egen rad "Omtentamen" med antal och hp.
- Valideringen före export varnar inte för omtentamenskurser.
- Gäller /svl och /student.

## 5. /svl – ordning och uppladdat material i exporten
- "Anteckningar / klistra in text" flyttas upp så att den ligger direkt under "Agenda" i Grundinformation.
- "Ladda upp material" blir kvar som eget block, och det uppladdade materialet tas med i exporten:
  - En sektion "Bifogat material" listar filnamn, filtyp och datum.
  - Uppladdade bilder infogas som bilder i Word-dokumentet och i PDF:en.
  - PDF/Word-filer listas som referenser (de kan inte bäddas in i dokumentet).
- Sektionen kan redigeras eller tas bort i förhandsgranskningen som övriga sektioner.

## Tekniska detaljer
- `StudyPlanCanvas.tsx`: draggable-wrapper för kompletteringar med id-prefix `sup:`, hantering i `onDragEnd`; ny sorteringsnyckel för terminer (år, därefter VT före HT) och uppdaterad `suggestNextTerm`; ny `fmtHp` som visar upp till 2 decimaler utan avrundning till 1; `summary` och `renderCell` exkluderar `OmtentamenI/II` från hp-, LP- och procentberäkning; omtentamensceller öppnar add-dialogen i ett omtentamensläge utan LP-val.
- `planValidation.ts`: samma exkludering av omtentamen och samma decimalformat.
- `ExportPreviewDialog.tsx`: PDF-knapp som återanvänder `exportSectionsAsPdf` med aktuella (redigerade) sektioner; stöd för bildsektioner.
- `studentExport.ts` / `wordTemplate*.ts`: ny sektionstyp `image` för bifogade bilder.
- `MeetingNotesTab.tsx`: flytta textfältet, bygg sektionen "Bifogat material" av `uploadedFiles` i båda exportvägarna.
