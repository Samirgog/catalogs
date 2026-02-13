import { useEffect, useState } from 'react';

/**
 * Hook for Telegram WebApp theme detection and application
 * Dynamically applies Telegram's theme (light/dark) to the app
 */
export const useTelegramTheme = () => {
  const [isDark, setIsDark] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const applyTheme = () => {
      // Check if we're in Telegram WebApp environment
      const tg = (window as any).Telegram?.WebApp;
      
      if (tg) {
        // Use Telegram's theme params
        const themeParams = tg.themeParams;
        const colorScheme = tg.colorScheme;
        
        // Telegram provides colorScheme which is 'dark' or 'light'
        const isTgDark = colorScheme === 'dark' || 
          (themeParams && (
            // Dark mode indicators from Telegram theme params
            themeParams.bg_color === '#17212b' ||
            parseInt(themeParams.bg_color?.replace('#', ''), 16) < 0x500000
          ));
        
        setIsDark(isTgDark);
        
        // Apply Telegram's CSS variables directly
        if (themeParams) {
          const root = document.documentElement;
          
          // Map Telegram theme params to CSS variables
          if (themeParams.bg_color) {
            root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
          }
          if (themeParams.text_color) {
            root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
          }
          if (themeParams.hint_color) {
            root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
          }
          if (themeParams.link_color) {
            root.style.setProperty('--tg-theme-link-color', themeParams.link_color);
          }
          if (themeParams.button_color) {
            root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
          }
          if (themeParams.button_text_color) {
            root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
          }
          if (themeParams.secondary_bg_color) {
            root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color);
          }
        }
      } else {
        // Fallback to system preference when not in Telegram
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);
      }
      
      setIsReady(true);
    };

    // Apply theme immediately
    applyTheme();

    // Also listen for theme changes in Telegram
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      // Theme might change while app is running
      tg.onEvent('themeChanged', applyTheme);
      
      return () => {
        tg.offEvent('themeChanged', applyTheme);
      };
    }

    // Listen for system theme changes as fallback
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!((window as any).Telegram?.WebApp)) {
        setIsDark(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply dark class to document
  useEffect(() => {
    if (isReady) {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDark, isReady]);

  return { isDark, isReady };
};
