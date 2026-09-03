export type CareerCategoryId =
  | 'traits'
  | 'personality'
  | 'values'
  | 'drivers'
  | 'needs'
  | 'skills'
  | 'competencies'
  | 'knowledge'
  | 'experience'
  | 'curious'
  | 'learning'
  | 'contribution'
  | 'world'
  | 'challenges'
  | 'directions';

/** Ett färdigt ord i Karriärordbanken. */
export interface CareerWord {
  id: string;
  label: string;
  category: CareerCategoryId;
  /** Vad betyder det? */
  definition: string;
  /** Hur kan det märkas? */
  studentExample: string;
  /** I arbetslivet */
  careerContext: string;
  /** Fundera på */
  reflectionQuestion: string;
}

export type WizardStepId =
  | 'start'
  | 'self'
  | 'important'
  | 'can'
  | 'curious'
  | 'compare'
  | 'profile'
  | 'reflect'
  | 'export';

/** Definition av ett område (kategori) i verktyget. */
export interface CareerCategoryDef {
  id: CareerCategoryId;
  title: string;
  question: string;
  helpText?: string;
  exploreLabel: string;
  maxSelections: number;
  step: WizardStepId;
  /** Färgnyckel (0–7) används för färgkodning i visualiseringen. */
  colorIndex: number;
  words: CareerWord[];
}

/** Användarens val i ett område. */
export interface CategorySelection {
  id: string;
  title: string;
  type: 'recommended' | 'custom';
  question?: string;
  maxSelections: number;
  selectedItems: string[];
  customItems: string[];
  /** Frivilligt: de tre allra viktigaste. */
  topThree?: string[];
  note?: string;
  skipped?: boolean;
  colorIndex?: number;
}

export interface CareerProfile {
  profileName: string;
  categories: CategorySelection[];
  comparisonReflection: string;
  missingItems: string[];
  reflectionAnswers: Record<string, string>;
  nextStep: string;
  nextStepIdeas: string[];
  visualization: {
    type: 'mindmap' | 'creative' | 'overview';
    layout: 'compact' | 'balanced' | 'airy';
    format: 'landscape' | 'portrait' | 'square';
    display: 'all' | 'categories';
    theme: 'site' | 'warm' | 'cool';
  };
  /** Nodpositioner som användaren dragit, per vy. */
  nodePositions?: Record<string, { x: number; y: number }>;
  isDemo?: boolean;
  updatedAt?: string;
}
