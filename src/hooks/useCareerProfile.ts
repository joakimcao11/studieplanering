import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CareerProfile, CategorySelection } from '@/types/careerProfile';
import { CAREER_CATEGORIES } from '@/data/careerWordBank';

const STORAGE_KEY = 'lth_career_profile_v1';

export const emptyProfile = (): CareerProfile => ({
  profileName: '',
  categories: CAREER_CATEGORIES.map((c) => ({
    id: c.id,
    title: c.title,
    type: 'recommended' as const,
    question: c.question,
    maxSelections: c.maxSelections,
    selectedItems: [],
    customItems: [],
    topThree: [],
    note: '',
    colorIndex: c.colorIndex,
  })),
  comparisonReflection: '',
  missingItems: [],
  reflectionAnswers: {},
  nextStep: '',
  nextStepIdeas: [],
  visualization: {
    type: 'mindmap',
    layout: 'balanced',
    format: 'landscape',
    display: 'all',
    theme: 'site',
  },
  nodePositions: {},
});

const loadProfile = (): CareerProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CareerProfile;
    // Slå ihop med ev. nya kategorier i ordbanken.
    const base = emptyProfile();
    const merged: CategorySelection[] = base.categories.map(
      (c) => parsed.categories?.find((p) => p.id === c.id) ?? c,
    );
    const customs = (parsed.categories || []).filter((c) => c.type === 'custom');
    return { ...base, ...parsed, categories: [...merged, ...customs] };
  } catch {
    return null;
  }
};

export const useCareerProfile = () => {
  const [profile, setProfile] = useState<CareerProfile>(() => loadProfile() ?? emptyProfile());
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hasDraft] = useState<boolean>(() => !!loadProfile());
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        const payload = { ...profile, updatedAt: new Date().toISOString() };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setSavedAt(payload.updatedAt);
      } catch {
        /* ignorera quota-fel */
      }
    }, 400);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [profile]);

  const updateCategory = useCallback(
    (id: string, patch: Partial<CategorySelection>) =>
      setProfile((p) => ({
        ...p,
        categories: p.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),
    [],
  );

  const toggleItem = useCallback(
    (categoryId: string, label: string) =>
      setProfile((p) => ({
        ...p,
        categories: p.categories.map((c) => {
          if (c.id !== categoryId) return c;
          const selected = c.selectedItems.includes(label);
          if (selected) {
            return {
              ...c,
              selectedItems: c.selectedItems.filter((l) => l !== label),
              topThree: (c.topThree || []).filter((l) => l !== label),
            };
          }
          const total = c.selectedItems.length + c.customItems.length;
          if (total >= c.maxSelections) return c;
          return { ...c, selectedItems: [...c.selectedItems, label], skipped: false };
        }),
      })),
    [],
  );

  const addCustomItem = useCallback(
    (categoryId: string, label: string) =>
      setProfile((p) => ({
        ...p,
        categories: p.categories.map((c) => {
          if (c.id !== categoryId) return c;
          const total = c.selectedItems.length + c.customItems.length;
          if (!label.trim() || total >= c.maxSelections) return c;
          if (c.customItems.includes(label.trim())) return c;
          return { ...c, customItems: [...c.customItems, label.trim()], skipped: false };
        }),
      })),
    [],
  );

  const updateCustomItem = useCallback(
    (categoryId: string, oldLabel: string, newLabel: string) =>
      setProfile((p) => ({
        ...p,
        categories: p.categories.map((c) =>
          c.id === categoryId
            ? { ...c, customItems: c.customItems.map((l) => (l === oldLabel ? newLabel.trim() || l : l)) }
            : c,
        ),
      })),
    [],
  );

  const removeItem = useCallback(
    (categoryId: string, label: string) =>
      setProfile((p) => ({
        ...p,
        categories: p.categories.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                selectedItems: c.selectedItems.filter((l) => l !== label),
                customItems: c.customItems.filter((l) => l !== label),
                topThree: (c.topThree || []).filter((l) => l !== label),
              }
            : c,
        ),
      })),
    [],
  );

  /** Flytta ett ord från en kategori till en annan (används i mindmappen). */
  const moveItem = useCallback(
    (fromId: string, toId: string, label: string) =>
      setProfile((p) => ({
        ...p,
        categories: p.categories.map((c) => {
          if (c.id === fromId) {
            return {
              ...c,
              selectedItems: c.selectedItems.filter((l) => l !== label),
              customItems: c.customItems.filter((l) => l !== label),
            };
          }
          if (c.id === toId) {
            if (c.selectedItems.includes(label) || c.customItems.includes(label)) return c;
            return { ...c, customItems: [...c.customItems, label] };
          }
          return c;
        }),
      })),
    [],
  );

  const addCustomCategory = useCallback((title: string, question: string) => {
    const id = `custom-${Date.now()}`;
    setProfile((p) => ({
      ...p,
      categories: [
        ...p.categories,
        {
          id,
          title: title.trim() || 'Eget område',
          question: question.trim(),
          type: 'custom',
          maxSelections: 8,
          selectedItems: [],
          customItems: [],
          topThree: [],
          note: '',
          colorIndex: p.categories.length % 8,
        },
      ],
    }));
    return id;
  }, []);

  const removeCategory = useCallback(
    (id: string) => setProfile((p) => ({ ...p, categories: p.categories.filter((c) => c.id !== id) })),
    [],
  );

  const reset = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setProfile(emptyProfile());
  }, []);

  const activeCategories = useMemo(
    () => profile.categories.filter((c) => c.selectedItems.length + c.customItems.length > 0),
    [profile.categories],
  );

  const totalWords = useMemo(
    () => activeCategories.reduce((n, c) => n + c.selectedItems.length + c.customItems.length, 0),
    [activeCategories],
  );

  return {
    profile,
    setProfile,
    savedAt,
    hasDraft,
    updateCategory,
    toggleItem,
    addCustomItem,
    updateCustomItem,
    removeItem,
    moveItem,
    addCustomCategory,
    removeCategory,
    reset,
    activeCategories,
    totalWords,
  };
};

export const allItems = (c: CategorySelection): string[] => [...c.selectedItems, ...c.customItems];
