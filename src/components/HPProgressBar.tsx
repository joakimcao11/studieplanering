import { cn } from '@/lib/utils';
import { getHPStatus } from '@/types/planning';

interface HPProgressBarProps {
  current: number;
  target: number;
  label?: string;
  showDetails?: boolean;
}

export const HPProgressBar = ({ 
  current, 
  target, 
  label, 
  showDetails = true 
}: HPProgressBarProps) => {
  const percentage = Math.min((current / target) * 100, 100);
  const status = getHPStatus(current, target);
  
  const statusColors = {
    optimal: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
  };

  const statusLabels = {
    optimal: 'Inom rekommenderad studietakt',
    warning: 'Avviker från rekommenderad studietakt',
    danger: 'Betydande avvikelse',
  };

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">
            {current} / {target} hp
          </span>
        </div>
      )}
      
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            statusColors[status]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showDetails && (
        <p className={cn(
          'text-xs',
          status === 'optimal' && 'text-success',
          status === 'warning' && 'text-warning-foreground',
          status === 'danger' && 'text-destructive'
        )}>
          {statusLabels[status]}
        </p>
      )}
    </div>
  );
};
