# Min Karriärprofil – interaktivt verktyg på /material

Ett nytt, fristående verktyg på `/material` som följer webbplatsens befintliga identitet (LTH-blå primärfärg, Inter, shadcn-kort, rundade hörn, samma knappar och spacing). Ingen inloggning – allt sparas lokalt i webbläsaren.

## Flödet

Hero med rubrik "Min Karriärprofil", ingress, `[Skapa min Karriärprofil]` och `[Visa exempel]`. Därefter en wizard med progressindikator i 9 steg:

```text
1 Börja · 2 Utforska dig själv · 3 Vad är viktigt? · 4 Vad kan du?
5 Nyfiken på · 6 Se dina ord · 7 Skapa profil · 8 Reflektera · 9 Exportera
```

I varje steg kan användaren gå bakåt/framåt, hoppa över område, redigera tidigare svar, börja om. Utkast sparas automatiskt (localStorage) och återupptas vid nästa besök.

## Ordbanken

En separat datamodul (inte i UI-koden) med kategorierna: Egenskaper, Värderingar, Drivkrafter, Färdigheter, Kompetenser, Personlighet/Hur jag fungerar, Nyfiken på, Arbetslivsbehov, samt de öppna områdena Kunskaper, Erfarenheter, Lärande och utveckling, Mitt bidrag, Omvärlden, Utmaningar, Möjliga riktningar.

Varje färdigt ord har `id, label, category, definition, studentExample, careerContext, reflectionQuestion` – studentanpassade, icke-värderande formuleringar utan HR-språk, enligt de språkliga principerna (inga bra/dåliga egenskaper).

Per område:
- Knapp `[Utforska ord]` öppnar stor modal (desktop) / bottom sheet i full höjd (mobil)
- Sökfält, alfabetisk lista, klick på ordet = välj, klick på ⓘ = förklaring (separata klickytor)
- Max 8 val med räknare "3 av 8" och vänlig text när gränsen nås, plus frivillig följdfråga "Om du bara fick behålla tre …" (tar inte bort något)
- `[+ Lägg till eget ord]` – egna ord räknas i maxantalet, kan redigeras/tas bort, visas likadant
- Valen visas som chips med × 
- `[+ Lägg till eget område]` med eget namn och egen fråga

## Jämför och se samband

Steg 6 visar alla områden bredvid varandra ("Det här är viktigt för mig", "Så här beskriver jag mig" osv), följt av reflektionsfrågan "Vad ser du när du läser allt tillsammans?", en ordmoln-liknande samlingsvy med frågorna om vilka ord som hör ihop, och "Är det något som saknas?". Ingen automatisk tolkning görs.

## Visualiseringen

Namnet/rubriken i mitten, kategorierna runtomkring. Tre växlingsbara vyer:
- **Mindmap** – ren radiell karta, linjer centrum → kategori → ord
- **Kreativ karta** – siluettsymbol i mitten, organiska kurvor, färgkodade områden, varmare känsla
- **Översikt** – jämnt placerade informationskort, optimerad för utskrift och vägledningssamtal

Interaktivt: dra noder och kategorier, zooma, panorera, expandera/minimera kategori ("Färdigheter · 8 ▼"), redigera/ta bort/lägga till ord direkt i kartan och flytta ett ord mellan kategorier. Automatisk radiell layout som skalar från 4 till 15+ kategorier utan överlapp; ökat avstånd och collapse vid mycket innehåll. `[Anpassa utseende]` ger layout (kompakt/balanserad/luftig), format (liggande/stående/kvadratisk), visning och 2–3 färgteman.

## Resultat, reflektion och nästa steg

Resultatsida med texten om att detta inte är ett facit, de sex reflektionsfrågorna, samt "Mitt näst steg" med förslagslista och eget fritextsteg.

## Export

`[Exportera Karriärprofil]` → PNG (högupplöst, bara kartan), PDF (A4 liggande/stående, sida 1 visualisering, sida 2+ listorna), PPTX (5 slides), DOCX (visualisering + alla områden + reflektion + nästa steg). Riktiga filformat, inte omdöpta PDF:er.

## Demoläge

`[Visa exempel]` fyller verktyget med profilen "Student A" enligt den angivna exempeldatan; `[Rensa exempel]` tömmer den.

## Teknisk del

- Ny route `/material` i `src/App.tsx` (före catch-all), plus en ingång från startsidan.
- Nya paket: `@xyflow/react` (interaktiv karta), `html-to-image` (PNG + bild till PDF/PPTX/Word), `pptxgenjs`. `jspdf`, `docx` och `file-saver` finns redan.
- Struktur:
  - `src/data/careerWordBank/` – en fil per kategori + `index.ts` med typer, så fler ord/kategorier/språk kan läggas till utan UI-ändringar
  - `src/types/careerProfile.ts` – `CareerProfile`, `CareerCategory`, `CareerWord`
  - `src/hooks/useCareerProfile.ts` – state + debounced localStorage (`lth_career_profile_v1`)
  - `src/components/career/` – Intro, Wizard, ProgressIndicator, ProfileNameStep, CategoryCard, WordBankModal, WordChip, WordInfo, CustomWordInput, CustomCategoryModal, SelectedWords, CompareMyWords, Canvas, MindMapView, CreativeCareerMap, OverviewCareerMap, ProfileReflection, NextStepSection, ExportProfileModal, DemoProfileLoader
  - `src/utils/careerExport.ts` – PNG/PDF/PPTX/DOCX
- Tillgänglighet: tokens ur designsystemet för kontrast, tangentbordsnavigering i ordbanken, synliga focus states, aria-labels på ⓘ och ikonknappar, ≥44px touchytor, aldrig enbart färg som informationsbärare.
- Mobil: vertikala steg, bottom sheet för ordbanken, zoom/panorering och `[Visa Karriärprofil i helskärm]`.

## Omfattning i första versionen

Hela flödet byggs fungerande. Ordbanken levereras med samtliga uppräknade ord i alla kategorier; fullständiga fyrdelade förklaringar (betyder / märks / i arbetslivet / fundera på) skrivs för Egenskaper, Värderingar, Drivkrafter och Personlighet, medan Färdigheter, Kompetenser, Nyfiken på och Arbetslivsbehov får definition + arbetslivskontext i första omgången och kompletteras därefter.
