import { useState, useEffect, useCallback } from 'react';

const CREDENTIALS = {
  username: 'svl',
  password: 'admin',
};

const AUTH_KEY = 'lth_auth';
const REMEMBER_KEY = 'lth_remember';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check if user is already authenticated
    const storedAuth = localStorage.getItem(AUTH_KEY);
    const remembered = localStorage.getItem(REMEMBER_KEY);
    
    if (storedAuth === 'true' || remembered === 'true') {
      setAuthState({ isAuthenticated: true, isLoading: false });
    } else {
      setAuthState({ isAuthenticated: false, isLoading: false });
    }
  }, []);

  const login = useCallback((username: string, password: string, rememberMe: boolean): boolean => {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      localStorage.setItem(AUTH_KEY, 'true');
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, 'true');
      }
      setAuthState({ isAuthenticated: true, isLoading: false });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    setAuthState({ isAuthenticated: false, isLoading: false });
  }, []);

  return {
    ...authState,
    login,
    logout,
  };
};
