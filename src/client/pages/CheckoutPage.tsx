import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCatalog } from '../hooks/useCatalogs';
import { useOrder, useUpdateOrderStatus } from '../hooks/useOrders';
import { getClientActionOptions } from '../utils/actionOptions';
import { getReadableOrderNumber, setCurrentOrder } from '../utils/currentOrder';

type Props = {
  catalogId: string;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
};

const asItems = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

export function CheckoutPage({ catalogId }: Props) {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { catalog, isLoading } = useCatalog(catalogId);
  const {
    order,
    isLoading: isOrderLoading,
    isError: isOrderError,
  } = useOrder(orderId ?? null);
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
  const selectedActionValue = selectedAction?.id ?? '';
  const orderItems = useMemo(() => asItems(order?.items), [order?.items]);
  const readableOrderNumber = order ? getReadableOrderNumber(order) : '';

  const handleBack = () => {
    if (isSubmitting) return;
    navigate(-1);
  };

  const handleSubmit = async () => {
    if (!order || !selectedAction) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (selectedAction.kind === 'payment_in_chat') {
        if (!selectedAction.telegramUrl) {
          setError('Ссылка на Telegram не настроена продавцом.');
          return;
        }
        await updateStatus(order.id, 'submitted');
        setCurrentOrder(order);
        window.location.href = selectedAction.telegramUrl;
        return;
      }

      if (selectedAction.kind === 'light_sbp') {
        await updateStatus(order.id, 'payment_reported');
      } else {
        await updateStatus(order.id, 'submitted');
      }

      setCurrentOrder(order);
      navigate(`/order/${order.id}`, {
        replace: true,
        state: { action: selectedAction },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Не удалось оформить заказ'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isOrderLoading) {
    return <div className="p-4">Загрузка…</div>;
  }

  if (!catalog) {
    return <div className="p-4">Каталог не найден</div>;
  }

  if (catalog.type !== 'goods') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="glass-card rounded-xl p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold">Страница недоступна</h2>
          <p className="text-sm text-muted-foreground">
            Для услуг оформление выполняется со страницы выбранной услуги.
          </p>
          <Button className="w-full" onClick={() => navigate('/catalog')}>
            Вернуться в каталог
          </Button>
        </div>
      </div>
    );
  }

  if (!orderId || !order || isOrderError) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="glass-card rounded-xl p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold">Заказ не найден</h2>
          <p className="text-sm text-muted-foreground">
            Вернитесь в корзину и начните оформление заново.
          </p>
          <Button className="w-full" onClick={() => navigate('/cart')}>
            Вернуться в корзину
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
        : 'Подтвердить заказ';

  return (
    <div className="min-h-screen flex flex-col bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2 flex-1">Оформление заказа</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {error && (
          <div className="glass-card p-3 text-sm text-red-600">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Заказ №{readableOrderNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderItems.map((item, index) => {
                const title = String(item.title ?? 'Позиция');
                const quantity = Number(item.quantity ?? 1);
                const price = Number(item.price ?? 0);
                return (
                  <div
                    key={`${title}-${index}`}
                    className="flex justify-between py-2 border-b border-border/20 last:border-0"
                  >
                    <div>
                      <span className="font-medium">{title}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        × {quantity}
                      </span>
                    </div>
                    <span className="font-semibold">{price * quantity} ₽</span>
                  </div>
                );
              })}
              <div className="pt-3 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Итого:</span>
                  <span>{order.total_price.toFixed(0)} ₽</span>
                </div>
              </div>
            </div>
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
              <RadioGroup
                value={selectedActionValue}
                onValueChange={setSelectedActionId}
                className="space-y-3"
              >
                {actionOptions.map(option => (
                  <Label
                    key={option.id}
                    htmlFor={`checkout-action-${option.id}`}
                    className={`block w-full rounded-xl p-4 glass-card cursor-pointer ${
                      selectedActionValue === option.id
                        ? 'ring-2 ring-primary'
                        : 'ring-0'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        id={`checkout-action-${option.id}`}
                        value={option.id}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                        {selectedActionValue === option.id &&
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
                              <p className="font-medium text-foreground">
                                Назначение платежа: {readableOrderNumber}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
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
          className="w-full h-14 text-base"
          onClick={handleSubmit}
          disabled={isSubmitting || actionOptions.length === 0}
        >
          {actionButtonLabel}
        </Button>
      </div>
    </div>
  );
}
