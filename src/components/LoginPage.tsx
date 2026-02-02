import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Lock, User } from 'lucide-react';
import lthLogo from '@/assets/lth-logo.png';

interface LoginPageProps {
  onLogin: (username: string, password: string, rememberMe: boolean) => boolean;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a brief delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    const success = onLogin(username, password, rememberMe);
    
    if (!success) {
      setError('Felaktigt användarnamn eller lösenord');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      {/* Header with logo */}
      <div className="mb-8 text-center">
        <img 
          src={lthLogo} 
          alt="LTH - Faculty of Engineering" 
          className="h-20 mx-auto mb-6"
        />
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Studieplaneringsverktyg
        </h1>
        <p className="text-muted-foreground">
          Studie- och karriärvägledningen LTH
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Logga in
          </CardTitle>
          <CardDescription>
            Ange dina inloggningsuppgifter för att fortsätta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Användarnamn</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ange användarnamn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Ange lösenord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isLoading}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Kom ihåg mig
              </Label>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-lth-blue-light"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Loggar in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Logga in
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} Lunds Tekniska Högskola
      </p>
    </div>
  );
};
