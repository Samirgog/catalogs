import React, { useState } from 'react';
import { Receipt, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cart';
import { CatalogHeader, CategorySection, CategoryTabs } from '../components';
import { type CatalogType } from '../../types';
import { useCatalog } from '../hooks/useCatalogs';
import { getCurrentOrder } from '../utils/currentOrder';

type Props = {
  catalogId: string;
};

export const CatalogPage: React.FunctionComponent<Props> = ({ catalogId }) => {
  const navigate = useNavigate();
  const { catalog, isLoading, isError } = useCatalog(catalogId);
  const { getTotalItems, getTotalPrice } = useCartStore();
  const [currentOrderId] = useState<string | null>(
    () => getCurrentOrder()?.id ?? null
  );

  const businessType: CatalogType = catalog?.type ?? 'goods';

  if (isLoading) return <div className="p-4">Загрузка…</div>;
  if (isError) return <div className="p-4">Ошибка</div>;
  if (!catalog) return null;

  const categories = catalog.categories ?? [];
  const itemsCount = getTotalItems();
  const total = getTotalPrice();

  const handleGoToCart = () => {
    navigate('/cart');
  };

  const handleGoToCurrentOrder = () => {
    if (!currentOrderId) return;
    navigate(`/order/${currentOrderId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <CatalogHeader title={catalog.title} bannerUrl={catalog.banner_url} />

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
          className={`fixed right-4 z-50 rounded-full h-14 w-14 bg-primary text-primary-foreground shadow-lg flex items-center justify-center ${
            businessType === 'goods' && itemsCount > 0
              ? 'bottom-24'
              : 'bottom-4'
          }`}
          aria-label="Открыть текущий заказ"
        >
          <Receipt size={22} />
        </button>
      )}
    </div>
  );
};
