import type { CareerProfile } from '@/types/careerProfile';
import { Textarea } from '@/components/ui/textarea';

export const REFLECTION_QUESTIONS = [
  { id: 'q1', q: 'Vad lägger du först märke till?' },
  { id: 'q2', q: 'Vilka områden verkar hänga ihop?' },
  { id: 'q3', q: 'Finns det något som överraskar dig?' },
  { id: 'q4', q: 'Vad verkar allra viktigast för dig?' },
  { id: 'q5', q: 'Är det något som saknas?' },
  { id: 'q6', q: 'Vad skulle du vilja veta mer om?' },
];

interface Props {
  profile: CareerProfile;
  onChange: (answers: Record<string, string>) => void;
}

export const ProfileReflection = ({ profile, onChange }: Props) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold">När du tittar på din Karriärprofil…</h2>
      <p className="text-muted-foreground mt-1">
        Det här är inte ett testresultat eller ett facit över vem du är. Det är en bild av sådant som verkar viktigt för
        dig just nu.
      </p>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {REFLECTION_QUESTIONS.map(({ id, q }, i) => (
        <div key={id} className="rounded-xl border bg-card p-4 space-y-2">
          <label htmlFor={`refl-${id}`} className="font-semibold text-sm">
            {i + 1}. {q}
          </label>
          <Textarea
            id={`refl-${id}`}
            value={profile.reflectionAnswers[id] || ''}
            onChange={(e) => onChange({ ...profile.reflectionAnswers, [id]: e.target.value })}
            className="min-h-[90px]"
          />
        </div>
      ))}
    </div>
  </div>
);
