import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCatalog } from '../hooks/useCatalogs';
import {
  useOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
} from '../hooks/useOrders';
import { getClientActionOptions } from '../utils/actionOptions';
import { getReadableOrderNumber, setCurrentOrder } from '../utils/currentOrder';
import { useCurrentUser } from '@/useTelegramAuth';
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
import { useCartStore } from '../stores/cart';
import { useAddressSuggestions } from '@/hooks/useAddressSuggestions';
import {
  getAllowedFulfillmentOptions,
  normalizeTelegramContactLink,
} from '../utils/fulfillment';
import { parseOrderItems } from '../utils/orderItems';
import { FulfillmentOptionsField } from '../components/FulfillmentOptionsField';
import { CustomerContactFields } from '../components/CustomerContactFields';
import { SellerContactsCard } from '../components/SellerContactsCard';
import { ActionOptionsField } from '../components/ActionOptionsField';
import { AddressFieldCard } from '../components/AddressFieldCard';
import { TableNumberCard } from '../components/TableNumberCard';
import {
  buildOrderUpdatePayload,
  getFulfillmentFields,
  persistFulfillmentDraft,
  validateFulfillmentInput,
} from '../utils/orderForm';
import { clientPaymentService } from '../services/payments';

type Props = {
  catalogId: string;
};

export function CheckoutPage({ catalogId }: Props) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { clearCart } = useCartStore();
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
  const [deliveryAddress, setDeliveryAddress] = useState(
    () => localStorage.getItem('client-last-delivery-address') || ''
  );
  const [customerName, setCustomerName] = useState(
    user?.first_name || user?.username || ''
  );
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerComment, setCustomerComment] = useState('');
  const [tableNumber, setTableNumber] = useState(
    () => localStorage.getItem('client-table-number') || ''
  );

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
  const labels = getFlowLabels(catalog?.type ?? 'goods', catalog?.subtype);
  const fulfillmentOptions = useMemo(
    () => getAllowedFulfillmentOptions(catalog),
    [catalog]
  );
  const addressSuggestions = useAddressSuggestions(deliveryAddress);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

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
  const orderItems = useMemo(() => parseOrderItems(order?.items), [order?.items]);
  const readableOrderNumber = order ? getReadableOrderNumber(order) : '';
  const sellerTelegramLink = useMemo(
    () => normalizeTelegramContactLink(catalog?.emergency_telegram),
    [catalog?.emergency_telegram]
  );

  const handleSubmit = async () => {
    if (!order || !selectedAction || !catalog) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const validationError = validateFulfillmentInput({
        selectedFulfillment,
        deliveryAddress,
        tableNumber,
      });
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const orderPayload = buildOrderUpdatePayload({
        selectedFulfillment,
        deliveryAddress,
        tableNumber,
        customerName,
        customerPhone,
        customerComment,
        paymentMethod: selectedAction.kind,
      });

      if (selectedAction.kind === 'payment_in_chat') {
        if (!selectedAction.telegramUrl) {
          setError('Ссылка на Telegram не настроена продавцом.');
          toast.error('Ссылка на Telegram не настроена продавцом');
          return;
        }
        await updateOrder(order.id, orderPayload);
        await updateStatus(order.id, 'submitted');
        setCurrentOrder(order);
        const fulfillmentFields = getFulfillmentFields({
          selectedFulfillment,
          deliveryAddress,
          tableNumber,
        });
        const message = buildTelegramOrderMessage({
          catalogType: catalog.type,
          catalogSubtype: catalog.subtype,
          order: {
            ...order,
            ...fulfillmentFields,
          },
        });
        const link = appendTelegramTextParam(
          selectedAction.telegramUrl,
          message
        );
        clearCart();
        toast.success('Переход в Telegram');
        window.location.href = link;
        return;
      }

      if (selectedAction.kind === 'online_yookassa') {
        const updatedOrder = await updateOrder(order.id, orderPayload);
        persistFulfillmentDraft({
          selectedFulfillment,
          deliveryAddress,
          tableNumber,
        });
        setCurrentOrder(updatedOrder);
        const payment = await clientPaymentService.createYookassaPayment(order.id);
        clearCart();
        window.location.href = payment.confirmationUrl;
        return;
      }

      await updateOrder(order.id, orderPayload);
      persistFulfillmentDraft({
        selectedFulfillment,
        deliveryAddress,
        tableNumber,
      });

      if (selectedAction.kind === 'light_sbp') {
        await updateStatus(order.id, 'payment_reported');
      } else {
        await updateStatus(order.id, 'submitted');
      }

      setCurrentOrder(order);
      clearCart();
      navigate(`/order/${order.id}`, {
        replace: true,
        state: { action: selectedAction },
      });
      toast.success('Статус заказа обновлен');
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
          <h2 className="text-lg font-semibold">
            {labels.orderWord} не найден
          </h2>
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
  const shouldShowAddressField = requiresAddressForFulfillment(
    selectedFulfillment
  );
  const orderWordLower = labels.orderWord.toLowerCase();
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
        <h1 className="text-lg font-semibold ml-2 flex-1">
          {labels.checkoutTitle}
        </h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {error && (
          <div className="glass-card p-3 text-sm text-red-600">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Контактные данные</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerContactFields
              idPrefix="checkout"
              customerName={customerName}
              customerPhone={customerPhone}
              customerComment={customerComment}
              onNameChange={setCustomerName}
              onPhoneChange={setCustomerPhone}
              onCommentChange={setCustomerComment}
              commentPlaceholder="Комментарий к заказу"
            />
          </CardContent>
        </Card>

        <SellerContactsCard
          className="relative z-40"
          title="Контакты продавца"
          phone={catalog.emergency_phone}
          telegram={catalog.emergency_telegram}
          telegramLink={sellerTelegramLink}
        />

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

        <FulfillmentOptionsField
          options={fulfillmentOptions}
          selected={selectedFulfillment}
          onChange={setSelectedFulfillment}
          copy={{
            pickup: {
              title: 'Самовывоз',
              description: `Заберу ${orderWordLower} самостоятельно`,
            },
            delivery: {
              title: 'Доставка',
              description: `Привезите ${orderWordLower} по адресу`,
            },
            digital: {
              title: 'Цифровой продукт',
              description: 'Получение цифровых данных в сообщении/инструкции',
            },
            to_table: {
              title: 'К столику',
              description: 'Доставка к вашему столику внутри заведения',
            },
            on_site: {
              title: 'На месте',
              description: 'Получение в точке продавца',
            },
            at_client: {
              title: 'У клиента',
              description: 'Выезд по вашему адресу',
            },
          }}
        />

        {shouldShowAddressField && (
          <AddressFieldCard
            title={`Адрес (${getFulfillmentLabel(selectedFulfillment)})`}
            value={deliveryAddress}
            onChange={setDeliveryAddress}
            suggestions={addressSuggestions.suggestions}
            showSuggestions={showAddressSuggestions}
            setShowSuggestions={setShowAddressSuggestions}
          />
        )}

        {selectedFulfillment === 'to_table' && (
          <TableNumberCard value={tableNumber} onChange={setTableNumber} />
        )}

        <ActionOptionsField
          options={actionOptions}
          selectedValue={selectedActionValue}
          onChange={setSelectedActionId}
          idPrefix="checkout"
          emptyText="Владелец каталога пока не настроил способы оформления."
          paymentPurpose={readableOrderNumber}
        />

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
