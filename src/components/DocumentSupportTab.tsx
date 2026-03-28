import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileImage, FileText, Send, Loader2, Trash2, Download, Copy, Check, X, Sparkles, Mail, ClipboardList, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Footer, Table, TableRow, TableCell, WidthType, ShadingType, PageNumber, TabStopType, TabStopPosition } from 'docx';
import { saveAs } from 'file-saver';
import { OnboardingOverlay } from './OnboardingOverlay';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UploadedFile {
  name: string;
  type: string;
  base64: string;
  preview?: string;
}

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`;

async function streamResponse(
  body: object,
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  const resp = await fetch(ANALYZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Okänt fel' }));
    throw new Error(err.error || `Fel: ${resp.status}`);
  }

  if (!resp.body) throw new Error('Ingen stream tillgänglig');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nlIdx: number;
    while ((nlIdx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, nlIdx);
      buffer = buffer.slice(nlIdx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* partial json */ }
    }
  }
  onDone();
}

// Professional Word export for documentation analysis
async function exportDocumentationWord(content: string, title: string) {
  const FONT = 'Arial';
  const ACCENT = '2E75B6';

  const children: Paragraph[] = [];

  // Title with accent border
  children.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 32, font: FONT, color: ACCENT })],
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
  }));

  children.push(new Paragraph({
    children: [new TextRun({ text: `Genererat: ${new Date().toLocaleDateString('sv-SE')}`, size: 20, font: FONT, color: '888888', italics: true })],
    spacing: { after: 300 },
  }));

  // Parse markdown content into Word paragraphs
  const lines = content.split('\n');
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  const flushTable = () => {
    if (tableHeaders.length === 0 && tableRows.length === 0) return;
    const allRows = tableHeaders.length > 0 ? [tableHeaders, ...tableRows] : tableRows;
    const colCount = allRows[0]?.length || 1;
    const colWidth = Math.floor(9360 / colCount);
    const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
    const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

    const rows = allRows.map((row, ri) =>
      new TableRow({
        children: row.map(cell =>
          new TableCell({
            borders: cellBorders,
            width: { size: colWidth, type: WidthType.DXA },
            shading: ri === 0 && tableHeaders.length > 0 ? { fill: ACCENT, type: ShadingType.CLEAR } : undefined,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [new Paragraph({
              children: [new TextRun({
                text: cell.trim(),
                bold: ri === 0 && tableHeaders.length > 0,
                color: ri === 0 && tableHeaders.length > 0 ? 'FFFFFF' : '333333',
                size: 20,
                font: FONT,
              })],
            })],
          })
        ),
      })
    );

    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: Array(colCount).fill(colWidth),
      rows,
    }));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    tableRows = [];
    tableHeaders = [];
    inTable = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Table detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').filter(c => c.trim() !== '');
      if (cells.every(c => /^[\s-:]+$/.test(c))) {
        // separator line
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells.map(c => c.trim());
      } else {
        tableRows.push(cells.map(c => c.trim()));
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (trimmed.startsWith('# ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.slice(2), bold: true, size: 28, font: FONT, color: ACCENT })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT, space: 2 } },
      }));
    } else if (trimmed.startsWith('## ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.slice(3), bold: true, size: 26, font: FONT, color: '333333' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      }));
    } else if (trimmed.startsWith('### ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.slice(4), bold: true, size: 24, font: FONT })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.slice(2);
      // Handle bold within bullet
      const parts = text.split(/(\*\*.*?\*\*)/);
      const runs = parts.map(p => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return new TextRun({ text: p.slice(2, -2), bold: true, size: 22, font: FONT });
        }
        return new TextRun({ text: p, size: 22, font: FONT });
      });
      children.push(new Paragraph({
        children: runs,
        bullet: { level: 0 },
        spacing: { after: 60 },
      }));
    } else if (trimmed.match(/^\d+\.\s/)) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed, size: 22, font: FONT })],
        spacing: { after: 60 },
      }));
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.slice(2, -2), bold: true, size: 22, font: FONT })],
        spacing: { before: 120, after: 60 },
      }));
    } else if (trimmed) {
      // Handle inline bold
      const parts = trimmed.split(/(\*\*.*?\*\*)/);
      const runs = parts.map(p => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return new TextRun({ text: p.slice(2, -2), bold: true, size: 22, font: FONT });
        }
        return new TextRun({ text: p, size: 22, font: FONT });
      });
      children.push(new Paragraph({ children: runs, spacing: { after: 80 } }));
    }
  }
  if (inTable) flushTable();

  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: FONT }, paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: FONT }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      ],
    },
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{ level: 0, format: 'bullet' as any, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      }],
    },
    sections: [{
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children,
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: 'Studie- och karriärvägledningen LTH', size: 18, font: FONT, color: '888888' }),
              new TextRun({ text: '\t' }),
              new TextRun({ text: 'Sida ', size: 18, font: FONT, color: '888888' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: FONT, color: '888888' }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        }),
      },
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`);
  toast.success('Word-dokument exporterat');
}

