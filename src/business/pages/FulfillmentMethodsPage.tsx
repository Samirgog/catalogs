import { useMemo, useState } from 'react';
import { Truck, Store } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { useFulfillmentMethods } from '../hooks/useFulfillment';
import { toast } from 'sonner';

export function FulfillmentMethodsPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  useAutoBackButton(catalogId ? `/catalogs/${catalogId}/edit` : '/catalogs');

  const [savingMethod, setSavingMethod] = useState<string | null>(null);
  const { methods, loading, error, setMethodEnabled } = useFulfillmentMethods(
    catalogId ?? ''
  );

  const pickupEnabled = useMemo(
    () => methods.find(m => m.method === 'pickup')?.is_enabled ?? false,
    [methods]
  );
  const deliveryEnabled = useMemo(
    () => methods.find(m => m.method === 'delivery')?.is_enabled ?? false,
    [methods]
  );

  if (!catalogId) {
    return <div className="p-4">Отсутствует идентификатор каталога.</div>;
  }

  const handleToggle = async (method: 'pickup' | 'delivery', value: boolean) => {
    try {
      setSavingMethod(method);
      await setMethodEnabled(method, value);
      toast.success('Способы получения обновлены');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Не удалось обновить настройки'
      );
    } finally {
      setSavingMethod(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <h1 className="text-2xl font-bold">Способы получения</h1>
      </div>

      <div className="p-4 space-y-4">
        {loading && <div className="glass-card p-3 text-sm">Загрузка...</div>}
        {error && <div className="glass-card p-3 text-sm text-red-600">{error}</div>}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Самовывоз
              </span>
              <Switch
                checked={pickupEnabled}
                disabled={savingMethod === 'pickup'}
                onCheckedChange={checked => handleToggle('pickup', checked)}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Клиент сам приезжает и получает заказ в вашей точке.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Доставка
              </span>
              <Switch
                checked={deliveryEnabled}
                disabled={savingMethod === 'delivery'}
                onCheckedChange={checked => handleToggle('delivery', checked)}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Клиент сможет выбрать доставку при оформлении.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 left-4 right-4">
        <Button
          className="w-full h-12"
          onClick={() => navigate(`/catalogs/${catalogId}/edit`)}
        >
          Вернуться в каталог
        </Button>
      </div>
    </div>
  );
}
