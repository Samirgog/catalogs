import { useEffect } from 'react';
import useSWR from 'swr';
import { useUserStore } from './userStore';
import { telegramAuthService } from './telegramAuthService';
import type { User } from './types';

// SWR fetcher function for Telegram auth
const authFetcher = async (initData: string): Promise<User> => {
  return await telegramAuthService.authenticate(initData);
};

/**
 * Hook for Telegram WebApp authentication
 * @param initData - Telegram WebApp initData string (optional, will auto-detect if not provided)
 * @returns Authentication state and methods
 */
export const useTelegramAuth = (initData?: string) => {
  const { user, isAuthenticated, isLoading, error, setUser, setLoading, setError, logout } = useUserStore();
  
  // Auto-detect Telegram WebApp initData if not provided
  const detectedInitData = initData || ((window as any).Telegram?.WebApp?.initData ?? '');

  // SWR key - only authenticate if we have initData
  const shouldAuthenticate = !!detectedInitData && !isAuthenticated && !user;
  
  const { data: authUser, error: authError, isValidating } = useSWR(
    shouldAuthenticate ? ['telegram-auth', detectedInitData] : null,
    () => authFetcher(detectedInitData),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
      onSuccess: (userData: User) => {
        // Store user in both store and localStorage
        setUser(userData);
        telegramAuthService.storeUser(userData);
      },
      onError: (err: Error) => {
        setError(err.message);
        telegramAuthService.clearStoredUser();
      }
    }
  );

  // Initialize from stored user on mount
  useEffect(() => {
    const initializeAuth = () => {
      // Check for stored user
      const storedUser = telegramAuthService.getStoredUser();
      if (storedUser && telegramAuthService.isAuthenticated()) {
        setUser(storedUser);
        return;
      }
      
      // If we have initData but no user, trigger authentication
      if (detectedInitData && !isAuthenticated && !user) {
        setLoading(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (customInitData?: string) => {
    const dataToUse = customInitData || detectedInitData;

    if (!dataToUse) {
      const errorMsg = 'No Telegram initData available for authentication';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setLoading(true);
      setError(null);
      
      const userData = await telegramAuthService.authenticate(dataToUse);
      
      // Update store and localStorage
      setUser(userData);
      telegramAuthService.storeUser(userData);
      
      return userData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      telegramAuthService.clearStoredUser();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    logout();
    telegramAuthService.clearStoredUser();
  };

  return {
    // State
    user: user || authUser,
    isAuthenticated: isAuthenticated || !!authUser,
    isLoading: isLoading || isValidating,
    error: error || (authError ? authError.message : null),
    
    // Methods
    login,
    logout: logoutUser,
    
    // Utils
    getStoredUser: telegramAuthService.getStoredUser,
    isAuthenticatedLocally: telegramAuthService.isAuthenticated
  };
};

/**
 * Hook to get current authenticated user
 * @returns User object or null if not authenticated
 */
export const useCurrentUser = () => {
  const { user, isAuthenticated } = useUserStore();
  
  return {
    user,
    isAuthenticated,
    userId: user?.id || null
  };
};