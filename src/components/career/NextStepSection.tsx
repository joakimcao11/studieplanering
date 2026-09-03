import { useState } from 'react';
import type { CareerProfile } from '@/types/careerProfile';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

const IDEAS = [
  'Prata med någon',
  'Undersöka ett yrke',
  'Läsa om en bransch',
  'Hitta ett företag',
  'Besöka ett evenemang',
  'Testa något',
  'Prata med en alumn',
  'Läsa en jobbannons',
  'Göra ett projekt',
  'Lära mig något nytt',
  'Boka ett vägledningssamtal',
];

interface Props {
  profile: CareerProfile;
  onChange: (patch: Partial<CareerProfile>) => void;
}

export const NextStepSection = ({ profile, onChange }: Props) => {
  const [own, setOwn] = useState('');
  const picked = profile.nextStepIdeas || [];

  const toggle = (idea: string) =>
    onChange({
      nextStepIdeas: picked.includes(idea) ? picked.filter((i) => i !== idea) : [...picked, idea],
    });

  return (
    <div className="rounded-xl border bg-secondary/40 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold">Mitt nästa steg</h2>
        <p className="text-sm text-muted-foreground mt-1">
          En Karriärprofil behöver inte ge dig ett färdigt svar. Den kan istället hjälpa dig att hitta något som är värt
          att undersöka.
        </p>
      </div>

      <div>
        <p className="font-semibold text-sm mb-2">Vad skulle kunna vara ett litet nästa steg?</p>
        <ul className="flex flex-wrap gap-2">
          {IDEAS.map((idea) => {
            const on = picked.includes(idea);
            return (
              <li key={idea}>
                <button
                  type="button"
                  onClick={() => toggle(idea)}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-2 text-sm min-h-11 transition-colors ${
                    on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'
                  }`}
                >
                  {on ? '✓ ' : ''}
                  {idea}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex gap-2">
        <Input
          value={own}
          onChange={(e) => setOwn(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && own.trim()) {
              onChange({ nextStepIdeas: [...picked, own.trim()] });
              setOwn('');
            }
          }}
          placeholder="Skriv eget nästa steg"
          aria-label="Eget nästa steg"
          className="h-11"
        />
        <Button
          variant="secondary"
          className="min-h-11"
          onClick={() => {
            if (!own.trim()) return;
            onChange({ nextStepIdeas: [...picked, own.trim()] });
            setOwn('');
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Lägg till
        </Button>
      </div>

      {picked.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {picked.map((p) => (
            <li key={p} className="inline-flex items-center gap-1 rounded-full border bg-card pl-3 pr-1 py-1 text-sm">
              {p}
              <button
                type="button"
                aria-label={`Ta bort ${p}`}
                onClick={() => onChange({ nextStepIdeas: picked.filter((x) => x !== p) })}
                className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <label htmlFor="next-step" className="font-semibold text-sm">
          Mitt nästa steg med egna ord
        </label>
        <Textarea
          id="next-step"
          value={profile.nextStep}
          onChange={(e) => onChange({ nextStep: e.target.value })}
          className="min-h-[100px]"
          placeholder="Ett litet steg räcker."
        />
      </div>
    </div>
  );
};
