import './App.css';
import { HashRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Suspense, lazy, useEffect, useRef } from 'react';
import { useTelegramAuth } from '@/useTelegramAuth';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';

const BookingPage = lazy(() =>
  import('../client/pages').then((module) => ({ default: module.BookingPage })),
);
const CartPage = lazy(() =>
  import('../client/pages').then((module) => ({ default: module.CartPage })),
);
const CheckoutPage = lazy(() =>
  import('../client/pages').then((module) => ({ default: module.CheckoutPage })),
);
const CatalogPage = lazy(() =>
  import('../client/pages').then((module) => ({ default: module.CatalogPage })),
);
const FoodcourtCatalogsPage = lazy(() =>
  import('../client/pages').then((module) => ({ default: module.FoodcourtCatalogsPage })),
);
const OrderStatusPage = lazy(() =>
  import('../client/pages').then((module) => ({ default: module.OrderStatusPage })),
);

const ActionsEditorPage = lazy(() =>
  import('../business/pages').then((module) => ({ default: module.ActionsEditorPage })),
);
const CatalogsPage = lazy(() =>
  import('../business/pages').then((module) => ({ default: module.CatalogsPage })),
);
const LinksPage = lazy(() =>
  import('../business/pages').then((module) => ({ default: module.LinksPage })),
);
const StaffPage = lazy(() =>
  import('../business/pages').then((module) => ({ default: module.StaffPage })),
);
const CatalogAccessPage = lazy(() =>
  import('../business/pages').then((module) => ({ default: module.CatalogAccessPage })),
);
const FulfillmentMethodsPage = lazy(() =>
  import('../business/pages').then((module) => ({ default: module.FulfillmentMethodsPage })),
);
const PlacesPage = lazy(() =>
  import('../business/pages').then((module) => ({ default: module.PlacesPage })),
);
const CatalogEditorPage = lazy(() =>
  import('../business/pages/CatalogEditorPage').then((module) => ({ default: module.CatalogEditorPage })),
);
const CategoriesEditorPage = lazy(() =>
  import('../business/pages/CategoriesEditorPage').then((module) => ({ default: module.CategoriesEditorPage })),
);
const ItemEditorPage = lazy(() =>
  import('../business/pages/ItemEditorPage').then((module) => ({ default: module.ItemEditorPage })),
);
const CategoryEditorPage = lazy(() =>
  import('../business/pages/CategoryEditorPage').then((module) => ({ default: module.CategoryEditorPage })),
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Загрузка...</div>
    </div>
  );
}

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
        <Suspense fallback={<PageLoader />}>
          <AnimatedAppRoutes userEntry={userEntry} />
        </Suspense>
      </div>
    </HashRouter>
  );
}

function AnimatedAppRoutes({
  userEntry,
}: {
  userEntry: NonNullable<ReturnType<typeof useTelegramAuth>['userEntry']>;
}) {
  const location = useLocation();
  const routeAnimationKey = `${location.pathname}${location.search}`;

  return (
    <div key={routeAnimationKey} className="route-fade-in">
      <Routes location={location}>
        {userEntry.type === 'catalog' && (
          <>
            <Route path="/" element={<Navigate to="/catalog" replace />} />
            <Route
              path="/booking"
              element={<BookingPage catalogId={userEntry.catalogId!} />}
            />
            <Route
              path="/booking/:orderId"
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

        {userEntry.type === 'place' && (
          <>
            <Route path="/" element={<Navigate to="/foodcourt" replace />} />
            <Route
              path="/foodcourt"
              element={<FoodcourtCatalogsPage placeId={userEntry.placeId || ''} />}
            />
            <Route path="/catalog/:catalogId" element={<CatalogByRoute />} />
            <Route path="/order/:orderId" element={<OrderStatusPage />} />
            <Route path="/cart" element={<CartByContext />} />
            <Route path="/checkout/:orderId" element={<CheckoutByRoute />} />
            <Route path="/booking/:orderId" element={<BookingByRoute />} />
            <Route path="/booking" element={<BookingByRoute />} />
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
            <Route path="/staff/:catalogId" element={<StaffPage />} />
            <Route path="/catalogs/:catalogId/access" element={<CatalogAccessPage />} />
            <Route
              path="/catalogs/:catalogId/fulfillment"
              element={<FulfillmentMethodsPage />}
            />
            <Route path="/places" element={<PlacesPage />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function CatalogByRoute() {
  const { catalogId = '' } = useParams<{ catalogId: string }>();
  return <CatalogPage catalogId={catalogId} />;
}

function CheckoutByRoute() {
  const { catalogId } = useParams<{ catalogId?: string }>();
  const fallback = localStorage.getItem('client-current-catalog-id') || '';
  const resolvedCatalogId = catalogId || fallback;
  if (!resolvedCatalogId) return <Navigate to="/" replace />;
  return <CheckoutPage catalogId={resolvedCatalogId} />;
}

function CartByContext() {
  const resolvedCatalogId = localStorage.getItem('client-current-catalog-id') || '';
  if (!resolvedCatalogId) return <Navigate to="/" replace />;
  return <CartPage catalogId={resolvedCatalogId} />;
}

function BookingByRoute() {
  const { catalogId } = useParams<{ catalogId?: string }>();
  const fallback = localStorage.getItem('client-current-catalog-id') || '';
  const resolvedCatalogId = catalogId || fallback;
  if (!resolvedCatalogId) return <Navigate to="/" replace />;
  return <BookingPage catalogId={resolvedCatalogId} />;
}
