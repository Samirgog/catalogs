import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramWebApp } from '@/lib/telegram';

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
  }, [navigate, backPath]);

  useEffect(() => {
    // Check if we're in Telegram WebApp environment
    const webApp = getTelegramWebApp();
    if (webApp) {
      
      // Initialize WebApp if not already done
      if (!webApp.isExpanded) {
        webApp.expand();
      }
      
      // Show back button
      webApp.BackButton.show();
      
      // Attach event listener
      webApp.BackButton.onClick(handleBackButton);

      // Cleanup function
      return () => {
        try {
          webApp.BackButton.offClick(handleBackButton);
          webApp.BackButton.hide();
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
    const webApp = getTelegramWebApp();
    if (webApp) {
      if (show) {
        webApp.BackButton.show();
      } else {
        webApp.BackButton.hide();
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
