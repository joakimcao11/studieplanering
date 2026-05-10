import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Home, GraduationCap, FileText, Sparkles, Wrench, BarChart3,
  Settings, LogOut, LayoutList,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { COUNSELORS } from '@/types/planning';
import lthLogo from '@/assets/lth-logo.png';

export type ShellSection = 'meeting' | 'planning' | 'simple' | 'admin' | 'stats';

interface AppShellProps {
  section: ShellSection;
  onSectionChange: (s: ShellSection) => void;
  isAdmin: boolean;
  counselorId: string;
  onCounselorChange: (id: string) => void;
  onLogout: () => void;
  onExitAltView: () => void;
  children: ReactNode;
}

const SECTION_TITLES: Record<ShellSection, string> = {
  meeting: 'Mötesanteckning',
  planning: 'Studieplanering',
  simple: 'Studieplan II',
  admin: 'Administration',
  stats: 'Statistik',
};

export const AppShell = ({
  section, onSectionChange, isAdmin, counselorId, onCounselorChange,
  onLogout, onExitAltView, children,
}: AppShellProps) => {
  const navItems: { id: ShellSection; icon: any; label: string; show: boolean }[] = [
    { id: 'meeting', icon: FileText, label: 'Mötesanteckning', show: true },
    { id: 'planning', icon: GraduationCap, label: 'Studieplanering', show: true },
    { id: 'simple', icon: Sparkles, label: 'Studieplan II', show: true },
    { id: 'stats', icon: BarChart3, label: 'Statistik', show: true },
    { id: 'admin', icon: Wrench, label: 'Admin', show: isAdmin },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="fixed inset-0 bg-background flex">
        {/* Sidebar */}
        <aside className="w-16 shrink-0 bg-secondary/40 border-r flex flex-col items-center py-3 gap-2">
          <button
            onClick={() => onSectionChange('meeting')}
            className="w-10 h-10 rounded-md bg-white border flex items-center justify-center shrink-0 mb-2"
            title="Hem"
          >
            <img src={lthLogo} alt="LTH" className="max-w-[32px] max-h-[32px]" />
          </button>

          {navItems.filter((n) => n.show).map(({ id, icon: Icon, label }) => {
            const active = section === id;
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSectionChange(id)}
                    aria-label={label}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'w-10 h-10 rounded-md flex items-center justify-center transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          })}

          <div className="flex-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onExitAltView}
                aria-label="Standardvy"
                className="w-10 h-10 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-center"
              >
                <LayoutList className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Standardvy</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                aria-label="Logga ut"
                className="w-10 h-10 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Logga ut</TooltipContent>
          </Tooltip>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b bg-card px-6 py-3 flex items-center justify-between gap-4 shrink-0">
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">{SECTION_TITLES[section]}</h1>
              <p className="text-xs text-muted-foreground">Studie- och karriärvägledningen LTH</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={counselorId} onValueChange={onCounselorChange}>
                <SelectTrigger className="w-48 h-9 text-sm">
                  <SelectValue placeholder="Välj studievägledare" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {COUNSELORS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={onExitAltView}>
                <LayoutList className="w-4 h-4 mr-1" /> Standardvy
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};