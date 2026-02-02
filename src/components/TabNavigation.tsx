import { cn } from '@/lib/utils';
import { ClipboardList, GraduationCap, BarChart3 } from 'lucide-react';

interface TabNavigationProps {
  currentTab: number;
  onTabChange: (tab: number) => void;
}

const tabs = [
  { id: 0, label: 'Grunduppgifter & Agenda', icon: ClipboardList },
  { id: 1, label: 'Studieplanering', icon: GraduationCap },
  { id: 2, label: 'Överblick & Export', icon: BarChart3 },
];

export const TabNavigation = ({ currentTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all',
                  isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