export const DocumentSupportTab = () => {
  const [textInput, setTextInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysisResult, setAnalysisResult] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeMode, setActiveMode] = useState<'analyze' | 'email-draft' | 'summary'>('analyze');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const maxSize = 10 * 1024 * 1024;
    for (const file of Array.from(files)) {
      if (file.size > maxSize) { toast.error(`${file.name} är för stor (max 10 MB)`); continue; }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setUploadedFiles((prev) => [...prev, {
          name: file.name, type: file.type, base64,
          preview: file.type.startsWith('image/') ? base64 : undefined,
        }]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeFile = (index: number) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const getRequestBody = (mode: string) => {
    const images = uploadedFiles.filter((f) => f.type.startsWith('image/')).map((f) => f.base64);
    let content = textInput;
    const nonImageFiles = uploadedFiles.filter((f) => !f.type.startsWith('image/'));
    if (nonImageFiles.length > 0) {
      content += '\n\n[Uppladdade dokument: ' + nonImageFiles.map((f) => f.name).join(', ') + ']';
    }
    // For email-draft and summary, include previous analysis as context
    if ((mode === 'email-draft' || mode === 'summary') && analysisResult) {
      content = `Tidigare analys:\n${analysisResult}\n\nOriginaltext:\n${content}`;
    }
    return { mode, content: content || undefined, images: images.length > 0 ? images : undefined };
  };

  const handleAnalyze = async (mode: 'analyze' | 'email-draft' | 'summary' = 'analyze') => {
    if (!textInput.trim() && uploadedFiles.length === 0 && !analysisResult) {
      toast.error('Lägg till text eller ladda upp filer först');
      return;
    }
    setIsAnalyzing(true);
    setActiveMode(mode);
    if (mode === 'analyze') { setAnalysisResult(''); setChatMessages([]); }

    let result = '';
    try {
      await streamResponse(
        getRequestBody(mode),
        (delta) => { result += delta; setAnalysisResult(result); },
        () => {},
      );
      if (mode === 'analyze') {
        setChatMessages([
          { role: 'user', content: `Analysera: ${textInput || '(bilder)'}`, timestamp: new Date() },
          { role: 'assistant', content: result, timestamp: new Date() },
        ]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte analysera materialet');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatting) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput, timestamp: new Date() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatting(true);

    let assistantContent = '';
    try {
      await streamResponse(
        { mode: 'chat', messages: newMessages.map(m => ({ role: m.role, content: m.content })) },
        (delta) => {
          assistantContent += delta;
          setChatMessages([...newMessages, { role: 'assistant', content: assistantContent, timestamp: new Date() }]);
        },
        () => {},
      );
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte svara');
    } finally {
      setIsChatting(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    toast.success('Kopierat till urklipp');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportWord = () => {
    const title = activeMode === 'email-draft' ? 'Mailutkast' : activeMode === 'summary' ? 'Sammanställning' : 'Dokumentationsanalys';
    exportDocumentationWord(analysisResult, title);
  };

  const handleReset = () => {
    setTextInput('');
    setUploadedFiles([]);
    setAnalysisResult('');
    setChatMessages([]);
    setChatInput('');
    setActiveMode('analyze');
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <OnboardingOverlay tabId={5} />

      {/* Upload & Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Ladda upp material
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <FileImage className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Dra och släpp filer här, eller klicka för att välja</p>
            <p className="text-xs text-muted-foreground mt-1">Bilder, PDF, Word (max 10 MB)</p>
            <Input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 text-sm">
                  {file.preview ? <img src={file.preview} alt="" className="w-8 h-8 object-cover rounded" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}

          <Textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Klistra in text här (valfritt)..." className="min-h-[100px]" />

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleAnalyze('analyze')} disabled={isAnalyzing} className="flex-1 min-w-[180px]">
              {isAnalyzing && activeMode === 'analyze' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyserar...</> : <><Sparkles className="w-4 h-4 mr-2" />Analysera material</>}
            </Button>
            <Button onClick={() => handleAnalyze('summary')} disabled={isAnalyzing} variant="secondary" className="flex-1 min-w-[180px]">
              {isAnalyzing && activeMode === 'summary' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sammanställer...</> : <><ClipboardList className="w-4 h-4 mr-2" />Skapa sammanställning</>}
            </Button>
            <Button onClick={() => handleAnalyze('email-draft')} disabled={isAnalyzing || (!analysisResult && !textInput.trim() && uploadedFiles.length === 0)} variant="outline" className="flex-1 min-w-[180px]">
              {isAnalyzing && activeMode === 'email-draft' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Genererar...</> : <><Mail className="w-4 h-4 mr-2" />Generera mailutkast</>}
            </Button>
            {(textInput || uploadedFiles.length > 0 || analysisResult) && (
              <Button variant="outline" onClick={handleReset} size="icon"><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {analysisResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {activeMode === 'email-draft' ? '📧 Mailutkast' : activeMode === 'summary' ? '📋 Sammanställning' : '📊 Analysresultat'}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopierat' : 'Kopiera'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportWord}>
                  <Download className="w-4 h-4 mr-1" />Word
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-td:border prose-td:border-border prose-td:p-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisResult}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat */}
      {analysisResult && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              Fördjupa analysen – AI-chatt
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {chatMessages.slice(2).map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                      <div className={`rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md shadow-sm'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-background prose-th:p-2 prose-td:border prose-td:border-border prose-td:p-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isChatting && chatMessages.length <= 2 && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t p-3 flex gap-2 bg-background">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ställ en följdfråga..."
                className="min-h-[44px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
                }}
              />
              <Button onClick={handleChatSend} disabled={isChatting || !chatInput.trim()} size="icon" className="shrink-0 rounded-full h-10 w-10">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
