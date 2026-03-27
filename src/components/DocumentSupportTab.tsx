import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileImage, FileText, Send, Loader2, Trash2, Download, Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { OnboardingOverlay } from './OnboardingOverlay';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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

export const DocumentSupportTab = () => {
  const [textInput, setTextInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysisResult, setAnalysisResult] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const maxSize = 10 * 1024 * 1024;

    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        toast.error(`${file.name} är för stor (max 10 MB)`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const newFile: UploadedFile = {
          name: file.name,
          type: file.type,
          base64,
          preview: file.type.startsWith('image/') ? base64 : undefined,
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleAnalyze = async () => {
    if (!textInput.trim() && uploadedFiles.length === 0) {
      toast.error('Lägg till text eller ladda upp filer först');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult('');
    setChatMessages([]);

    const images = uploadedFiles
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => f.base64);

    let content = textInput;
    // For non-image files, mention them
    const nonImageFiles = uploadedFiles.filter((f) => !f.type.startsWith('image/'));
    if (nonImageFiles.length > 0) {
      content += '\n\n[Uppladdade dokument: ' + nonImageFiles.map((f) => f.name).join(', ') + ']';
    }

    let result = '';
    try {
      await streamResponse(
        { mode: 'analyze', content: content || undefined, images: images.length > 0 ? images : undefined },
        (delta) => {
          result += delta;
          setAnalysisResult(result);
        },
        () => {},
      );

      // Store analysis in chat context
      setChatMessages([
        { role: 'user', content: `Analysera: ${content || '(bilder)'}` },
        { role: 'assistant', content: result },
      ]);
    } catch (err: any) {
      toast.error(err.message || 'Kunde inte analysera materialet');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatting) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatting(true);

    let assistantContent = '';
    try {
      await streamResponse(
        { mode: 'chat', messages: newMessages },
        (delta) => {
          assistantContent += delta;
          setChatMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
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

  const handleExportWord = async () => {
    if (!analysisResult) return;

    const lines = analysisResult.split('\n');
    const children: Paragraph[] = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(line.slice(3))] }));
      } else if (line.startsWith('### ')) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(line.slice(4))] }));
      } else if (line.startsWith('# ')) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(line.slice(2))] }));
      } else if (line.startsWith('**') && line.endsWith('**')) {
        children.push(new Paragraph({ children: [new TextRun({ text: line.slice(2, -2), bold: true })] }));
      } else if (line.startsWith('- ')) {
        children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(line.slice(2))] }));
      } else if (line.trim()) {
        children.push(new Paragraph({ children: [new TextRun(line)] }));
      }
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `dokumentationsanalys_${new Date().toISOString().slice(0, 10)}.docx`);
    toast.success('Word-dokument exporterat');
  };

  const handleReset = () => {
    setTextInput('');
    setUploadedFiles([]);
    setAnalysisResult('');
    setChatMessages([]);
    setChatInput('');
  };

  return (
    <div className="space-y-6">
      <OnboardingOverlay tabId={5} />

      {/* Upload & Input Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Ladda upp material
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <FileImage className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Dra och släpp filer här, eller klicka för att välja
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Bilder, PDF, Word (max 10 MB)
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>

          {/* Uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 text-sm">
                  {file.preview ? (
                    <img src={file.preview} alt="" className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text input */}
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Klistra in text här (valfritt)..."
            className="min-h-[100px]"
          />

          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyserar...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analysera material
                </>
              )}
            </Button>
            {(textInput || uploadedFiles.length > 0 || analysisResult) && (
              <Button variant="outline" onClick={handleReset}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Analysresultat</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopierat' : 'Kopiera'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportWord}>
                  <Download className="w-4 h-4 mr-1" />
                  Word
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Chat */}
      {analysisResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fördjupa analysen – Chatt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {chatMessages.slice(2).map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isChatting && chatMessages.length <= 2 && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ställ en följdfråga..."
                className="min-h-[44px] max-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSend();
                  }
                }}
              />
              <Button onClick={handleChatSend} disabled={isChatting || !chatInput.trim()} size="icon" className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Import Sparkles for the button
import { Sparkles } from 'lucide-react';
