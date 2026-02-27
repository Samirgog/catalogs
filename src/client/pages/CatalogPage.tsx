import React, { useEffect, useState } from 'react';
import { Receipt, ShoppingCart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cart';
import { CatalogHeader, CategorySection, CategoryTabs } from '../components';
import { type CatalogType } from '../../types';
import { useCatalog } from '../hooks/useCatalogs';
import { getCurrentOrder } from '../utils/currentOrder';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useTelegramNavigation } from '@/hooks/useTelegramNavigation';

type Props = {
  catalogId: string;
};

export const CatalogPage: React.FunctionComponent<Props> = ({ catalogId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromFoodcourt = Boolean(
    (location.state as { fromFoodcourt?: boolean } | null)?.fromFoodcourt
  );
  const { setShowBackButton } = useTelegramNavigation('/foodcourt');
  const { catalog, isLoading, isError } = useCatalog(catalogId);
  const { getTotalItems, getTotalPrice } = useCartStore();
  const [currentOrderId] = useState<string | null>(
    () => {
      const current = getCurrentOrder();
      if (!current) return null;
      if (current.catalogId !== catalogId) return null;
      return current.id;
    }
  );

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
    const direct = new URLSearchParams(window.location.search).get('table');
    const hashQueryRaw = window.location.hash.split('?')[1] || '';
    const hashTable = new URLSearchParams(hashQueryRaw).get('table');
    const table = (direct || hashTable || '').trim();
    if (table) {
      localStorage.setItem('client-table-number', table);
    }
    localStorage.setItem('client-current-catalog-id', catalogId);
  }, []);

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
    if (!currentOrderId) return;
    navigate(`/order/${currentOrderId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <CatalogHeader
        title={catalog.title}
        bannerUrl={catalog.banner_url}
        address={catalog.address}
        workTimeText={workTimeText}
      />

      <CategoryTabs
        categories={categories.map(c => ({
          id: c.id,
          title: c.title,
        }))}
      />

      <div className="p-4 space-y-6 pb-28">
        {categories.map(c => (
          <CategorySection
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

      {currentOrderId && (
        <button
          onClick={handleGoToCurrentOrder}
          className={`fixed right-4 z-50 rounded-2xl h-14 px-4 bg-primary text-primary-foreground shadow-lg flex items-center justify-center gap-2 ${
            businessType === 'goods' && itemsCount > 0
              ? 'bottom-24'
              : 'bottom-4'
          }`}
          aria-label="Открыть текущий заказ"
        >
          <Receipt size={22} />
          <span className="text-sm font-medium">Заказ</span>
        </button>
      )}
    </div>
  );
};
