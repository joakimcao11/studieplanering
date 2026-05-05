// Types for the study planning tool

export type Program = 'D' | 'C' | string;

export interface Counselor {
  id: string;
  name: string;
  email: string;
  displayName: string;
}

export const COUNSELORS: Counselor[] = [
  { 
    id: 'joakim', 
    name: 'Joakim Cao', 
    email: 'joakim.cao@lth.lu.se',
    displayName: 'STVL Joakim Cao'
  },
  { 
    id: 'tobias', 
    name: 'Tobias Björklund', 
    email: 'tobias.bjorklund@lth.lu.se',
    displayName: 'STVL Tobias Björklund'
  },
  { 
    id: 'petra', 
    name: 'Petra Parmvi', 
    email: 'petra.parmvi@lth.lu.se',
    displayName: 'STVL Petra Parmvi'
  },
];

export interface StudentInfo {
  name: string;
  program: Program;
  yearGroup: string; // e.g., D20, C21
  counselorId: string;
  customDate?: string; // Custom date for the meeting
}

export type StudyPace = 25 | 50 | 75 | 100;

export interface PlannedCourse {
  id: string;
  courseId: string;
  code: string;
  name: string;
  hp: number;
  isCustom: boolean;
  studyPace?: StudyPace; // 25%, 50%, 75%, or 100% (default)
  isMultiPeriod?: boolean; // Course spans multiple periods (marked with *)
  completedHP?: number; // HP already completed (restkurs)
  periods?: string[]; // LP-periods from course catalog ('1','2','3','4')
}

export type Period = 'LP1' | 'LP2' | 'LP3' | 'LP4';
export type Semester = 'HT' | 'VT';

export interface TermPlan {
  id: string;
  semester: Semester;
  year: string; // e.g., "2024"
  customYearLabel: string; // Custom label for the year
  customSemesterLabel: string; // Custom label for the semester (e.g., "Sommar")
  lp1: PlannedCourse[];
  lp2: PlannedCourse[];
  retakeExamNotes: string; // Free text for retake exam notes
}

export interface ActionItem {
  id: string;
  activity: string;
  comment: string;
  done: boolean;
}

export interface StudyPlan {
  studentInfo: StudentInfo;
  date: string;
  agenda: string;
  actionItems: ActionItem[];
  terms: TermPlan[];
  notes: string;
}

export interface PlanningState {
  currentTab: number;
  studentInfo: StudentInfo;
  agenda: string;
  actionItems: ActionItem[];
  terms: TermPlan[];
  notes: string;
}

// HP calculation helpers
export const HP_PER_PERIOD = 15;
export const HP_PER_TERM = 30;
export const HP_PER_YEAR = 60;

export const calculatePeriodHP = (courses: PlannedCourse[]): number => {
  return courses.reduce((sum, course) => {
    // Apply study pace to HP calculation
    const pace = course.studyPace || 100;
    const effectiveHP = (course.hp * pace) / 100;
    // Subtract completed HP for restkurser
    const remainingHP = course.completedHP ? Math.max(0, effectiveHP - course.completedHP) : effectiveHP;
    return sum + remainingHP;
  }, 0);
};

export const calculateTermHP = (term: TermPlan): number => {
  return calculatePeriodHP(term.lp1) + calculatePeriodHP(term.lp2);
};

export const getHPStatus = (hp: number, target: number): 'optimal' | 'warning' | 'danger' => {
  const ratio = hp / target;
  if (ratio >= 0.9 && ratio <= 1.1) return 'optimal';
  if (ratio >= 0.7 && ratio <= 1.3) return 'warning';
  return 'danger';
};

export const getCounselorById = (id: string): Counselor | undefined => {
  if (id.startsWith('custom:')) {
    const name = id.replace('custom:', '');
    const email = typeof window !== 'undefined' ? localStorage.getItem('lth_custom_counselor_email') || '' : '';
    return { id, name, email, displayName: `STVL ${name}` };
  }
  return COUNSELORS.find(c => c.id === id);
};
