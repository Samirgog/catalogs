import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCatalog } from '../hooks/useCatalogs';
import { useOrder, useUpdateOrder, useUpdateOrderStatus } from '../hooks/useOrders';
import { getClientActionOptions } from '../utils/actionOptions';
import { getReadableOrderNumber, setCurrentOrder } from '../utils/currentOrder';
import { useCurrentUser } from '@/useTelegramAuth';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { toast } from 'sonner';
import {
  appendTelegramTextParam,
  buildTelegramOrderMessage,
  getFlowLabels,
} from '../utils/presentation';
import type { FulfillmentMethodType } from '@/types';
import { Spinner } from '@/components/ui/spinner';

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
  const { user } = useCurrentUser();
  const { orderId } = useParams<{ orderId: string }>();
  const { catalog, isLoading } = useCatalog(catalogId);
  const {
    order,
    isLoading: isOrderLoading,
    isError: isOrderError,
  } = useOrder(orderId ?? null);
  const { updateStatus } = useUpdateOrderStatus();
  const { updateOrder } = useUpdateOrder();
  useAutoBackButton('/cart');

  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFulfillment, setSelectedFulfillment] =
    useState<FulfillmentMethodType>('pickup');
  const [customerName, setCustomerName] = useState(
    user?.first_name || user?.username || ''
  );
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerComment, setCustomerComment] = useState('');

  useEffect(() => {
    if (customerName) return;
    const fallbackName = user?.first_name || user?.username || '';
    if (fallbackName) {
      setCustomerName(fallbackName);
    }
  }, [customerName, user?.first_name, user?.username]);

  const actionOptions = useMemo(
    () => getClientActionOptions(catalog?.actions),
    [catalog?.actions]
  );
  const labels = getFlowLabels(catalog?.type ?? 'goods');
  const fulfillmentOptions = useMemo(
    () =>
      (catalog?.fulfillment_methods ?? [])
        .filter(method => method.is_enabled)
        .map(method => method.method),
    [catalog?.fulfillment_methods]
  );

  useEffect(() => {
    if (fulfillmentOptions.length === 0) return;
    if (fulfillmentOptions.includes(selectedFulfillment)) return;
    setSelectedFulfillment(fulfillmentOptions[0]);
  }, [fulfillmentOptions, selectedFulfillment]);

  const selectedAction =
    actionOptions.find(option => option.id === selectedActionId) ??
    actionOptions[0] ??
    null;
  const selectedActionValue = selectedAction?.id ?? '';
  const orderItems = useMemo(() => asItems(order?.items), [order?.items]);
  const readableOrderNumber = order ? getReadableOrderNumber(order) : '';
  const sellerTelegramLink = useMemo(() => {
    const raw = catalog?.emergency_telegram?.trim();
    if (!raw) return '';
    if (raw.startsWith('https://') || raw.startsWith('http://')) return raw;
    if (raw.startsWith('@')) return `https://t.me/${raw.slice(1)}`;
    if (raw.startsWith('t.me/')) return `https://${raw}`;
    if (/^[a-zA-Z0-9_]{5,}$/.test(raw)) return `https://t.me/${raw}`;
    return raw;
  }, [catalog?.emergency_telegram]);

  const handleBack = () => {
    if (isSubmitting) return;
    navigate(-1);
  };

  const handleSubmit = async () => {
    if (!order || !selectedAction || !catalog) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (selectedAction.kind === 'payment_in_chat') {
        if (!selectedAction.telegramUrl) {
          setError('Ссылка на Telegram не настроена продавцом.');
          toast.error('Ссылка на Telegram не настроена продавцом');
          return;
        }
        await updateOrder(order.id, {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_comment: customerComment.trim(),
          fulfillment_method: selectedFulfillment,
        });
        await updateStatus(order.id, 'submitted');
        setCurrentOrder(order);
        const message = buildTelegramOrderMessage({
          catalogType: catalog.type,
          order: { ...order, fulfillment_method: selectedFulfillment },
        });
        const link = appendTelegramTextParam(selectedAction.telegramUrl, message);
        toast.success('Переход в Telegram');
        window.location.href = link;
        return;
      }

      await updateOrder(order.id, {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_comment: customerComment.trim(),
        fulfillment_method: selectedFulfillment,
      });

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
      toast.success('Статус заказа обновлен');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Не удалось оформить ${labels.orderWord.toLowerCase()}`
      );
      toast.error(`Не удалось оформить ${labels.orderWord.toLowerCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isOrderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
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
          <h2 className="text-lg font-semibold">{labels.orderWord} не найден</h2>
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
        : labels.submitLabel;

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
        <h1 className="text-lg font-semibold ml-2 flex-1">{labels.checkoutTitle}</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {error && (
          <div className="glass-card p-3 text-sm text-red-600">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Контактные данные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="checkout-name" className="block mb-2">
                Имя
              </Label>
              <Input
                id="checkout-name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ваше имя"
              />
            </div>
            <div>
              <Label htmlFor="checkout-phone" className="block mb-2">
                Телефон
              </Label>
              <Input
                id="checkout-phone"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="+7 900 000-00-00"
              />
            </div>
            <div>
              <Label htmlFor="checkout-comment" className="block mb-2">
                Комментарий
              </Label>
              <Textarea
                id="checkout-comment"
                value={customerComment}
                onChange={e => setCustomerComment(e.target.value)}
                placeholder="Комментарий к заказу"
              />
            </div>
          </CardContent>
        </Card>

        {(catalog.emergency_phone || catalog.emergency_telegram) && (
          <Card>
            <CardHeader>
              <CardTitle>Контакты продавца</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {catalog.emergency_phone && (
                <p>
                  Телефон:{' '}
                  <a
                    href={`tel:${catalog.emergency_phone}`}
                    className="underline"
                  >
                    {catalog.emergency_phone}
                  </a>
                </p>
              )}
              {catalog.emergency_telegram && (
                <p>
                  Telegram:{' '}
                  {sellerTelegramLink ? (
                    <a
                      href={sellerTelegramLink}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {catalog.emergency_telegram}
                    </a>
                  ) : (
                    <span>{catalog.emergency_telegram}</span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {labels.orderWord} №{readableOrderNumber}
            </CardTitle>
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

        {fulfillmentOptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Способ получения</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedFulfillment}
                onValueChange={value =>
                  setSelectedFulfillment(value as FulfillmentMethodType)
                }
                className="space-y-3"
              >
                {fulfillmentOptions.includes('pickup') && (
                  <Label className="block w-full rounded-xl p-4 glass-card cursor-pointer">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="pickup" className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">Самовывоз</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Заберу {labels.orderWord.toLowerCase()} самостоятельно
                        </p>
                      </div>
                    </div>
                  </Label>
                )}
                {fulfillmentOptions.includes('delivery') && (
                  <Label className="block w-full rounded-xl p-4 glass-card cursor-pointer">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="delivery" className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">Доставка</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Привезите {labels.orderWord.toLowerCase()} по адресу
                        </p>
                      </div>
                    </div>
                  </Label>
                )}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Способ оформления</CardTitle>
          </CardHeader>
          <CardContent>
            {actionOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Владелец каталога пока не настроил способы оформления.
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
