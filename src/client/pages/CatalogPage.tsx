import React, { useEffect, useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cart';
import { useFavoritesStore } from '../stores/favorites';
import { CatalogHeader, CategorySection, CategoryTabs } from '../components';
import { type CatalogType } from '../../types';
import { useCatalog } from '../hooks/useCatalogs';
import { getCurrentOrdersByCatalog } from '../utils/currentOrder';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useTelegramNavigation } from '@/hooks/useTelegramNavigation';
import { FloatingOrdersButton } from '../components/FloatingOrdersButton';
import { useCurrentUser } from '@/useTelegramAuth';
import { customerIntelligenceService } from '../services/customerIntelligence';

type Props = {
  catalogId: string;
};

export const CatalogPage: React.FunctionComponent<Props> = ({ catalogId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useCurrentUser();
  const fromFoodcourt = Boolean(
    (location.state as { fromFoodcourt?: boolean } | null)?.fromFoodcourt
  );
  const { setShowBackButton } = useTelegramNavigation('/foodcourt');
  const { catalog, isLoading, isError } = useCatalog(catalogId);
  const { getTotalItems, getTotalPrice } = useCartStore();
  const favoritesCount = useFavoritesStore((state) => state.getFavorites(catalogId).length);
  const [ordersCount, setOrdersCount] = useState(0);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const businessType: CatalogType = catalog?.type ?? 'goods';
  const formatTime = (value?: string) => {
    if (!value) return '';
    const parts = value.split(':');
    if (parts.length < 2) return value;
    return `${parts[0]}:${parts[1]}`;
  };

  useEffect(() => {
    if (!isError) return;
    toast.error('Не удалось загрузить каталог');
  }, [isError]);

  useEffect(() => {
    setShowBackButton(fromFoodcourt);
    return () => setShowBackButton(false);
  }, [fromFoodcourt, setShowBackButton]);

  useEffect(() => {
    if (!fromFoodcourt) return;
    const state = location.state as { placeId?: string } | null;
    if (state?.placeId) {
      localStorage.setItem('client-current-place-id', state.placeId);
    }
  }, [fromFoodcourt, location.state]);

  useEffect(() => {
    const direct = new URLSearchParams(window.location.search).get('table');
    const hashQueryRaw = window.location.hash.split('?')[1] || '';
    const hashTable = new URLSearchParams(hashQueryRaw).get('table');
    const table = (direct || hashTable || '').trim();
    if (table) {
      localStorage.setItem('client-table-number', table);
    }
    localStorage.setItem('client-current-catalog-id', catalogId);
  }, [catalogId]);

  useEffect(() => {
    void customerIntelligenceService.trackCatalogVisit(catalogId, userId);
  }, [catalogId, userId]);

  useEffect(() => {
    const syncOrders = () => {
      const refs = getCurrentOrdersByCatalog(catalogId);
      setOrdersCount(refs.length);
      setLastOrderId(refs[0]?.id || null);
    };
    syncOrders();
    const interval = window.setInterval(syncOrders, 3000);
    return () => window.clearInterval(interval);
  }, [catalogId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }
  if (isError) return <div className="p-4">Ошибка</div>;
  if (!catalog) return null;

  const categories = catalog.categories ?? [];
  const itemsCount = getTotalItems();
  const total = getTotalPrice();
  const workTimeText = catalog.is_open_24_7
    ? '24/7'
    : catalog.work_start && catalog.work_end
      ? `${formatTime(catalog.work_start)} - ${formatTime(catalog.work_end)}`
      : '';

  const handleGoToCart = () => {
    navigate('/cart');
  };

  const handleGoToCurrentOrder = () => {
    if (!lastOrderId) return;
    navigate(`/order/${lastOrderId}`);
  };

  const handleGoToFavorites = () => {
    navigate('/favorites');
  };

  return (
    <div className="min-h-screen bg-background">
      <CatalogHeader
        title={catalog.title}
        bannerUrl={catalog.banner_url}
        address={catalog.address}
        workTimeText={workTimeText}
      />

      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={handleGoToFavorites}
          className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 flex items-center justify-between"
        >
          <span className="flex items-center gap-2 font-medium">
            <Heart className="h-4 w-4 text-rose-500" />
            Избранное
          </span>
          <span className="text-sm text-muted-foreground">
            {favoritesCount} товаров
          </span>
        </button>
      </div>

      <CategoryTabs
        categories={categories.map(c => ({
          id: c.id,
          title: c.title,
        }))}
      />

      <div className="p-4 space-y-6 pb-28">
        {categories.map(c => (
          <CategorySection
            catalogId={catalogId}
            key={c.id}
            id={c.id}
            title={c.title}
            items={c.items ?? []}
            businessType={businessType}
            businessSubtype={catalog.subtype}
          />
        ))}
      </div>

      {businessType === 'goods' && itemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <button
            onClick={handleGoToCart}
            className="
                            w-full h-14
                            rounded-2xl
                            bg-primary
                            text-primary-foreground
                            flex items-center justify-between
                            px-5
                          "
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <ShoppingCart size={18} />
              </div>
              <span className="font-medium">Корзина · {itemsCount}</span>
            </div>

            <span className="text-lg font-semibold">{total} ₽</span>
          </button>
        </div>
      )}

      {ordersCount > 0 && lastOrderId && (
        <FloatingOrdersButton
          count={ordersCount}
          onClick={handleGoToCurrentOrder}
          className={
            businessType === 'goods' && itemsCount > 0
              ? 'bottom-[5.25rem]'
              : 'bottom-4'
          }
        />
      )}
    </div>
  );
};
