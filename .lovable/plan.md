# Läsår, bilagor i export och print-vänlig PDF

## 1. Läsår istället för terminer i "Stöd i studieplanering"
Varje rad i planeringsrutnätet innehåller redan LP1–LP4, alltså ett helt läsår. Namnen visas i dag som "HT2026" / "VT2027", vilket är missvisande.

- Raden visas som "Läsår 2026/2027", nästa "Läsår 2027/2028", sedan 2028/2029 osv.
- Knappen "Lägg till termin" tas bort. Endast "Lägg till läsår" finns kvar och lägger till nästa läsår i följden.
- Rubriker i omtentamensblocket, sammanställningspanelen, kompletteringstabellen och filtren använder samma läsårsetikett.
- Byt-namn-funktionen finns kvar (fritext), men förslaget är alltid "Läsår ÅÅÅÅ/ÅÅÅÅ".
- Befintliga planer med "HT2026"/"VT2027" visas automatiskt med rätt läsårsetikett.

## 2. Termin i handlingsplanen
- Handlingsplanens nuvarande kolumn "Termin" byter namn till "Läsår".
- Ny kolumn "Termin" som fylls automatiskt:
  - LP1, LP2 → Hösttermin
  - LP3, LP4 → Vårtermin
  - Flerperiodskurs över LP2–LP3 → "Höst/Vår"
  - Omtentamen I och II → "-"
- Studietakt visas som "-" för omtentamenskurser (de har ingen studietakt och räknas inte i summeringen).
- Samma kolumnuppsättning används i exporttabellen "Handlingsplan – kurser".

## 3. Rubriker i "Sammanställning inför export"
- Första kolumnen heter "Läsår" och visar läsårsetiketten.
- Kolumnrubrikerna förtydligas: "LP1 (höst)", "LP2 (höst)", "LP3 (vår)", "LP4 (vår)", "Totalt läsår", "Studietakt", "Komplettering".
- Hjälptexten uppdateras till läsårsspråket (30 hp per termin, 60 hp per läsår, ca 15 hp per läsperiod) och att omtentamen inte räknas in.

## 4. Uppladdat material som bilagor i exporten
- Exporten får en översiktssektion "Bilagor" som listar bilaga-nummer, filnamn, filtyp och datum.
- Varje fil får därefter en egen sektion med rubrik "Bilaga 1 – filnamn", "Bilaga 2 – …" som börjar på ny sida i både Word och PDF.
- Bilder infogas i sin bilaga; PDF/Word-filer listas som referens med filnamn och typ.
- Sidfoten/sidnumreringen finns kvar genom hela dokumentet så bilagorna får löpande sidnummer.
- Bilagorna kan redigeras eller tas bort i förhandsgranskningen som övriga sektioner.

## 5. Print-vänligare PDF
- Rubriker hålls ihop med sin första textrad (ingen ensam rubrik sist på en sida).
- Tabeller upprepar sin huvudrad på nya sidor och radbryter långa texter istället för att klippas.
- Långa ord/kurskoder bryts korrekt, marginaler och radavstånd justeras för A4.
- Sidnummer "Sida X av Y" i sidfoten och dokumentnamn/datum i sidhuvudet på varje sida.
- Explicit sidbrytning före varje bilaga.

Allt ovan gäller både vägledarvyn (/svl) och studentvyn (/student).

## Tekniska detaljer
- `StudyPlanCanvas.tsx`: ny hjälpfunktion `academicYearLabel(termId)` + `nextAcademicYear(terms)`; `addNewTerm`-knappen tas bort, `addAcademicYear` lägger till en rad; `termLabel` används i rutnät, omtentamensblock, summeringspanel, dialoger och filter. Ny `termHalf(item)` för Hösttermin/Vårtermin/"-".
- `planValidation.ts`: exponerar läsårsetikett för raderna; ingen ändring i beräkningslogik.
- `PreExportSummary.tsx`: uppdaterade kolumnrubriker och hjälptext.
- `MeetingNotesTab.tsx`: bygger bilagesektioner (`Bilagor`-tabell + en sektion per fil, bilder som `image`-sektion) i båda exportvägarna.
- `ExportPreviewDialog.tsx`: ny sektionstyp `image`/`pageBreak` i `DocSection`; `buildDocx` lägger `pageBreakBefore` på bilagor och bäddar in `ImageRun`; `buildPdf` får `@page`-sidhuvud/sidfot via `position: running`-fallback (fast header/footer-div), `break-before: page` för bilagor, `thead { display: table-header-group }`, `break-inside: avoid` för rubrikblock och `overflow-wrap: anywhere`.
