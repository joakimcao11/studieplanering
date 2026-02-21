import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimplePersonalInfoStep } from './simple-planning/SimplePersonalInfoStep';
import { SimpleRestkurserStep } from './simple-planning/SimpleRestkurserStep';
import { SimpleNyaKurserStep } from './simple-planning/SimpleNyaKurserStep';
import { SimpleSummaryStep } from './simple-planning/SimpleSummaryStep';

export interface SimpleStudentInfo {
  efternamn: string;
  fornamn: string;
  program: string;
  antagningsar: string;
  termin: 'vt' | 'ht';
  studievagledare: string;
}

export interface SimpleRestkurs {
  id: string;
  kurskod: string;
  kursnamn: string;
  restpoang: number;
  lp1: boolean;
  lp2: boolean;
  lp3: boolean;
  lp4: boolean;
  tentadatum: string;
  omtentadatum: string;
}

export interface SimpleNyKurs {
  id: string;
  kurskod: string;
  kursnamn: string;
  hp: number;
  lp1: boolean;
  lp2: boolean;
  lp3: boolean;
  lp4: boolean;
}

const steps = [
  { id: 1, title: 'Personuppgifter', description: 'Dina grunduppgifter' },
  { id: 2, title: 'Restkurser', description: 'Kurser du behöver bli omregistrerad på' },
  { id: 3, title: 'Nya kurser', description: 'Kurser du ska läsa denna termin' },
  { id: 4, title: 'Sammanställning', description: 'Din färdiga studieplan' },
];

export const SimplePlanningTab = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [studentInfo, setStudentInfo] = useState<SimpleStudentInfo>({
    efternamn: '',
    fornamn: '',
    program: '',
    antagningsar: '',
    termin: 'vt',
    studievagledare: '',
  });
  const [restkurser, setRestkurser] = useState<SimpleRestkurs[]>([]);
  const [nyaKurser, setNyaKurser] = useState<SimpleNyKurs[]>([]);

  const progress = (currentStep / steps.length) * 100;

  const isStepComplete = (stepId: number): boolean => {
    switch (stepId) {
      case 1:
        return !!(studentInfo.efternamn && studentInfo.fornamn && studentInfo.program);
      case 2:
        return true; // Restkurser är valfritt
      case 3:
        return true; // Nya kurser är valfritt
      case 4:
        return false;
      default:
        return false;
    }
  };

  const canProceed = isStepComplete(currentStep);

  const goToNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const addRestkurs = () => {
    const newKurs: SimpleRestkurs = {
      id: Math.random().toString(36).substring(2, 9),
      kurskod: '',
      kursnamn: '',
      restpoang: 0,
      lp1: false,
      lp2: false,
      lp3: false,
      lp4: false,
      tentadatum: '',
      omtentadatum: '',
    };
    setRestkurser([...restkurser, newKurs]);
  };

  const updateRestkurs = (id: string, updates: Partial<SimpleRestkurs>) => {
    setRestkurser(restkurser.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  const removeRestkurs = (id: string) => {
    setRestkurser(restkurser.filter(k => k.id !== id));
  };

  const addNyKurs = () => {
    const newKurs: SimpleNyKurs = {
      id: Math.random().toString(36).substring(2, 9),
      kurskod: '',
      kursnamn: '',
      hp: 0,
      lp1: false,
      lp2: false,
      lp3: false,
      lp4: false,
    };
    setNyaKurser([...nyaKurser, newKurs]);
  };

  const updateNyKurs = (id: string, updates: Partial<SimpleNyKurs>) => {
    setNyaKurser(nyaKurser.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  const removeNyKurs = (id: string) => {
    setNyaKurser(nyaKurser.filter(k => k.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                Steg {currentStep} av {steps.length} – {steps[currentStep - 1].title}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                className={cn(
                  'flex flex-col items-center gap-1 transition-all',
                  currentStep === step.id ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : isStepComplete(step.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isStepComplete(step.id) && currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-xs text-center hidden sm:block max-w-[80px]">
                  {step.title}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <SimplePersonalInfoStep
            studentInfo={studentInfo}
            onUpdate={setStudentInfo}
          />
        )}
        {currentStep === 2 && (
          <SimpleRestkurserStep
            restkurser={restkurser}
            onAdd={addRestkurs}
            onUpdate={updateRestkurs}
            onRemove={removeRestkurs}
          />
        )}
        {currentStep === 3 && (
          <SimpleNyaKurserStep
            nyaKurser={nyaKurser}
            onAdd={addNyKurs}
            onUpdate={updateNyKurs}
            onRemove={removeNyKurs}
          />
        )}
        {currentStep === 4 && (
          <SimpleSummaryStep
            studentInfo={studentInfo}
            restkurser={restkurser}
            nyaKurser={nyaKurser}
            onUpdateRestkurs={updateRestkurs}
            onRemoveRestkurs={removeRestkurs}
            onAddRestkurs={addRestkurs}
            onUpdateNyKurs={updateNyKurs}
            onRemoveNyKurs={removeNyKurs}
            onAddNyKurs={addNyKurs}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Föregående
        </Button>
        
        {currentStep < steps.length ? (
          <Button onClick={goToNext} className="gap-2">
            Fortsätt
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
            <Check className="w-4 h-4" />
            Studieplanen är klar
          </Button>
        )}
      </div>
    </div>
  );
};
