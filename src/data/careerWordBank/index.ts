import type { CareerCategoryDef, CareerCategoryId, CareerWord, WizardStepId } from '@/types/careerProfile';
import { traits } from './traits';
import { personality } from './personality';
import { values } from './values';
import { drivers } from './drivers';
import { needs } from './needs';
import { skills } from './skills';
import { competencies } from './competencies';
import { curious } from './curious';
import { knowledge, experience, learning, contribution, world, challenges, directions } from './open';

export const MAX_SELECTIONS = 8;

export const CAREER_CATEGORIES: CareerCategoryDef[] = [
  {
    id: 'traits',
    title: 'Egenskaper',
    question: 'Vilka ord tycker du beskriver dig när du fungerar som bäst?',
    helpText: 'Det finns inga bra eller dåliga egenskaper – olika egenskaper fungerar olika bra i olika sammanhang.',
    exploreLabel: 'Utforska egenskaper',
    maxSelections: MAX_SELECTIONS,
    step: 'self',
    colorIndex: 0,
    words: traits,
  },
  {
    id: 'personality',
    title: 'Hur jag fungerar',
    question: 'Hur fungerar du när du får arbeta på ett sätt som passar dig?',
    helpText: 'Det här är inte ett personlighetstest. Välj det du känner igen dig i just nu.',
    exploreLabel: 'Utforska arbetssätt',
    maxSelections: MAX_SELECTIONS,
    step: 'self',
    colorIndex: 1,
    words: personality,
  },
  {
    id: 'values',
    title: 'Värderingar',
    question: 'Vad är viktigt för dig i ett framtida arbetsliv?',
    helpText: 'Välj inte det som låter bäst. Välj sådant som faktiskt betyder något för dig.',
    exploreLabel: 'Utforska värderingar',
    maxSelections: MAX_SELECTIONS,
    step: 'important',
    colorIndex: 2,
    words: values,
  },
  {
    id: 'drivers',
    title: 'Drivkrafter',
    question: 'Vad brukar få dig att vilja sätta igång, fortsätta eller engagera dig?',
    exploreLabel: 'Utforska drivkrafter',
    maxSelections: MAX_SELECTIONS,
    step: 'important',
    colorIndex: 3,
    words: drivers,
  },
  {
    id: 'needs',
    title: 'Arbetslivsbehov',
    question: 'Vad behöver du för att må bra och fungera i ett arbetsliv?',
    helpText:
      'Ett yrke handlar inte bara om vad man arbetar med, utan också om under vilka förutsättningar man arbetar.',
    exploreLabel: 'Utforska behov',
    maxSelections: MAX_SELECTIONS,
    step: 'important',
    colorIndex: 4,
    words: needs,
  },
  {
    id: 'skills',
    title: 'Färdigheter',
    question: 'Vad kan du göra?',
    helpText:
      'Färdigheter handlar om sådant du kan göra. De kan ha utvecklats genom utbildning, projekt, praktik, arbete, föreningsliv, fritid och andra erfarenheter.',
    exploreLabel: 'Utforska färdigheter',
    maxSelections: MAX_SELECTIONS,
    step: 'can',
    colorIndex: 5,
    words: skills,
  },
  {
    id: 'competencies',
    title: 'Kompetenser',
    question: 'Vilka kompetensområden känner du igen dig i?',
    helpText:
      'Färdighet = något du kan göra. Kompetens = hur du kombinerar kunskap, färdigheter och erfarenheter för att hantera en uppgift eller situation.',
    exploreLabel: 'Utforska kompetenser',
    maxSelections: MAX_SELECTIONS,
    step: 'can',
    colorIndex: 6,
    words: competencies,
  },
  {
    id: 'knowledge',
    title: 'Kunskaper',
    question: 'Vad har du kunskap om?',
    helpText: 'Ämneskunskaper, teorier, metoder, kurser, programmeringsspråk, verktyg, språk och projekt.',
    exploreLabel: 'Utforska kunskaper',
    maxSelections: MAX_SELECTIONS,
    step: 'can',
    colorIndex: 7,
    words: knowledge,
  },
  {
    id: 'experience',
    title: 'Erfarenheter',
    question: 'Vad har du varit med om som har utvecklat dig?',
    helpText:
      'Studier, grupparbeten, projekt, praktik, ideellt arbete, föreningsliv, extrajobb, fritidsintressen, internationella erfarenheter och livserfarenheter.',
    exploreLabel: 'Utforska erfarenheter',
    maxSelections: MAX_SELECTIONS,
    step: 'can',
    colorIndex: 0,
    words: experience,
  },
  {
    id: 'curious',
    title: 'Nyfiken på',
    question: 'Vad är du nyfiken på?',
    helpText:
      'Du behöver inte veta om du vill arbeta med detta. Markera sådant du skulle vilja förstå, utforska eller veta mer om.',
    exploreLabel: 'Utforska områden',
    maxSelections: MAX_SELECTIONS,
    step: 'curious',
    colorIndex: 1,
    words: curious,
  },
  {
    id: 'learning',
    title: 'Lärande och utveckling',
    question: 'Vad skulle du vilja lära dig mer om?',
    exploreLabel: 'Utforska exempel',
    maxSelections: MAX_SELECTIONS,
    step: 'curious',
    colorIndex: 2,
    words: learning,
  },
  {
    id: 'contribution',
    title: 'Mitt bidrag',
    question: 'Vad skulle du vilja bidra med genom ditt framtida arbete?',
    exploreLabel: 'Utforska exempel',
    maxSelections: MAX_SELECTIONS,
    step: 'curious',
    colorIndex: 3,
    words: contribution,
  },
  {
    id: 'world',
    title: 'Omvärlden',
    question: 'Vad händer omkring dig som påverkar hur du tänker på framtiden?',
    exploreLabel: 'Utforska exempel',
    maxSelections: MAX_SELECTIONS,
    step: 'curious',
    colorIndex: 4,
    words: world,
  },
  {
    id: 'challenges',
    title: 'Utmaningar',
    question: 'Finns det något som känns svårt eller som du behöver hantera?',
    exploreLabel: 'Utforska exempel',
    maxSelections: MAX_SELECTIONS,
    step: 'curious',
    colorIndex: 5,
    words: challenges,
  },
  {
    id: 'directions',
    title: 'Möjliga riktningar',
    question: 'Vad skulle kunna vara intressant att utforska vidare?',
    helpText: 'Det här är möjligheter att utforska – inte beslut du måste fatta.',
    exploreLabel: 'Utforska riktningar',
    maxSelections: MAX_SELECTIONS,
    step: 'curious',
    colorIndex: 6,
    words: directions,
  },
];

export const categoryById = (id: string): CareerCategoryDef | undefined =>
  CAREER_CATEGORIES.find((c) => c.id === id);

export const wordByLabel = (categoryId: string, label: string): CareerWord | undefined =>
  categoryById(categoryId)?.words.find((w) => w.label === label);

export const categoriesForStep = (step: WizardStepId): CareerCategoryDef[] =>
  CAREER_CATEGORIES.filter((c) => c.step === step);

export const CATEGORY_IDS: CareerCategoryId[] = CAREER_CATEGORIES.map((c) => c.id);

/** Rubriker som används i jämförelsevyn. */
export const COMPARE_HEADINGS: Partial<Record<CareerCategoryId, string>> = {
  values: 'Det här är viktigt för mig',
  traits: 'Så här beskriver jag mig',
  personality: 'Så här fungerar jag',
  drivers: 'Det här driver mig',
  skills: 'Det här kan jag',
  competencies: 'Det här tar jag med mig',
  needs: 'Det här behöver jag',
  curious: 'Det här är jag nyfiken på',
};
