import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useTelegramNavigation } from '@/hooks/useTelegramNavigation';
import { useCatalogsByPlace, usePlace } from '../hooks/useCatalogs';
import { getCurrentOrders } from '../utils/currentOrder';
import { FloatingOrdersButton } from '../components/FloatingOrdersButton';
import { getTelegramWebApp } from '@/lib/telegram';

type Props = {
  placeId: string;
};

export function FoodcourtCatalogsPage({ placeId }: Props) {
  const navigate = useNavigate();
  const { setShowBackButton } = useTelegramNavigation('/');
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const { catalogs, isLoading, isError } = useCatalogsByPlace(placeId || null);
  const { place } = usePlace(placeId || null);

  useEffect(() => {
    localStorage.setItem('client-current-place-id', placeId);
  }, [placeId]);

  useEffect(() => {
    setShowBackButton(false);
    return () => setShowBackButton(false);
  }, [setShowBackButton]);

  useEffect(() => {
    const syncOrders = () => {
      const orders = getCurrentOrders();
      setLastOrderId(orders[0]?.id || null);
    };
    syncOrders();
    const interval = window.setInterval(syncOrders, 3000);
    return () => window.clearInterval(interval);
  }, []);

  const handleCloseApp = () => {
    getTelegramWebApp()?.close?.();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4">Не удалось загрузить фудкорт</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 overflow-hidden border-x-0 border-t-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{place?.name || 'Пространство'}</h1>
            {place?.address && (
              <p className="mt-1 text-sm text-white/80">{place.address}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleCloseApp}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/90 backdrop-blur"
          >
            Закрыть
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {catalogs.length === 0 && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              В этом фудкорте пока нет активных каталогов.
            </CardContent>
          </Card>
        )}
        {catalogs.map(catalog => (
          <button
            key={catalog.id}
            type="button"
            className="w-full text-left"
            onClick={() =>
              navigate(`/catalog/${catalog.id}`, {
                state: { fromFoodcourt: true, placeId },
              })
            }
          >
            <Card className="overflow-hidden">
              {catalog.banner_url && (
                <img
                  src={catalog.banner_url}
                  alt={catalog.title}
                  className="w-full h-32 object-cover"
                />
              )}
              <CardContent className="p-4">
                <p className="font-semibold">{catalog.title}</p>
                {catalog.address && (
                  <p className="text-xs text-muted-foreground mt-1">{catalog.address}</p>
                )}
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {lastOrderId && (
        <FloatingOrdersButton
          onClick={() => navigate(`/order/${lastOrderId}`)}
          className="bottom-4"
        />
      )}
    </div>
  );
}
