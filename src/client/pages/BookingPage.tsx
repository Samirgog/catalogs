import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/useTelegramAuth';
import { useCatalog } from '../hooks/useCatalogs';
import {
  useCreateOrder,
  useOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
} from '../hooks/useOrders';
import { useBookingStore } from '../stores/booking';
import { getClientActionOptions } from '../utils/actionOptions';
import { setCurrentOrder } from '../utils/currentOrder';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { toast } from 'sonner';
import {
  appendTelegramTextParam,
  buildTelegramOrderMessage,
  getFlowLabels,
  getFulfillmentLabel,
  requiresAddressForFulfillment,
} from '../utils/presentation';
import type { FulfillmentMethodType } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { useAddressSuggestions } from '@/hooks/useAddressSuggestions';

type Props = {
  catalogId: string;
};

export function BookingPage({ catalogId }: Props) {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId?: string }>();
  const { userId, user } = useCurrentUser();
  const { selectedItem, clearSelectedItem } = useBookingStore();
  const { catalog, isLoading } = useCatalog(catalogId);
  const { createOrder } = useCreateOrder();
  const { updateOrder } = useUpdateOrder();
  const { updateStatus } = useUpdateOrderStatus();
  const { order, isLoading: isOrderLoading } = useOrder(orderId ?? null);
  useAutoBackButton('/catalog');

  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [selectedFulfillment, setSelectedFulfillment] =
    useState<FulfillmentMethodType>('pickup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(
    user?.first_name || user?.username || ''
  );
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerComment, setCustomerComment] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(
    () => localStorage.getItem('client-last-delivery-address') || ''
  );
  const [tableNumber, setTableNumber] = useState(
    () => localStorage.getItem('client-table-number') || ''
  );
  const addressSuggestions = useAddressSuggestions(deliveryAddress);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

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
  const labels = getFlowLabels(catalog?.type ?? 'services');
  const fulfillmentOptions = useMemo(
    () => {
      const all = (catalog?.fulfillment_methods ?? [])
        .filter(method => method.is_enabled)
        .map(method => method.method);

      if (!catalog) return all;
      if (catalog.type === 'goods' && catalog.subtype === 'shop') {
        return all.filter(method => method === 'pickup' || method === 'delivery');
      }
      if (catalog.type === 'goods' && catalog.subtype === 'cafe_restaurant') {
        return all.filter(
          method =>
            method === 'pickup' ||
            method === 'delivery' ||
            method === 'to_table'
        );
      }
      if (catalog.type === 'goods' && catalog.subtype === 'digital_store') {
        return all.filter(method => method === 'digital');
      }
      if (catalog.type === 'services') {
        if (catalog.subtype === 'studio_club') {
          return all.filter(method => method === 'digital' || method === 'pickup');
        }
        return all.filter(method => method === 'on_site' || method === 'at_client');
      }
      return all;
    },
    [catalog]
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

  const createDraftOrder = async () => {
    if (!catalog || !selectedItem) return null;
    const draft = await createOrder({
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
      status: 'created',
    });
    setCurrentOrder(draft);
    return draft;
  };

  const createOrderAndOpenStatus = async (reportPayment: boolean) => {
    if (!catalog || !selectedAction || !order) return;

    await updateOrder(order.id, {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_comment: customerComment.trim(),
      fulfillment_method: selectedFulfillment,
      table_number: selectedFulfillment === 'to_table' ? tableNumber.trim() : undefined,
      delivery_address: requiresAddressForFulfillment(selectedFulfillment)
        ? deliveryAddress.trim()
        : undefined,
      payment_method: selectedAction.kind,
    });

    if (reportPayment) {
      await updateStatus(order.id, 'payment_reported');
    } else {
      await updateStatus(order.id, 'submitted');
    }
    if (
      requiresAddressForFulfillment(selectedFulfillment) &&
      deliveryAddress.trim()
    ) {
      localStorage.setItem(
        'client-last-delivery-address',
        deliveryAddress.trim()
      );
    }
    if (selectedFulfillment === 'to_table' && tableNumber.trim()) {
      localStorage.setItem('client-table-number', tableNumber.trim());
    }

    setCurrentOrder(order);
    clearSelectedItem();
    navigate(`/order/${order.id}`, {
      replace: true,
      state: { action: selectedAction },
    });
    toast.success(`${labels.orderWord} оформлена`);
  };

  const handleSubmit = async () => {
    if (!catalog || !selectedAction || !order) return;

    try {
      setIsSubmitting(true);
      setError(null);
      if (
        requiresAddressForFulfillment(selectedFulfillment) &&
        !deliveryAddress.trim()
      ) {
        toast.error('Укажите адрес');
        return;
      }
      if (selectedFulfillment === 'to_table' && !tableNumber.trim()) {
        toast.error('Укажите номер столика');
        return;
      }
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
          table_number: selectedFulfillment === 'to_table' ? tableNumber.trim() : undefined,
          delivery_address: requiresAddressForFulfillment(selectedFulfillment)
            ? deliveryAddress.trim()
            : undefined,
          payment_method: selectedAction.kind,
        });
        await updateStatus(order.id, 'submitted');
        setCurrentOrder(order);
        clearSelectedItem();
        const message = buildTelegramOrderMessage({
          catalogType: catalog.type,
          order: {
            ...order,
            fulfillment_method: selectedFulfillment,
            delivery_address: requiresAddressForFulfillment(selectedFulfillment)
              ? deliveryAddress.trim()
              : undefined,
          },
        });
        const link = appendTelegramTextParam(selectedAction.telegramUrl, message);
        toast.success('Переход в Telegram');
        window.location.href = link;
        return;
      }

      if (selectedAction.kind === 'light_sbp') {
        await createOrderAndOpenStatus(true);
        return;
      }

      await createOrderAndOpenStatus(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Не удалось оформить ${labels.orderWord.toLowerCase()}`
      );
      toast.error(`Не удалось оформить ${labels.orderWord.toLowerCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || (orderId && isOrderLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }
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

  const selectedItemData = selectedItem || (order?.items?.[0] as any);

  if (!selectedItemData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="glass-card rounded-xl p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold">{labels.itemWord} не выбрана</h2>
          <p className="text-sm text-muted-foreground">
            Перейдите в каталог и выберите {labels.itemWord.toLowerCase()} для оформления.
          </p>
          <Button className="w-full" onClick={() => navigate('/catalog')}>
            Вернуться в каталог
          </Button>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background p-4 pb-28">
        <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0 flex items-center">
          <h1 className="text-lg font-semibold ml-2 flex-1">Выбранная услуга</h1>
        </div>
        <Card className="mt-4 glass-card overflow-hidden">
          <CardHeader className="pb-0 gap-2">
            {selectedItemData.image_url && (
              <img
                src={selectedItemData.image_url}
                alt={selectedItemData.title}
                className="w-full h-48 object-cover rounded-xl"
              />
            )}
            <CardTitle className="mt-3 text-xl">{selectedItemData.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {selectedItemData.description && (
              <p className="text-muted-foreground">{selectedItemData.description}</p>
            )}
            {typeof selectedItemData.price === 'number' && (
              <p className="text-xl font-semibold">{selectedItemData.price} ₽</p>
            )}
            <Button
              className="w-full h-12 mt-2"
              onClick={async () => {
                const draft = await createDraftOrder();
                if (!draft) return;
                navigate(`/booking/${draft.id}`);
              }}
            >
              Перейти к оплате
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSbpSelected = selectedAction?.kind === 'light_sbp';
  const shouldShowAddressField = requiresAddressForFulfillment(
    selectedFulfillment
  );
  const actionButtonLabel = isSubmitting
    ? 'Выполняем...'
    : selectedAction?.kind === 'payment_in_chat'
      ? 'Написать в Telegram'
      : selectedAction?.kind === 'light_sbp'
        ? 'Я оплатил'
        : labels.submitLabel;
  const paymentPurpose = order
    ? order.order_number || order.id.slice(0, 8).toUpperCase()
    : 'номер заказа';

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-background">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0 flex items-center">
        <h1 className="text-lg font-semibold ml-2 flex-1">{labels.checkoutTitle}</h1>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="glass-card p-3 text-sm text-red-600">{error}</div>
        )}

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-0 gap-2">
            {selectedItemData.image_url && (
              <img
                src={selectedItemData.image_url}
                alt={selectedItemData.title}
                className="w-full h-48 object-cover rounded-xl"
              />
            )}
            <CardTitle className="mt-3 text-xl">{selectedItemData.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between pt-3">
            {selectedItemData.description && (
              <p className="text-muted-foreground mt-1">
                {selectedItemData.description}
              </p>
            )}
            {typeof selectedItemData.price === 'number' && (
              <p className="text-xl font-semibold mt-3">
                {selectedItemData.price} ₽
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Контактные данные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="booking-name" className="block mb-2">
                Имя
              </Label>
              <Input
                id="booking-name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ваше имя"
              />
            </div>
            <div>
              <Label htmlFor="booking-phone" className="block mb-2">
                Телефон
              </Label>
              <Input
                id="booking-phone"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="+7 900 000-00-00"
              />
            </div>
            <div>
              <Label htmlFor="booking-comment" className="block mb-2">
                Комментарий
              </Label>
              <Textarea
                id="booking-comment"
                value={customerComment}
                onChange={e => setCustomerComment(e.target.value)}
                placeholder="Комментарий к записи"
              />
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
                    htmlFor={`booking-action-${option.id}`}
                    className={`block w-full rounded-xl p-4 glass-card cursor-pointer ${
                      selectedActionValue === option.id
                        ? 'ring-2 ring-primary'
                        : 'ring-0'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        id={`booking-action-${option.id}`}
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
                                Назначение платежа: {paymentPurpose}
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

        {fulfillmentOptions.length > 0 && (
          <Card className="relative z-40">
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
                          Получу {labels.orderWord.toLowerCase()} в точке
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
                          Нужна доставка {labels.orderWord.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </Label>
                )}
                {fulfillmentOptions.includes('digital') && (
                  <Label className="block w-full rounded-xl p-4 glass-card cursor-pointer">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="digital" className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">Цифровой продукт</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Цифровое получение услуги/доступа
                        </p>
                      </div>
                    </div>
                  </Label>
                )}
                {fulfillmentOptions.includes('to_table') && (
                  <Label className="block w-full rounded-xl p-4 glass-card cursor-pointer">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="to_table" className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">К столику</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Обслуживание у столика в заведении
                        </p>
                      </div>
                    </div>
                  </Label>
                )}
                {fulfillmentOptions.includes('on_site') && (
                  <Label className="block w-full rounded-xl p-4 glass-card cursor-pointer">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="on_site" className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">На месте</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Приду к исполнителю
                        </p>
                      </div>
                    </div>
                  </Label>
                )}
                {fulfillmentOptions.includes('at_client') && (
                  <Label className="block w-full rounded-xl p-4 glass-card cursor-pointer">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="at_client" className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">У клиента</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Нужен выезд по адресу
                        </p>
                      </div>
                    </div>
                  </Label>
                )}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {shouldShowAddressField && (
          <Card>
            <CardHeader>
              <CardTitle>
                Адрес ({getFulfillmentLabel(selectedFulfillment)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  value={deliveryAddress}
                  onFocus={() => setShowAddressSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowAddressSuggestions(false), 120)
                  }
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Введите адрес"
                />
                {showAddressSuggestions &&
                  addressSuggestions.suggestions.length > 0 && (
                    <div className="absolute z-[80] mt-1 w-full rounded-xl border bg-background shadow-lg overflow-hidden">
                      {addressSuggestions.suggestions.map(option => (
                        <button
                          type="button"
                          key={option.value}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60"
                          onClick={() => {
                            setDeliveryAddress(option.value);
                            setShowAddressSuggestions(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedFulfillment === 'to_table' && (
          <Card>
            <CardHeader>
              <CardTitle>Номер столика</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                placeholder="Например, 12"
              />
            </CardContent>
          </Card>
        )}

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
