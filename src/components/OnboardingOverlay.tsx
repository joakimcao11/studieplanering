import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { GraduationCap, Sparkles, FileText, FileSearch, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const onboardingContent: Record<number, { title: string; steps: OnboardingStep[] }> = {
  1: {
    title: 'Studieplanering',
    steps: [
      {
        title: 'Välj program',
        description: 'Börja med att välja studentens utbildningsprogram. Programkurserna laddas automatiskt.',
        icon: <GraduationCap className="w-10 h-10 text-primary" />,
      },
      {
        title: 'Lägg till kurser & terminer',
        description: 'Dra och släpp kurser i rätt termin och läsperiod. Lägg till restkurser och nya kurser efter behov.',
        icon: <Sparkles className="w-10 h-10 text-primary" />,
      },
      {
        title: 'Fortsätt till grundinfo & export',
        description: 'Klicka "Fortsätt" för att fylla i studentuppgifter, handlingsplan och slutligen exportera minnesanteckning.',
        icon: <FileText className="w-10 h-10 text-primary" />,
      },
    ],
  },
  3: {
    title: 'Snabbplanering',
    steps: [
      {
        title: 'Steg-för-steg planering',
        description: 'Snabbplaneringen guidar dig genom 4 enkla steg: personlig info, nya kurser, restkurser och sammanfattning.',
        icon: <Sparkles className="w-10 h-10 text-primary" />,
      },
      {
        title: 'Snabb export',
        description: 'I sista steget får du en komplett sammanfattning som du kan ladda ner direkt som Word-dokument.',
        icon: <FileText className="w-10 h-10 text-primary" />,
      },
    ],
  },
  4: {
    title: 'Mötesanteckning',
    steps: [
      {
        title: 'Fyll i grundinformation',
        description: 'Ange datum, studentens namn, program, årskull och vilken studievägledare som ansvarar för samtalet.',
        icon: <FileText className="w-10 h-10 text-primary" />,
      },
      {
        title: 'Ladda upp eller klistra in material',
        description: 'Ladda upp bilder (t.ex. whiteboard), PDF, Word-dokument eller klistra in text från samtalet.',
        icon: <FileSearch className="w-10 h-10 text-primary" />,
      },
      {
        title: 'Generera & exportera',
        description: 'Välj minnesanteckning, sammanställning eller mailutkast. Redigera resultatet och exportera som Word-dokument.',
        icon: <Sparkles className="w-10 h-10 text-primary" />,
      },
    ],
  },
};

interface OnboardingOverlayProps {
  tabId: number;
}

export const OnboardingOverlay = ({ tabId }: OnboardingOverlayProps) => {
  const storageKey = `onboarding_tab_${tabId}_seen`;
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const content = onboardingContent[tabId];

  useEffect(() => {
    if (!content) return;
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      setOpen(true);
      setCurrentStep(0);
    }
  }, [tabId, storageKey, content]);

  if (!content) return null;

  const step = content.steps[currentStep];
  const isLast = currentStep === content.steps.length - 1;

  const handleClose = () => {
    setOpen(false);
    if (dontShowAgain) {
      localStorage.setItem(storageKey, 'true');
    }
  };

  const handleFinish = () => {
    localStorage.setItem(storageKey, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{content.title}</DialogTitle>
          <DialogDescription>
            Steg {currentStep + 1} av {content.steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {step.icon}
          <h3 className="font-semibold text-base">{step.title}</h3>
          <p className="text-sm text-muted-foreground text-center">{step.description}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5">
          {content.steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(v) => setDontShowAgain(v === true)}
            />
            <label htmlFor="dont-show" className="text-xs text-muted-foreground cursor-pointer">
              Visa inte igen
            </label>
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={() => setCurrentStep((s) => s - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Tillbaka
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={handleFinish}>
                Kom igång!
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCurrentStep((s) => s + 1)}>
                Nästa
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Button to re-trigger onboarding
export const OnboardingHelpButton = ({ tabId, onClick }: { tabId: number; onClick?: () => void }) => {
  const handleClick = () => {
    localStorage.removeItem(`onboarding_tab_${tabId}_seen`);
    onClick?.();
    window.dispatchEvent(new Event('onboarding-reset'));
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      onClick={handleClick}
      title="Visa introduktion"
    >
      <span className="text-sm font-bold">?</span>
    </Button>
  );
};
