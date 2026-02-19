import './App.css';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

// Client pages
import {
  BookingPage,
  CartPage,
  CheckoutPage,
  CatalogPage,
  OrderStatusPage,
} from '../client/pages';

// Business pages
import { ActionsEditorPage, CatalogsPage, LinksPage } from '../business/pages';
import { CatalogEditorPage } from '../business/pages/CatalogEditorPage';
import { CategoriesEditorPage } from '../business/pages/CategoriesEditorPage';
import { ItemEditorPage } from '../business/pages/ItemEditorPage';
import { CategoryEditorPage } from '../business/pages/CategoryEditorPage';
import { useTelegramAuth } from '@/useTelegramAuth';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';

export function App() {
  const didLoginRef = useRef(false);
  const { isAuthenticated, isLoading, error, login, userEntry } =
    useTelegramAuth();

  // Apply Telegram theme
  useTelegramTheme();

  useEffect(() => {
    if (didLoginRef.current) return;
    didLoginRef.current = true;
    void login();
  }, [login]);

  if (!userEntry || isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Ошибка. Попробуйте войти снова.</div>
      </div>
    );
  }

  if (userEntry.type === 'catalog' && !userEntry.catalogId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Ошибка: не найден идентификатор каталога.</div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="App">
        <Routes>
          {userEntry.type === 'catalog' && (
            <>
              <Route path="/" element={<Navigate to="/catalog" replace />} />
              <Route
                path="/booking"
                element={<BookingPage catalogId={userEntry.catalogId!} />}
              />
              <Route
                path="/cart"
                element={<CartPage catalogId={userEntry.catalogId!} />}
              />
              <Route
                path="/checkout"
                element={<CheckoutPage catalogId={userEntry.catalogId!} />}
              />
              <Route
                path="/checkout/:orderId"
                element={<CheckoutPage catalogId={userEntry.catalogId!} />}
              />
              <Route
                path="/catalog"
                element={<CatalogPage catalogId={userEntry.catalogId!} />}
              />
              <Route path="/order/:orderId" element={<OrderStatusPage />} />
            </>
          )}

          {userEntry.type === 'admin' && (
            <>
              <Route path="/" element={<Navigate to="/catalogs" replace />} />
              <Route path="/catalogs" element={<CatalogsPage />} />
              <Route
                path="/catalogs/:catalogId/edit"
                element={<CatalogEditorPage />}
              />
              <Route path="/catalogs/new" element={<CatalogEditorPage />} />
              <Route
                path="/catalogs/:catalogId/links"
                element={<LinksPage />}
              />
              <Route
                path="/categories/editor/:catalogId"
                element={<CategoriesEditorPage />}
              />
              <Route
                path="/categories/editor"
                element={<Navigate to="/catalogs" replace />}
              />
              <Route
                path="/categories/:catalogId/item-editor/:categoryId/:itemId?"
                element={<ItemEditorPage />}
              />
              <Route
                path="/categories/:catalogId/category-editor/:categoryId?"
                element={<CategoryEditorPage />}
              />
              <Route
                path="/actions/editor/:catalogId"
                element={<ActionsEditorPage />}
              />
            </>
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
