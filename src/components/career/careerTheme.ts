import type { CareerProfile } from '@/types/careerProfile';

export type ThemeKey = CareerProfile['visualization']['theme'];

const SITE = ['--career-1', '--career-2', '--career-3', '--career-4', '--career-5', '--career-6', '--career-7', '--career-8'];

/** Två alternativa, harmoniska teman (varm/kall) uttryckta i HSL-värden. */
const WARM = [
  '18 65% 42%', '30 65% 40%', '350 45% 44%', '42 60% 38%',
  '8 55% 45%', '25 45% 35%', '345 35% 40%', '35 55% 34%',
];
const COOL = [
  '210 60% 38%', '190 55% 34%', '250 40% 45%', '170 45% 32%',
  '225 45% 42%', '200 50% 30%', '265 35% 40%', '185 40% 30%',
];

export const careerColor = (index: number, theme: ThemeKey = 'site'): string => {
  const i = ((index % 8) + 8) % 8;
  if (theme === 'warm') return `hsl(${WARM[i]})`;
  if (theme === 'cool') return `hsl(${COOL[i]})`;
  return `hsl(var(${SITE[i]}))`;
};

/** Ljus bakgrundsvariant av områdesfärgen. */
export const careerColorSoft = (index: number, theme: ThemeKey = 'site'): string =>
  `color-mix(in srgb, ${careerColor(index, theme)} 14%, transparent)`;
