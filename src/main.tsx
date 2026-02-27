import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './app';
import { Toaster } from '@/components/ui/toaster';
import { getTelegramWebApp } from '@/lib/telegram';

// Initialize Telegram WebApp
const initTelegramWebApp = () => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    try {
      // Expand to fullscreen
      webApp.ready();
      webApp.expand();
      
      // Disable swipe down to close
      webApp.disableVerticalSwipes?.();
      
      // Set header/background color to match app theme
      const tgTheme = webApp.themeParams || {};
      const preferred =
        tgTheme.secondary_bg_color ||
        tgTheme.bg_color ||
        '#f8fafc';
      webApp.setHeaderColor?.(preferred);
      if (typeof webApp.setBackgroundColor === 'function') {
        webApp.setBackgroundColor(preferred);
      }
      
      // Enable closing confirmation
      webApp.enableClosingConfirmation?.();
    } catch (error) {
      console.warn('Telegram WebApp initialization error:', error);
    }
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
