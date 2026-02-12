import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for Telegram WebApp navigation integration
 * Handles back button and other Telegram-specific navigation
 */
export const useTelegramNavigation = (backPath?: string) => {
  const navigate = useNavigate();

  const handleBackButton = useCallback(() => {
    // Go back in history, or to home if no history
    if (window.history.length > 1) {
      backPath ? navigate(backPath) : navigate(-1)
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    // Check if we're in Telegram WebApp environment
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const WebApp = (window as any).Telegram.WebApp;
      
      // Initialize WebApp if not already done
      if (!WebApp.isExpanded) {
        WebApp.expand();
      }
      
      // Show back button
      WebApp.BackButton.show();
      
      // Attach event listener
      WebApp.BackButton.onClick(handleBackButton);

      console.log('Telegram back button initialized');

      // Cleanup function
      return () => {
        try {
          WebApp.BackButton.offClick(handleBackButton);
          WebApp.BackButton.hide();
        } catch (e) {
          console.warn('Error cleaning up Telegram back button:', e);
        }
      };
    }
  }, [handleBackButton]);

  /**
   * Programmatically show/hide back button
   */
  const setShowBackButton = useCallback((show: boolean) => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const WebApp = (window as any).Telegram.WebApp;
      if (show) {
        WebApp.BackButton.show();
      } else {
        WebApp.BackButton.hide();
      }
    }
  }, []);

  /**
   * Programmatically trigger back action
   */
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      backPath ? navigate(backPath) : navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate, backPath]);

  return {
    setShowBackButton,
    goBack
  };
};

/**
 * Hook for pages that need back button functionality
 * Automatically manages back button visibility based on route depth
 */
export const useAutoBackButton = (backPath?: string) => {
  const { setShowBackButton } = useTelegramNavigation(backPath);
  
  useEffect(() => {
    // Show back button when component mounts
    setShowBackButton(true);
    
    // Hide back button when component unmounts
    return () => {
      setShowBackButton(false);
    };
  }, [setShowBackButton]);
};