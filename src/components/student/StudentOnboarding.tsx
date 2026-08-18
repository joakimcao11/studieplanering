import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { GraduationCap, Sparkles, ListChecks, Download, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';

const STORAGE_KEY = 'student_onboarding_seen_v1';

const steps = [
  {
    icon: <GraduationCap className="w-10 h-10 text-primary" />,
    title: 'Välkommen till din studieplanering',
    desc: 'Ett enkelt verktyg där du själv kan planera dina kurser termin för termin – ingen inloggning behövs.',
  },
  {
    icon: <Sparkles className="w-10 h-10 text-primary" />,
    title: '1. Välj ditt program',
    desc: 'Börja med att välja ditt utbildningsprogram. Då laddas kurserna du kan välja mellan.',
  },
  {
    icon: <ListChecks className="w-10 h-10 text-primary" />,
    title: '2. Lägg till kurser',
    desc: 'Klicka "Lägg till kurs" i en läsperiod. Sök efter kursen och välj var den ska placeras (LP1–LP4 eller omtentamen).',
  },
  {
    icon: <Download className="w-10 h-10 text-primary" />,
    title: '3. Exportera din plan',
    desc: 'När du är klar kan du ladda ner din studieplanering som Word-dokument.',
  },
  {
    icon: <Sparkles className="w-10 h-10 text-primary" />,
    title: '4. Autospar & återställning',
    desc: 'Dina ändringar sparas automatiskt lokalt i webbläsaren. Du kan när som helst rensa exempelkurser eller använda "Återställ plan" för att börja om.',
  },
];

export const StudentOnboarding = ({
  forceOpen, onClose, onLoadExample,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
  onLoadExample?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (forceOpen) { setOpen(true); setStep(0); return; }
  }, [forceOpen]);

  const close = () => {
    if (dontShow) localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
    onClose?.();
  };
  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
    onClose?.();
  };

  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Studieplanering för studenter</DialogTitle>
          <DialogDescription>Steg {step + 1} av {steps.length}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          {s.icon}
          <h3 className="font-semibold text-base">{s.title}</h3>
          <p className="text-sm text-muted-foreground">{s.desc}</p>
          {isLast && onLoadExample && (
            <div className="w-full mt-2 rounded-md border bg-muted/30 p-3 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wand2 className="w-4 h-4 text-primary" /> Vill du testa med en exempelplan?
              </div>
              <p className="text-xs text-muted-foreground">
                Fyller i ett exempel med kurser i HT2026 (LP1–LP2) och VT2027 (LP3–LP4) så du snabbt ser hur det fungerar.
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => { onLoadExample(); finish(); }}
              >
                <Wand2 className="w-4 h-4 mr-1" /> Ladda exempelplan
              </Button>
            </div>
          )}
        </div>
        <div className="flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
        <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2 pt-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Checkbox checked={dontShow} onCheckedChange={(v) => setDontShow(v === true)} />
            Visa inte igen
          </label>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((x) => x - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Tillbaka
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={finish}>Kom igång</Button>
            ) : (
              <Button size="sm" onClick={() => setStep((x) => x + 1)}>
                Nästa <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};