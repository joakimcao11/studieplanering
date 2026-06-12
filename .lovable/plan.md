## Update 1 — Ta bort LTH-loggan från headern

**Fil:** `src/components/Header.tsx`
- Ta bort `<img src={lthLogo} ... />` (rad 28–32) och importen av `lthLogo`.
- Behåll titel/undertitel i samma flex-container så layouten inte hoppar.

## Update 2 — Fixa popovern "Var ska kursen placeras?"

**Fil:** `src/components/meeting/StudyPlanCanvas.tsx` (raderna 708–732)

Uppdatera `<PopoverContent>` för placeringsväljaren:
- Lägg till `collisionPadding={16}`, `sideOffset={8}`, `side="bottom"`, `avoidCollisions` (Radix-default men explicit).
- Sätt `style={{ maxHeight: 'calc(100vh - 32px)' }}` och gör inre layout till en flex-kolumn: scrollbart innehållsområde + sticky footer.
- Strukturera innehållet:
  - **Scrollbar sektion** (`overflow-y: auto`, `flex-1`) med rubrik, `RadioGroup`, och termin-input.
  - **Sticky footer** (`position: sticky; bottom: 0; bg-popover border-t pt-2 -mx-4 px-4 -mb-4 pb-3`) med "Bekräfta"-knappen så den alltid syns.

Samma collision-fix tillämpas på den lilla flerperiod-popovern i `DraggableCourseBlock` (rad 144) för konsistens.

**Föräldra-container (dialogen):** `DialogContent` har redan max-höjd; säkerställ att add-course dialogen inte klipper popovern. Popovers renderas via `PopoverPrimitive.Portal` (se `src/components/ui/popover.tsx`) så de är redan utanför dialogens overflow — ingen ändring krävs där.

## Update 3 — Ny "Anpassad mall" i Export

**Fil:** `src/components/export/ExportPreviewDialog.tsx`

- Lägg till tredje val i `RadioGroup`: `LTH | LU | Custom` (etikett "Anpassad mall").
- Skapa ny `custom`-state-objekt med samma fält som LTH (institution, enhet, handläggare, counselor, postadress, besöksadress, telefon, e-post, web, recipient) + `logoDataUrl: string | null` och `documentTitle: string`.
- Persistera `custom`-inställningar i `localStorage` (key: `customTemplateSettings`) så användaren slipper fylla i på nytt.
- UI för Custom-fliken:
  - Alla LTH-fält (samma layout).
  - **Logo-uppladdning**: `<Input type="file" accept="image/png,image/jpeg,image/svg+xml">` som läser fil med `FileReader.readAsDataURL` → sparar i `custom.logoDataUrl`. Visa förhandsbild + "Ta bort logo"-knapp.
- HTML-preview använder samma struktur som LTH-previewen men med uppladdad logo (eller placeholder om saknas).
- Word-export: återanvänd `buildGovHeader/buildGovFooter/buildGovTitle` från `wordTemplate.ts`. För loggan: konvertera `dataUrl` → `ArrayBuffer` (base64-decode) och skicka till `buildGovHeader` istället för `loadLogoBuffer()`. Använd suffix `_CUSTOM` på filnamnet.

**Liten utvidgning i `wordTemplate.ts`:** `buildGovHeader` accepterar redan `logoBuffer`-parameter — ingen ändring behövs där. Lägg ev. till hjälpare `dataUrlToArrayBuffer(url)` i ExportPreviewDialog.

## Filer som ändras
- `src/components/Header.tsx`
- `src/components/meeting/StudyPlanCanvas.tsx`
- `src/components/export/ExportPreviewDialog.tsx`

## Risker
- Sticky footer i Radix `PopoverContent` kräver att `padding` på containern inte bryter sticky-positionering — lös via negativa marginaler som matchar `p-4`.
- Custom-logga som SVG: Word-`ImageRun` stödjer inte alla SVG-features; rekommendera PNG/JPG i UI-hjälptext.
