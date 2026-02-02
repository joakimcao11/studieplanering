import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/components/LoginPage';
import { MainApp } from '@/components/MainApp';

const Index = () => {
  const { isAuthenticated, isLoading, login, logout } = useAuth();

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

  return <MainApp onLogout={logout} />;
};

export default Index;
