// Types for the study planning tool

export type Program = 'D' | 'C';

export interface StudentInfo {
  name: string;
  program: Program;
  yearGroup: string; // e.g., D20, C21
  counselor: string;
}

export interface PlannedCourse {
  id: string;
  courseId: string;
  code: string;
  name: string;
  hp: number;
  isCustom: boolean;
}

export type Period = 'LP1' | 'LP2' | 'LP3' | 'LP4';
export type Semester = 'HT' | 'VT';
export type RetakeExamPeriod = 'april' | 'augusti' | null;

export interface TermPlan {
  id: string;
  semester: Semester;
  year: string; // e.g., "2024"
  lp1: PlannedCourse[];
  lp2: PlannedCourse[];
  retakeExam: RetakeExamPeriod;
}

export interface StudyPlan {
  studentInfo: StudentInfo;
  date: string;
  agenda: string;
  terms: TermPlan[];
  notes: string;
}

export interface PlanningState {
  currentTab: number;
  studentInfo: StudentInfo;
  agenda: string;
  terms: TermPlan[];
  notes: string;
}

// HP calculation helpers
export const HP_PER_PERIOD = 15;
export const HP_PER_TERM = 30;
export const HP_PER_YEAR = 60;

export const calculatePeriodHP = (courses: PlannedCourse[]): number => {
  return courses.reduce((sum, course) => sum + course.hp, 0);
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
