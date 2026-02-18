import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/useTelegramAuth';
import { useCatalog } from '../hooks/useCatalogs';
import { useCreateOrder, useUpdateOrderStatus } from '../hooks/useOrders';
import { useBookingStore } from '../stores/booking';
import { getClientActionOptions } from '../utils/actionOptions';

type Props = {
  catalogId: string;
};

export function BookingPage({ catalogId }: Props) {
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const { selectedItem, clearSelectedItem } = useBookingStore();
  const { catalog, isLoading } = useCatalog(catalogId);
  const { createOrder } = useCreateOrder();
  const { updateStatus } = useUpdateOrderStatus();

  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionOptions = useMemo(
    () => getClientActionOptions(catalog?.actions),
    [catalog?.actions]
  );

  const selectedAction =
    actionOptions.find(option => option.id === selectedActionId) ??
    actionOptions[0] ??
    null;

  const handleBack = () => {
    if (isSubmitting) return;
    navigate(-1);
  };

  const createOrderAndOpenStatus = async (markAsPaid: boolean) => {
    if (!catalog || !selectedItem || !selectedAction) return;

    const order = await createOrder({
      catalog_id: catalog.id,
      customer_id: userId || 'anonymous',
      items: [
        {
          item_id: selectedItem.id,
          category_id: selectedItem.category_id,
          title: selectedItem.title,
          price: selectedItem.price ?? 0,
          quantity: 1,
        },
      ],
      total_price: selectedItem.price ?? 0,
    });

    if (markAsPaid) {
      await updateStatus(order.id, 'paid');
    }

    clearSelectedItem();
    navigate(`/order/${order.id}`, {
      replace: true,
      state: { action: selectedAction },
    });
  };

  const handleSubmit = async () => {
    if (!selectedAction) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (selectedAction.kind === 'payment_in_chat') {
        if (!selectedAction.telegramUrl) {
          setError('Ссылка на Telegram не настроена продавцом.');
          return;
        }
        window.location.href = selectedAction.telegramUrl;
        return;
      }

      if (selectedAction.kind === 'light_sbp') {
        await createOrderAndOpenStatus(true);
        return;
      }

      await createOrderAndOpenStatus(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Не удалось оформить запись'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-4">Загрузка…</div>;
  if (!catalog) return <div className="p-4">Каталог не найден</div>;

  if (catalog.type !== 'services') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="glass-card rounded-xl p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold">Страница недоступна</h2>
          <p className="text-sm text-muted-foreground">
            Запись доступна только для каталогов услуг.
          </p>
          <Button className="w-full" onClick={() => navigate('/catalog')}>
            Вернуться в каталог
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedItem) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="glass-card rounded-xl p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold">Услуга не выбрана</h2>
          <p className="text-sm text-muted-foreground">
            Перейдите в каталог и выберите услугу для оформления.
          </p>
          <Button className="w-full" onClick={() => navigate('/catalog')}>
            Вернуться в каталог
          </Button>
        </div>
      </div>
    );
  }

  const isSbpSelected = selectedAction?.kind === 'light_sbp';
  const actionButtonLabel = isSubmitting
    ? 'Выполняем...'
    : selectedAction?.kind === 'payment_in_chat'
      ? 'Написать в Telegram'
      : selectedAction?.kind === 'light_sbp'
        ? 'Я оплатил'
        : 'Подтвердить запись';

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-background">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2 flex-1">Запись на услугу</h1>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="glass-card p-3 text-sm text-red-600">{error}</div>
        )}

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-0 gap-2">
            {selectedItem.image_url && (
              <img
                src={selectedItem.image_url}
                alt={selectedItem.title}
                className="w-full h-48 object-cover rounded-xl"
              />
            )}
            <CardTitle className="mt-3 text-xl">{selectedItem.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between pt-3">
            {selectedItem.description && (
              <p className="text-muted-foreground mt-1">
                {selectedItem.description}
              </p>
            )}
            {typeof selectedItem.price === 'number' && (
              <p className="text-xl font-semibold mt-3">
                {selectedItem.price} ₽
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Способ оформления</CardTitle>
          </CardHeader>
          <CardContent>
            {actionOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Владелец каталога пока не настроил способы оформления заказа.
              </p>
            ) : (
              <div className="space-y-3">
                {actionOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    className={`w-full text-left rounded-xl p-4 glass-card ${
                      (selectedAction?.id ?? actionOptions[0].id) === option.id
                        ? 'border-primary'
                        : 'border-0'
                    }`}
                    onClick={() => setSelectedActionId(option.id)}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                    {(selectedAction?.id ?? actionOptions[0].id) ===
                      option.id &&
                      option.kind === 'light_sbp' && (
                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                          {option.details.bank && (
                            <p>Банк: {option.details.bank}</p>
                          )}
                          {option.details.name && (
                            <p>Имя: {option.details.name}</p>
                          )}
                          {option.details.phone && (
                            <p>Телефон: {option.details.phone}</p>
                          )}
                          {option.details.sbp_link && (
                            <p className="break-all">
                              Ссылка СБП: {option.details.sbp_link}
                            </p>
                          )}
                        </div>
                      )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isSbpSelected && (
          <p className="text-sm text-muted-foreground">
            После перевода нажмите «Я оплатил» для подтверждения оплаты.
          </p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-x-0 border-b-0 p-4 pb-8">
        <Button
          className="w-full h-12"
          onClick={handleSubmit}
          disabled={isSubmitting || actionOptions.length === 0}
        >
          {actionButtonLabel}
        </Button>
      </div>
    </div>
  );
}
