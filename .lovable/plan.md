

## Plan: Dokumentationsstöd + Onboarding

### Update 1: Nytt verktyg "Dokumentationsstöd" (Tab id: 5)

**Ny Edge Function: `supabase/functions/analyze-document/index.ts`**
- Accepts: text content, base64 images, conversation history
- Uses Lovable AI (gemini-2.5-pro for multimodal/image support) to:
  - Transcribe image content (whiteboard, mindmaps)
  - Identify structure, themes, key insights
  - Generate summaries, reflections, structured tables
  - Support follow-up questions with full conversation context
- Returns structured analysis or chat response

**Ny komponent: `src/components/DocumentSupportTab.tsx`**
- Three-section layout:
  1. **Upload & Input area**: Drag-and-drop zone for images, file input for PDF/Word/images, textarea for pasting text. Uses `document--parse_document` concept client-side (images as base64, text extraction)
  2. **Analysis Results area**: Displays AI-generated analysis with markdown rendering (react-markdown). Includes structured tables, summaries, reflections. Export button to download as Word (.docx)
  3. **Interactive Chat**: Context-based chat panel below results. Sends conversation history + uploaded material to edge function. Streaming responses for real-time feedback. User can ask follow-up questions, deepen analysis

**Dependencies**: Add `react-markdown` for rendering AI responses

**TabNavigation.tsx**: Add tab `{ id: 5, label: 'Dokumentationsstöd', icon: FileSearch }` (or `BookOpen`)

**MainApp.tsx**: Add `currentTab === 5` rendering `<DocumentSupportTab />`

### Update 2: Onboarding för alla moduler

**Ny komponent: `src/components/OnboardingOverlay.tsx`**
- Modal/dialog that appears first time a user visits each tab
- Uses localStorage key per tab (e.g., `onboarding_tab_1_seen`)
- Each tab gets its own onboarding content:
  - **Studieplanering (1)**: "Välj program, lägg till kurser per termin och läsperiod..."
  - **Snabbplanering (3)**: "Skapa en snabb studieplan i 4 steg..."
  - **Importera plan (4)**: "Klistra in text från samtal, AI genererar minnesanteckning..."
  - **Dokumentationsstöd (5)**: "Ladda upp bilder, dokument eller text. AI analyserar och strukturerar..."
- Each has 2-3 steps with illustrations/icons
- "Visa inte igen" checkbox + "Kom igång" button
- Optional: "?" button in tab header to re-trigger onboarding

### Technical Details

**Edge function `analyze-document`:**
- Model: `google/gemini-2.5-pro` (best for multimodal image+text reasoning)
- Supports both initial analysis and follow-up chat modes
- Request body: `{ mode: 'analyze' | 'chat', content: string, images?: string[], messages?: Message[] }`
- System prompt tailored for counseling context: structure identification, reflection, theme extraction

**File upload handling:**
- Images: Convert to base64 client-side, send to edge function for vision analysis
- PDF/Word: Use FileReader API client-side for text extraction where possible; for images in PDFs, send as base64
- Max file size validation (10MB)

**Files to create:**
1. `src/components/DocumentSupportTab.tsx` — main tab component
2. `src/components/OnboardingOverlay.tsx` — reusable onboarding modal
3. `supabase/functions/analyze-document/index.ts` — AI edge function

**Files to modify:**
1. `src/components/TabNavigation.tsx` — add new tab
2. `src/components/MainApp.tsx` — render new tab + integrate onboarding

