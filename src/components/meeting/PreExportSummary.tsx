import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionPlanItem, SupplementItem } from './StudyPlanCanvas';
import {
  computePlanValidation, fmtHp, LP_TARGET_HP, TERM_TARGET_HP, type PlanStatus,
} from './planValidation';

const statusClass: Record<PlanStatus, string> = {
  ok: 'text-emerald-600',
  warn: 'text-amber-600',
  error: 'text-destructive',
};
const statusBg: Record<PlanStatus, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  error: 'bg-destructive',
};

interface Props {
  actionPlan: ActionPlanItem[];
  supplements: SupplementItem[];
  terms: string[];
  compact?: boolean;
  className?: string;
}

/** Sammanställning per läsår och läsperiod + valideringsvarningar inför export. */
export const PreExportSummary = ({ actionPlan, supplements, terms, compact, className }: Props) => {
  const v = computePlanValidation(actionPlan, supplements, terms);
  const errors = v.warnings.filter((w) => w.level === 'error');
  const warns = v.warnings.filter((w) => w.level === 'warn');

  const body = (
    <div className="space-y-4">
      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2 font-medium">Läsår</th>
              <th className="text-left p-2 font-medium">LP1 (höst)</th>
              <th className="text-left p-2 font-medium">LP2 (höst)</th>
              <th className="text-left p-2 font-medium">LP3 (vår)</th>
              <th className="text-left p-2 font-medium">LP4 (vår)</th>
              <th className="text-left p-2 font-medium">Totalt läsår</th>
              <th className="text-left p-2 font-medium">Studietakt</th>
              <th className="text-left p-2 font-medium">Komplettering</th>
            </tr>
          </thead>
          <tbody>
            {v.terms.map((row) => (
              <tr key={row.term} className="border-t">
                <td className="p-2 font-medium">{termLabel(row.term)}</td>
                {(['LP1', 'LP2', 'LP3', 'LP4'] as const).map((p) => (
                  <td key={p} className={cn('p-2 font-medium', statusClass[row.lpStatus[p]])}>
                    {fmtHp(row.perLp[p] || 0)} hp
                  </td>
                ))}
                <td className={cn('p-2 font-semibold', statusClass[row.status])}>{fmtHp(row.hp)} hp</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-muted rounded overflow-hidden">
                      <div className={cn('h-full', statusBg[row.status])} style={{ width: `${Math.min(100, row.pct)}%` }} />
                    </div>
                    <span className={statusClass[row.status]}>{row.pct}%</span>
                  </div>
                </td>
                <td className="p-2 text-muted-foreground">
                  {row.supplementCount > 0
                    ? `${row.supplementCount} st (${row.supplementDone} klara)`
                    : '–'}
                </td>
              </tr>
            ))}
            <tr className="border-t bg-muted/40">
              <td className="p-2 font-semibold">Totalt</td>
              <td className="p-2" colSpan={4} />
              <td className="p-2 font-semibold">{fmtHp(v.totalHp)} hp</td>
              <td className="p-2" />
              <td className="p-2 text-muted-foreground">{supplements.length} st</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Krav som jämförs: {TERM_TARGET_HP} hp per termin (hösttermin = LP1–LP2, vårtermin = LP3–LP4),
        {' '}{YEAR_TARGET_HP} hp per läsår vid 100 % studietakt och ca {LP_TARGET_HP} hp per läsperiod.
        Flerläsperiodskurser delas jämnt mellan sina läsperioder. Omtentamen I och II räknas inte in.
      </p>


      {v.warnings.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3">
          <CheckCircle2 className="w-4 h-4" /> Planeringen stämmer mot kraven – inga varningar.
        </div>
      ) : (
        <div className="space-y-2">
          {errors.length > 0 && (
            <div className="text-xs border border-destructive/40 bg-destructive/5 rounded p-3 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <AlertTriangle className="w-4 h-4" /> Behöver åtgärdas ({errors.length})
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errors.map((w) => <li key={w.id}>{w.message}</li>)}
              </ul>
            </div>
          )}
          {warns.length > 0 && (
            <div className="text-xs border border-amber-300 bg-amber-50 rounded p-3 space-y-1 text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4" /> Varningar ({warns.length})
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {warns.map((w) => <li key={w.id}>{w.message}</li>)}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Du kan exportera ändå – varningarna är till för att du ska hinna se avvikelserna först.
          </p>
        </div>
      )}
    </div>
  );

  if (compact) return <div className={className}>{body}</div>;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" /> Sammanställning inför export
        </CardTitle>
        <CardDescription className="text-xs">
          Kurser och komplettering summerade per läsperiod, jämfört mot kraven.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
};
