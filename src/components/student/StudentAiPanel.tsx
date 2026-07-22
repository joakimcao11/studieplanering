import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, ClipboardList, Mail, FileText, Copy, Check, ArrowDownToLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ActionPlanItem } from '@/components/meeting/StudyPlanCanvas';

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`;

type Mode = 'meeting-notes' | 'summary' | 'email-draft';

const MODE_LABEL: Record<Mode, string> = {
  'meeting-notes': 'Minnesanteckning',
  summary: 'Sammanställning',
  'email-draft': 'Mailutkast',
};

async function stream(body: object, onDelta: (t: string) => void) {
  const resp = await fetch(ANALYZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: `Fel: ${resp.status}` }));
    throw new Error(err.error || `Fel: ${resp.status}`);
  }
  if (!resp.body) throw new Error('Ingen stream tillgänglig');
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') return;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* partial */ }
    }
  }
}

interface Props {
  studentName: string;
  program: string;
  actionPlan: ActionPlanItem[];
  notes: string;
  setNotes: (v: string) => void;
  aiDraft: string;
  setAiDraft: (v: string) => void;
  aiMode: Mode;
  setAiMode: (m: Mode) => void;
  onAppendToNotes: () => void;
}

export const StudentAiPanel = ({
  studentName, program, actionPlan, notes, setNotes,
  aiDraft, setAiDraft, aiMode, setAiMode, onAppendToNotes,
}: Props) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async (mode: Mode) => {
    if (!notes.trim() && actionPlan.length === 0) {
      toast({
        title: 'Inget underlag',
        description: 'Skriv några anteckningar eller lägg till kurser först.',
        variant: 'destructive',
      });
      return;
    }
    setBusy(true);
    setAiMode(mode);
    setAiDraft('');
    let result = '';
    try {
      await stream(
        {
          mode,
          content: notes || undefined,
          studentInfo: {
            date: new Date().toISOString().slice(0, 10),
            formattedDate: new Date().toLocaleDateString('sv-SE'),
            studentName: studentName || '',
            program,
            yearGroup: '',
            counselorName: '',
            audience: 'student',
            actionPlan,
          },
        },
        (delta) => { result += delta; setAiDraft(result); },
      );
      toast({ title: 'Klart!', description: `${MODE_LABEL[mode]} genererad.` });
    } catch (err: any) {
      toast({ title: 'Fel vid generering', description: err.message || 'Försök igen.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!aiDraft.trim()) return;
    await navigator.clipboard.writeText(aiDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: 'Kopierat', description: 'Texten är kopierad till urklipp.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-primary" /> Anteckningar & AI
        </CardTitle>
        <CardDescription>
          Skriv fritt om dina studier, mål eller frågor. Låt AI hjälpa dig att skapa en minnesanteckning, sammanställning eller ett mailutkast.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="T.ex. jag vill klara ut vilka kurser jag ska läsa nästa år, mina restkurser är… mina mål är…"
          rows={5}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => generate('meeting-notes')} disabled={busy}>
            {busy && aiMode === 'meeting-notes' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-1" />}
            Generera minnesanteckning
          </Button>
          <Button size="sm" variant="secondary" onClick={() => generate('summary')} disabled={busy}>
            {busy && aiMode === 'summary' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
            Skapa sammanställning
          </Button>
          <Button size="sm" variant="outline" onClick={() => generate('email-draft')} disabled={busy}>
            {busy && aiMode === 'email-draft' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Mail className="w-4 h-4 mr-1" />}
            Generera mailutkast
          </Button>
        </div>

        {(aiDraft || busy) && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">
                Resultat – {MODE_LABEL[aiMode]}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={copy} disabled={!aiDraft.trim()}>
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  Kopiera
                </Button>
                <Button size="sm" variant="ghost" onClick={onAppendToNotes} disabled={!aiDraft.trim()}>
                  <ArrowDownToLine className="w-4 h-4 mr-1" />
                  Lägg till i anteckningar
                </Button>
              </div>
            </div>
            <Textarea
              value={aiDraft}
              onChange={(e) => setAiDraft(e.target.value)}
              rows={10}
              className="font-sans"
              placeholder={busy ? 'Genererar…' : ''}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};