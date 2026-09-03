import type { CareerProfile } from '@/types/careerProfile';
import { emptyProfile } from '@/hooks/useCareerProfile';

const SELECTIONS: Record<string, { selected: string[]; custom?: string[] }> = {
  values: { selected: ['Balans', 'Utveckling', 'Frihet'], custom: ['Bra arbetsmiljö'] },
  traits: { selected: ['Analytisk', 'Nyfiken', 'Kreativ', 'Lugn'] },
  drivers: { selected: ['Lösa problem', 'Lära mig nya saker', 'Skapa något nytt', 'Förstå hur saker fungerar'] },
  skills: { selected: ['Analysera', 'Problemlösa', 'Samarbeta'], custom: ['Kommunikation'] },
  knowledge: { selected: ['Programmeringsspråk'], custom: ['Kandidatexamen', 'Ledarskap'] },
  curious: { selected: ['Människors beteende', 'Marknadsföring'], custom: ['Försäljning', 'IT'] },
  challenges: { selected: ['Stress', 'Saknar arbetslivserfarenhet'], custom: ['Att hitta balans'] },
  directions: {
    selected: ['Utveckling och programmering', 'Design och UX'],
    custom: ['Psykologi', 'Folkhälsa', 'Datavetenskap'],
  },
};

export const buildDemoProfile = (): CareerProfile => {
  const base = emptyProfile();
  return {
    ...base,
    profileName: 'Student A',
    isDemo: true,
    categories: base.categories.map((c) => {
      const s = SELECTIONS[c.id];
      if (!s) return c;
      return { ...c, selectedItems: s.selected, customItems: s.custom || [] };
    }),
    comparisonReflection:
      'Mycket handlar om att förstå och lösa saker – men också om att göra det tillsammans med andra och i en miljö som håller över tid.',
    nextStep: 'Prata med en alumn som arbetar med systemutveckling.',
  };
};
