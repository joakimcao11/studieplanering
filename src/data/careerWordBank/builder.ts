import type { CareerCategoryId, CareerWord } from '@/types/careerProfile';

/** Ett ord kan anges som enbart etikett, eller med egna (handskrivna) texter. */
export type WordSpec =
  | string
  | ({ label: string } & Partial<Pick<CareerWord, 'definition' | 'studentExample' | 'careerContext' | 'reflectionQuestion'>>);

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é/g, 'e')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export type WordTemplate = (
  label: string,
  lower: string,
) => Pick<CareerWord, 'definition' | 'studentExample' | 'careerContext' | 'reflectionQuestion'>;

export const buildWords = (
  category: CareerCategoryId,
  template: WordTemplate,
  specs: WordSpec[],
): CareerWord[] =>
  specs.map((spec) => {
    const s = typeof spec === 'string' ? { label: spec } : spec;
    const lower = s.label.charAt(0).toLowerCase() + s.label.slice(1);
    const base = template(s.label, lower);
    return {
      id: `${category}-${slugify(s.label)}`,
      label: s.label,
      category,
      definition: s.definition ?? base.definition,
      studentExample: s.studentExample ?? base.studentExample,
      careerContext: s.careerContext ?? base.careerContext,
      reflectionQuestion: s.reflectionQuestion ?? base.reflectionQuestion,
    };
  });
