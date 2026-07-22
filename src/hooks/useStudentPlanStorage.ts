import { useEffect, useRef, useState } from 'react';
import type { ActionPlanItem } from '@/components/meeting/StudyPlanCanvas';

export type StudentActionPlanItem = ActionPlanItem & { isExample?: boolean };

export interface PersistedStudentPlan {
  studentName: string;
  program: string;
  actionPlan: StudentActionPlanItem[];
  studyPlanText: string;
  aiDraft?: string;
  aiMode?: 'meeting-notes' | 'summary' | 'email-draft';
  notes?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'lth_student_plan_v1';

export const loadStudentPlan = (): PersistedStudentPlan | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedStudentPlan;
  } catch {
    return null;
  }
};

export const clearStudentPlan = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const useDebouncedStudentPlanSave = (
  plan: Omit<PersistedStudentPlan, 'updatedAt'>,
  enabled: boolean,
) => {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const payload: PersistedStudentPlan = { ...plan, updatedAt: new Date().toISOString() };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setSavedAt(payload.updatedAt);
      } catch {
        /* quota or serialization error — ignore */
      }
    }, 400);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [plan, enabled]);

  return savedAt;
};