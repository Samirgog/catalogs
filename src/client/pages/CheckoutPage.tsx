import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCurrentUser } from '@/useTelegramAuth';
import { useCatalog } from '../hooks/useCatalogs';
import { useCreateOrder, useUpdateOrderStatus } from '../hooks/useOrders';
import { useCartStore } from '../stores/cart';
import { getClientActionOptions } from '../utils/actionOptions';

type Props = {
  catalogId: string;
};

export function CheckoutPage({ catalogId }: Props) {
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const { catalog, isLoading } = useCatalog(catalogId);
  const { createOrder } = useCreateOrder();
  const { updateStatus } = useUpdateOrderStatus();
  const { items, getTotalPrice, clearCart } = useCartStore();

  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = getTotalPrice();
  const actionOptions = useMemo(
    () => getClientActionOptions(catalog?.actions),
    [catalog?.actions]
  );

  const selectedAction =
    actionOptions.find(option => option.id === selectedActionId) ??
    actionOptions[0] ??
    null;
  const selectedActionValue = selectedAction?.id ?? '';

  const handleBack = () => {
    if (isSubmitting) return;
    navigate(-1);
  };

  const createOrderAndOpenStatus = async (markAsPaid: boolean) => {
    if (!catalog || !selectedAction || items.length === 0) return;

    const order = await createOrder({
      catalog_id: catalog.id,
      customer_id: userId || 'anonymous',
      items: items.map(cartItem => ({
        item_id: cartItem.item.id,
        category_id: cartItem.item.category_id,
        title: cartItem.item.title,
        price: cartItem.item.price ?? 0,
        quantity: cartItem.quantity,
      })),
      total_price: total,
    });

    if (markAsPaid) {
      await updateStatus(order.id, 'paid');
    }

    clearCart();
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
        err instanceof Error ? err.message : 'Не удалось оформить заказ'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="glass-card rounded-xl p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold">Корзина пуста</h2>
          <p className="text-sm text-muted-foreground">
            Добавьте товары в корзину, чтобы перейти к оформлению.
          </p>
          <Button className="w-full" onClick={() => navigate('/catalog')}>
            В каталог
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
        : `Оформить заказ на ${total.toFixed(0)} ₽`;

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
            <CardTitle>Состав заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map(cartItem => (
                <div
                  key={cartItem.item.id}
                  className="flex justify-between py-2 border-b border-border/20 last:border-0"
                >
                  <div>
                    <span className="font-medium">{cartItem.item.title}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      × {cartItem.quantity}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {(cartItem.item.price || 0) * cartItem.quantity} ₽
                  </span>
                </div>
              ))}
              <div className="pt-3 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Итого:</span>
                  <span>{total.toFixed(0)} ₽</span>
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
