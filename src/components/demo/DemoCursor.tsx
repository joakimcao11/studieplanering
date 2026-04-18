import { MousePointer2 } from 'lucide-react';

interface DemoCursorProps {
  x: number;
  y: number;
  clicking?: boolean;
  label?: string;
}

export const DemoCursor = ({ x, y, clicking, label }: DemoCursorProps) => {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-700 ease-out"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-25%, -10%)' }}
    >
      {clicking && (
        <span className="absolute -inset-3 rounded-full bg-primary/30 animate-ping" />
      )}
      <MousePointer2
        className={`w-7 h-7 text-primary drop-shadow-lg transition-transform ${clicking ? 'scale-90' : ''}`}
        fill="hsl(var(--primary))"
      />
      {label && (
        <div className="absolute left-7 top-6 whitespace-nowrap rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-medium shadow-xl animate-fade-in">
          {label}
        </div>
      )}
    </div>
  );
};
