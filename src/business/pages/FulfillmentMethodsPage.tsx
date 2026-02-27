import { useMemo, useState, type ReactNode } from 'react';
import { Home, Store, Truck, TabletSmartphone, UtensilsCrossed, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { useFulfillmentMethods } from '../hooks/useFulfillment';
import { toast } from 'sonner';
import { useCatalog } from '../hooks/useCatalogs';
import type { FulfillmentMethodType } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { BusinessTutorialLauncher } from '../tutorial/BusinessTutorialLauncher';

export function FulfillmentMethodsPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  useAutoBackButton(catalogId ? `/catalogs/${catalogId}/edit` : '/catalogs');

  const [savingMethod, setSavingMethod] = useState<string | null>(null);
  const { methods, loading, error, setMethodEnabled } = useFulfillmentMethods(
    catalogId ?? ''
  );
  const { catalog, loading: catalogLoading } = useCatalog(catalogId ?? '');

  const methodEnabled = (method: FulfillmentMethodType) =>
    methods.find(m => m.method === method)?.is_enabled ?? false;

  const availableMethods = useMemo(() => {
    if (!catalog) return [] as Array<{ id: FulfillmentMethodType; label: string; desc: string; icon: ReactNode }>;
    if (catalog.type === 'goods' && catalog.subtype === 'cafe_restaurant') {
      return [
        {
          id: 'delivery' as FulfillmentMethodType,
          label: 'Доставка',
          desc: 'Привезти заказ клиенту',
          icon: <Truck className="w-5 h-5" />,
        },
        {
          id: 'pickup' as FulfillmentMethodType,
          label: 'Самовывоз',
          desc: 'Клиент забирает заказ сам',
          icon: <Store className="w-5 h-5" />,
        },
        {
          id: 'to_table' as FulfillmentMethodType,
          label: 'К столику',
          desc: 'Доставка по номеру столика в зале',
          icon: <UtensilsCrossed className="w-5 h-5" />,
        },
      ];
    }
    if (catalog.type === 'goods' && catalog.subtype === 'shop') {
      return [
        {
          id: 'delivery' as FulfillmentMethodType,
          label: 'Доставка',
          desc: 'Привезти товар клиенту',
          icon: <Truck className="w-5 h-5" />,
        },
        {
          id: 'pickup' as FulfillmentMethodType,
          label: 'Самовывоз',
          desc: 'Клиент забирает товар в точке',
          icon: <Store className="w-5 h-5" />,
        },
      ];
    }
    if (catalog.type === 'goods' && catalog.subtype === 'digital_store') {
      return [
        {
          id: 'digital' as FulfillmentMethodType,
          label: 'Цифровой продукт',
          desc: 'Выдача цифрового продукта',
          icon: <TabletSmartphone className="w-5 h-5" />,
        },
      ];
    }
    if (catalog.type === 'services' && catalog.subtype === 'studio_club') {
      return [
        {
          id: 'digital' as FulfillmentMethodType,
          label: 'Цифровой вариант',
          desc: 'Онлайн-выдача абонемента/доступа',
          icon: <TabletSmartphone className="w-5 h-5" />,
        },
        {
          id: 'pickup' as FulfillmentMethodType,
          label: 'Самовывоз',
          desc: 'Получение абонемента в точке',
          icon: <Store className="w-5 h-5" />,
        },
      ];
    }
    return [
      {
        id: 'on_site' as FulfillmentMethodType,
        label: 'На месте',
        desc: 'Оказание услуги в вашей точке',
        icon: <Home className="w-5 h-5" />,
      },
      {
        id: 'at_client' as FulfillmentMethodType,
        label: 'У клиента',
        desc: 'Выезд к клиенту по адресу',
        icon: <User className="w-5 h-5" />,
      },
    ];
  }, [catalog]);

  if (!catalogId) {
    return <div className="p-4">Отсутствует идентификатор каталога.</div>;
  }

  const handleToggle = async (method: FulfillmentMethodType, value: boolean) => {
    try {
      if (!value) {
        const enabledCount = availableMethods.filter(m => methodEnabled(m.id)).length;
        if (enabledCount <= 1 && methodEnabled(method)) {
          toast.error('Нужно оставить хотя бы один способ получения');
          return;
        }
      }
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
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Способы получения</h1>
          <BusinessTutorialLauncher />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {(loading || catalogLoading) && (
          <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="glass-card p-4 flex items-center gap-2">
              <Spinner />
              <span>Загрузка...</span>
            </div>
          </div>
        )}
        {error && <div className="glass-card p-3 text-sm text-red-600">{error}</div>}
        {availableMethods.map(option => (
          <Card key={option.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </span>
                <Switch
                  checked={methodEnabled(option.id)}
                  disabled={savingMethod === option.id}
                  onCheckedChange={checked => handleToggle(option.id, checked)}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{option.desc}</p>
            </CardContent>
          </Card>
        ))}
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
