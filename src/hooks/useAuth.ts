import { useState, useEffect } from 'react';

const AUTH_KEY = 'document-chat-authenticated';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface AuthState {
  isAuthenticated: boolean;
  timestamp: number;
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      try {
        const stored = localStorage.getItem(AUTH_KEY);
        if (stored) {
          const authState: AuthState = JSON.parse(stored);
          const now = Date.now();
          
          // Check if session is still valid (within 24 hours)
          if (now - authState.timestamp < SESSION_DURATION) {
            setIsAuthenticated(true);
          } else {
            // Session expired, clear it
            localStorage.removeItem(AUTH_KEY);
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem(AUTH_KEY);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const authenticate = () => {
    const authState: AuthState = {
      isAuthenticated: true,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    authenticate,
    logout,
  };
};