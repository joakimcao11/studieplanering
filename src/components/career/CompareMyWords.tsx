import { useState } from 'react';
import type { CareerProfile } from '@/types/careerProfile';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { COMPARE_HEADINGS } from '@/data/careerWordBank';
import { careerColor } from './careerTheme';
import { allItems } from '@/hooks/useCareerProfile';

interface Props {
  profile: CareerProfile;
  onChange: (patch: Partial<CareerProfile>) => void;
}

export const CompareMyWords = ({ profile, onChange }: Props) => {
  const [missing, setMissing] = useState('');
  const active = profile.categories.filter((c) => allItems(c).length > 0);
  const words = active.flatMap((c) => allItems(c).map((label) => ({ label, color: careerColor(c.colorIndex ?? 0) })));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Jämför mina ord</h2>
        <p className="text-muted-foreground mt-1">
          När du ser dina val tillsammans kan nya samband börja bli synliga.
        </p>
      </div>

      {active.length === 0 ? (
        <p className="text-muted-foreground">Du har inte valt några ord ännu. Gå tillbaka och välj några områden.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-4">
              <h3
                className="text-xs font-bold uppercase tracking-wide mb-2"
                style={{ color: careerColor(c.colorIndex ?? 0) }}
              >
                {COMPARE_HEADINGS[c.id as keyof typeof COMPARE_HEADINGS] || c.title}
              </h3>
              <ul className="space-y-1">
                {allItems(c).map((l) => (
                  <li key={l} className="text-sm">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border bg-secondary/40 p-5">
        <h3 className="font-bold mb-1">Titta på dina ord</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Vilka ord verkar höra ihop? Finns det kombinationer som överraskar dig? Finns det något som verkar dra åt olika håll?
        </p>
        <ul className="flex flex-wrap gap-2">
          {words.map((w, i) => (
            <li
              key={`${w.label}-${i}`}
              className="rounded-full border bg-card px-3 py-1 text-sm"
              style={{ borderColor: w.color }}
            >
              {w.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <label htmlFor="compare-reflection" className="font-semibold">
          Vad ser du när du läser allt tillsammans?
        </label>
        <Textarea
          id="compare-reflection"
          value={profile.comparisonReflection}
          onChange={(e) => onChange({ comparisonReflection: e.target.value })}
          className="min-h-[140px]"
          placeholder="Skriv fritt – det här är för dig."
        />
      </div>

      <div className="space-y-2">
        <p className="font-semibold">Är det något viktigt som fortfarande saknas?</p>
        <div className="flex gap-2">
          <Input
            value={missing}
            onChange={(e) => setMissing(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && missing.trim()) {
                onChange({ missingItems: [...profile.missingItems, missing.trim()] });
                setMissing('');
              }
            }}
            placeholder="Lägg till något som saknas"
            aria-label="Något som saknas"
            className="h-11"
          />
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() => {
              if (!missing.trim()) return;
              onChange({ missingItems: [...profile.missingItems, missing.trim()] });
              setMissing('');
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Lägg till
          </Button>
        </div>
        {profile.missingItems.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-1">
            {profile.missingItems.map((m) => (
              <li key={m} className="inline-flex items-center gap-1 rounded-full border bg-card pl-3 pr-1 py-1 text-sm">
                {m}
                <button
                  type="button"
                  aria-label={`Ta bort ${m}`}
                  onClick={() => onChange({ missingItems: profile.missingItems.filter((x) => x !== m) })}
                  className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
