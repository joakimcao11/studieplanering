import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, User, BarChart3, Settings } from 'lucide-react';
import lthLogo from '@/assets/lth-logo.png';
import { COUNSELORS, getCounselorById } from '@/types/planning';
import { useCounselorProfiles } from '@/hooks/useCourses';

interface HeaderProps {
  onLogout: () => void;
  counselorId: string;
  onCounselorChange: (counselorId: string) => void;
  onShowStats: () => void;
}

export const Header = ({ onLogout, counselorId, onCounselorChange, onShowStats }: HeaderProps) => {
  const currentCounselor = getCounselorById(counselorId);

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={lthLogo} 
            alt="LTH" 
            className="h-12 bg-white rounded px-2 py-1"
          />
          <div>
            <h1 className="text-lg font-semibold">Studieplaneringsverktyg</h1>
            <p className="text-sm text-primary-foreground/80">
              Studie- och karriärvägledningen
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <Select value={counselorId} onValueChange={onCounselorChange}>
              <SelectTrigger className="w-48 h-8 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-sm">
                <SelectValue placeholder="Välj studievägledare" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                {COUNSELORS.map((counselor) => (
                  <SelectItem key={counselor.id} value={counselor.id}>
                    {counselor.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowStats}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Statistik
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logga ut
          </Button>
        </div>
      </div>
    </header>
  );
};
