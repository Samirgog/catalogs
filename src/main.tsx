import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './app';
import { Toaster } from '@/components/ui/toaster';

// Initialize Telegram WebApp
const initTelegramWebApp = () => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    const WebApp = (window as any).Telegram.WebApp;
    
    try {
      // Expand to fullscreen
      WebApp.ready();
      WebApp.expand();
      
      // Disable swipe down to close
      WebApp.disableVerticalSwipes();
      
      // Set header/background color to match app theme
      const tgTheme = WebApp.themeParams || {};
      const preferred =
        tgTheme.secondary_bg_color ||
        tgTheme.bg_color ||
        '#f8fafc';
      WebApp.setHeaderColor(preferred);
      if (typeof WebApp.setBackgroundColor === 'function') {
        WebApp.setBackgroundColor(preferred);
      }
      
      // Enable closing confirmation
      WebApp.enableClosingConfirmation();
      
      console.log('Telegram WebApp initialized successfully');
    } catch (error) {
      console.warn('Telegram WebApp initialization error:', error);
    }
  } else {
    console.log('Not running in Telegram WebApp environment');
  }
};

// Initialize Telegram when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTelegramWebApp);
} else {
  initTelegramWebApp();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster richColors position="top-center" />
  </StrictMode>
);
