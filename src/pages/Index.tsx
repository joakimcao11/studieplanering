import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/components/LoginPage';
import { MainApp } from '@/components/MainApp';
import { ProfileSelector, getStoredProfile, setStoredProfile } from '@/components/ProfileSelector';

const Index = () => {
  const { isAuthenticated, isLoading, login, logout } = useAuth();
  const [counselorId, setCounselorId] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const stored = getStoredProfile();
      if (stored) {
        setCounselorId(stored);
        setNeedsProfile(false);
      } else {
        setNeedsProfile(true);
      }
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  if (needsProfile || !counselorId) {
    return (
      <ProfileSelector
        onProfileSelected={(id) => {
          setCounselorId(id);
          setNeedsProfile(false);
        }}
      />
    );
  }

  return (
    <MainApp
      onLogout={() => {
        logout();
        setCounselorId(null);
      }}
      initialCounselorId={counselorId}
      onCounselorIdChange={(id) => {
        setCounselorId(id);
        setStoredProfile(id);
      }}
    />
  );
};

export default Index;
