import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, UserCheck } from 'lucide-react';
import { COUNSELORS } from '@/types/planning';
import lthLogo from '@/assets/lth-logo.png';

interface ProfileSelectorProps {
  onProfileSelected: (counselorId: string) => void;
}

const PROFILE_KEY = 'lth_counselor_profile';

export const getStoredProfile = (): string | null => {
  return localStorage.getItem(PROFILE_KEY);
};

export const setStoredProfile = (counselorId: string) => {
  localStorage.setItem(PROFILE_KEY, counselorId);
};

export const ProfileSelector = ({ onProfileSelected }: ProfileSelectorProps) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const handleSelect = (counselorId: string) => {
    setStoredProfile(counselorId);
    onProfileSelected(counselorId);
  };

  const handleCustomSubmit = () => {
    if (!customName.trim()) return;
    const customId = `custom:${customName.trim()}`;
    // Store email separately
    localStorage.setItem('lth_custom_counselor_email', customEmail.trim());
    setStoredProfile(customId);
    onProfileSelected(customId);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <div className="mb-8 text-center">
        <img src={lthLogo} alt="LTH" className="h-20 mx-auto mb-6" />
        <h1 className="text-2xl font-semibold text-foreground mb-2">Välj din profil</h1>
        <p className="text-muted-foreground">Välj vilken studievägledare du är</p>
      </div>

      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            STVL-profil
          </CardTitle>
          <CardDescription>
            Välj din profil för att komma igång
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {COUNSELORS.map((counselor) => (
            <Button
              key={counselor.id}
              variant="outline"
              className="w-full justify-start gap-3 h-14 text-left"
              onClick={() => handleSelect(counselor.id)}
            >
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">{counselor.displayName}</p>
                <p className="text-xs text-muted-foreground">{counselor.email}</p>
              </div>
            </Button>
          ))}

          {!showCustom ? (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-14 text-left border border-dashed border-border"
              onClick={() => setShowCustom(true)}
            >
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">Annan STVL</p>
                <p className="text-xs text-muted-foreground">Ange ditt namn och e-post</p>
              </div>
            </Button>
          ) : (
            <div className="space-y-3 border border-border rounded-lg p-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name">Namn</Label>
                <Input
                  id="custom-name"
                  placeholder="Förnamn Efternamn"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-email">E-post</Label>
                <Input
                  id="custom-email"
                  type="email"
                  placeholder="namn@lth.lu.se"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">Du anges som "Övrig vägledare" i statistiken</p>
              <Button
                className="w-full"
                onClick={handleCustomSubmit}
                disabled={!customName.trim()}
              >
                Välj profil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
