import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import lthLogo from '@/assets/lth-logo.png';

interface HeaderProps {
  onLogout: () => void;
}

export const Header = ({ onLogout }: HeaderProps) => {
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
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
            <User className="w-4 h-4" />
            <span>STVL Joakim Cao</span>
          </div>
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
