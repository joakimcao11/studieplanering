import type { ActionPlanItem, SupplementItem, Placement } from './StudyPlanCanvas';

export const TERM_TARGET_HP = 30;
export const LP_TARGET_HP = 15;

export type PlanStatus = 'ok' | 'warn' | 'error';

export type TermSummary = {
  term: string;
  hp: number;
  pct: number;
  courseCount: number;
  perLp: Record<Placement, number>;
  supplementCount: number;
  supplementDone: number;
  status: PlanStatus;
  lpStatus: Record<'LP1' | 'LP2' | 'LP3' | 'LP4', PlanStatus>;
};

export type PlanWarning = {
  id: string;
  level: 'warn' | 'error';
  message: string;
};

export const effectiveHP = (it: ActionPlanItem) => (it.hp * (it.studyPace ?? 100)) / 100;

const emptyPerLp = (): Record<Placement, number> => ({
  LP1: 0, LP2: 0, LP3: 0, LP4: 0, OmtentamenI: 0, OmtentamenII: 0,
});

export const statusFor = (hp: number, target: number): PlanStatus => {
  if (hp === 0) return 'warn';
  if (hp >= target * 0.9 && hp <= target * 1.1) return 'ok';
  if (hp >= target * 0.6 && hp <= target * 1.2) return 'warn';
  return 'error';
};

export const fmtHp = (n: number) => n.toFixed(1).replace(/\.0$/, '');

export function computePlanValidation(
  actionPlan: ActionPlanItem[],
  supplements: SupplementItem[],
  terms: string[],
) {
  const allTerms = Array.from(new Set([...terms, ...actionPlan.map((i) => i.term), ...supplements.map((s) => s.term)]));
  const byTerm: Record<string, TermSummary> = {};
  allTerms.forEach((t) => {
    byTerm[t] = {
      term: t, hp: 0, pct: 0, courseCount: 0, perLp: emptyPerLp(),
      supplementCount: 0, supplementDone: 0, status: 'warn',
      lpStatus: { LP1: 'warn', LP2: 'warn', LP3: 'warn', LP4: 'warn' },
    };
  });

  const warnings: PlanWarning[] = [];
  let totalHp = 0;

  actionPlan.forEach((it) => {
    const e = effectiveHP(it);
    const row = byTerm[it.term];
    if (!row) return;
    row.hp += e;
    row.courseCount += 1;
    totalHp += e;

    const multi = (it.periods || []).length > 1;
    const lpKeys: Placement[] = multi
      ? it.periods.map((p) => `LP${p}` as Placement)
      : [it.placement];
    const share = e / (lpKeys.length || 1);
    lpKeys.forEach((k) => { row.perLp[k] = (row.perLp[k] || 0) + share; });

    // Validate that a split multi-period course sums back to the full HP.
    if (multi) {
      const sum = share * lpKeys.length;
      if (Math.abs(sum - e) > 0.05) {
        warnings.push({
          id: `split-${it.id}`,
          level: 'error',
          message: `${it.code} – delningen av flerläsperiodskursen summerar till ${fmtHp(sum)} hp i stället för ${fmtHp(e)} hp.`,
        });
      }
    }

    if (!multi && !it.placement) {
      warnings.push({ id: `noplace-${it.id}`, level: 'error', message: `${it.code} saknar läsperiod.` });
    }
    if (!it.term?.trim()) {
      warnings.push({ id: `noterm-${it.id}`, level: 'error', message: `${it.code} saknar termin.` });
    }
  });

  supplements.forEach((s) => {
    const row = byTerm[s.term];
    if (!row) {
      warnings.push({
        id: `supterm-${s.id}`,
        level: 'warn',
        message: `Kompletteringen "${s.description || s.type}" är kopplad till en termin (${s.term || 'saknas'}) som inte finns i planeringen.`,
      });
      return;
    }
    row.supplementCount += 1;
    if (s.done) row.supplementDone += 1;
    if (!s.placement) {
      warnings.push({
        id: `supplace-${s.id}`,
        level: 'warn',
        message: `Kompletteringen "${s.description || s.type}" saknar kopplad läsperiod.`,
      });
    }
  });

  Object.values(byTerm).forEach((row) => {
    row.pct = Math.round((row.hp / TERM_TARGET_HP) * 100);
    row.status = statusFor(row.hp, TERM_TARGET_HP);
    (['LP1', 'LP2', 'LP3', 'LP4'] as const).forEach((p) => {
      row.lpStatus[p] = statusFor(row.perLp[p] || 0, LP_TARGET_HP);
    });

    if (row.courseCount === 0 && row.supplementCount === 0) {
      warnings.push({ id: `emptyterm-${row.term}`, level: 'warn', message: `${row.term} innehåller inga kurser.` });
      return;
    }
    if (row.pct !== 100) {
      warnings.push({
        id: `pace-${row.term}`,
        level: row.status === 'error' ? 'error' : 'warn',
        message: `${row.term}: ${fmtHp(row.hp)} hp (${row.pct}% studietakt) – målet är ${TERM_TARGET_HP} hp.`,
      });
    }
    (['LP1', 'LP2', 'LP3', 'LP4'] as const).forEach((p) => {
      const v = row.perLp[p] || 0;
      if (Math.abs(v - LP_TARGET_HP) > 1) {
        warnings.push({
          id: `lp-${row.term}-${p}`,
          level: row.lpStatus[p] === 'error' ? 'error' : 'warn',
          message: `${row.term} ${p}: ${fmtHp(v)} hp (mål ${LP_TARGET_HP} hp).`,
        });
      }
    });
  });

  const orderedTerms = allTerms.map((t) => byTerm[t]);
  return { byTerm, terms: orderedTerms, totalHp, warnings };
}
