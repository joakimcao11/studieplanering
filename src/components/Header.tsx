import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, User, BarChart3, Settings, Menu, X } from 'lucide-react';
import lthLogo from '@/assets/lth-logo.png';
import { COUNSELORS, getCounselorById } from '@/types/planning';
import { useCounselorProfiles } from '@/hooks/useCourses';

interface HeaderProps {
  onLogout: () => void;
  counselorId: string;
  onCounselorChange: (counselorId: string) => void;
  onShowStats: () => void;
  onShowAdmin?: () => void;
  isAdmin?: boolean;
}

export const Header = ({ onLogout, counselorId, onCounselorChange, onShowStats, onShowAdmin, isAdmin }: HeaderProps) => {
  const currentCounselor = getCounselorById(counselorId);
  const { profiles } = useCounselorProfiles();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <img 
            src={lthLogo} 
            alt="LTH" 
            className="h-10 md:h-12 bg-white rounded px-2 py-1 shrink-0"
          />
          <div className="min-w-0 hidden sm:block">
            <h1 className="text-base md:text-lg font-semibold truncate">Studieplaneringsverktyg</h1>
            <p className="text-xs md:text-sm text-primary-foreground/80 truncate">
              Studie- och karriärvägledningen
            </p>
          </div>
        </div>
        
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
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
          {isAdmin && onShowAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowAdmin}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Settings className="w-4 h-4 mr-1" />
              Admin
            </Button>
          )}
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

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary-foreground/20 px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 shrink-0" />
            <Select value={counselorId} onValueChange={(v) => { onCounselorChange(v); setMobileMenuOpen(false); }}>
              <SelectTrigger className="flex-1 h-8 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-sm">
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
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onShowStats(); setMobileMenuOpen(false); }}
              className="text-primary-foreground hover:bg-primary-foreground/10 justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistik
            </Button>
            {isAdmin && onShowAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onShowAdmin(); setMobileMenuOpen(false); }}
                className="text-primary-foreground hover:bg-primary-foreground/10 justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onLogout(); setMobileMenuOpen(false); }}
              className="text-primary-foreground hover:bg-primary-foreground/10 justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logga ut
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
