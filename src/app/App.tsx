import './App.css';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Client pages
import {
  BookingPage,
  CartPage,
  CheckoutPage,
  CatalogPage,
} from '../client/pages';

// Business pages
import {
  ActionsEditorPage,
  CatalogsPage,
  CategoriesEditorPage,
  ItemsPage,
  LinksPage,
} from '../business/pages';
import { CatalogEditorPage } from '../business/pages/CatalogEditorPage';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}



export function App() {
  const [userMode, setUserMode] = useState<'business' | 'client' | null>('business');

  // useEffect(() => {
  //   // Check for Telegram Web App parameters
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const initDataRaw = urlParams.get('tgWebAppData');

  //   const determineUserMode = () => {
  //     if (initDataRaw) {
  //       // Parse the init data
  //       const params = new URLSearchParams(initDataRaw);
  //       const userParam = params.get('user');

  //       if (userParam) {
  //         try {
  //           const userData: TelegramUser = JSON.parse(
  //             decodeURIComponent(userParam)
  //           );

  //           // Determine user mode based on some criteria
  //           // For now, we'll default to client mode, but this can be customized
  //           // based on user properties or other logic
  //           const mode = userData.username?.includes('business')
  //             ? 'business'
  //             : 'client';

  //           setUserMode(mode);
  //           return;
  //         } catch (error) {
  //           console.error('Error parsing Telegram init data:', error);
  //         }
  //       }
  //     }

  //     // Default to client mode if no Telegram data or parsing fails
  //     setUserMode('client');
  //   };

  //   determineUserMode();
  // }, []);

  if (!userMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="App">
        <Routes>
          {userMode === 'client' && (
            <>
              <Route path="/" element={<Navigate to="/catalog" replace />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
            </>
          )}

          {userMode === 'business' && (
            <>
              <Route path="/" element={<Navigate to="/catalogs" replace />} />
              <Route path="/catalogs" element={<CatalogsPage />} />
              <Route path="/catalogs/:catalogId/edit" element={<CatalogEditorPage />} />
              <Route path="/catalogs/new" element={<CatalogEditorPage />} />
              <Route path="/catalogs/:catalogId/links" element={<LinksPage />} />
              <Route path="/categories/editor" element={<CategoriesEditorPage />} />
              <Route path="/actions/editor" element={<ActionsEditorPage />} />
              <Route path="/items" element={<ItemsPage />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
