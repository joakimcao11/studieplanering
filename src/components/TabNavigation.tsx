import { cn } from '@/lib/utils';
import { GraduationCap, Sparkles, FileText } from 'lucide-react';

interface TabNavigationProps {
  currentTab: number;
  onTabChange: (tab: number) => void;
}

const tabs = [
  { id: 1, label: 'Studieplanering', icon: GraduationCap },
  { id: 3, label: 'Snabbplanering', icon: Sparkles },
  { id: 4, label: 'Mötesanteckning', icon: FileText },
];

export const TabNavigation = ({ currentTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="bg-card border-b border-border overflow-x-auto">
      <div className="container mx-auto px-4">
        <nav className="flex gap-1 min-w-max" aria-label="Huvudnavigering">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
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
