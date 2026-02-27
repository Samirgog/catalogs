import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getAllowedFulfillmentOptions } from '../utils/fulfillment';
import { isOrderItemLike } from '../utils/orderItems';
import { FulfillmentOptionsField } from '../components/FulfillmentOptionsField';
import { CustomerContactFields } from '../components/CustomerContactFields';
import { ActionOptionsField } from '../components/ActionOptionsField';
import { AddressFieldCard } from '../components/AddressFieldCard';
import { TableNumberCard } from '../components/TableNumberCard';
import {
  buildOrderUpdatePayload,
  getFulfillmentFields,
  persistFulfillmentDraft,
  validateFulfillmentInput,
} from '../utils/orderForm';

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
  const labels = getFlowLabels(catalog?.type ?? 'services', catalog?.subtype);
  const fulfillmentOptions = useMemo(
    () => getAllowedFulfillmentOptions(catalog),
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

    await updateOrder(
      order.id,
      buildOrderUpdatePayload({
        selectedFulfillment,
        deliveryAddress,
        tableNumber,
        customerName,
        customerPhone,
        customerComment,
        paymentMethod: selectedAction.kind,
      })
    );

    if (reportPayment) {
      await updateStatus(order.id, 'payment_reported');
    } else {
      await updateStatus(order.id, 'submitted');
    }
    persistFulfillmentDraft({
      selectedFulfillment,
      deliveryAddress,
      tableNumber,
    });

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
      const validationError = validateFulfillmentInput({
        selectedFulfillment,
        deliveryAddress,
        tableNumber,
      });
      if (validationError) {
        toast.error(validationError);
        return;
      }
      if (selectedAction.kind === 'payment_in_chat') {
        if (!selectedAction.telegramUrl) {
          setError('Ссылка на Telegram не настроена продавцом.');
          toast.error('Ссылка на Telegram не настроена продавцом');
          return;
        }
        await updateOrder(
          order.id,
          buildOrderUpdatePayload({
            selectedFulfillment,
            deliveryAddress,
            tableNumber,
            customerName,
            customerPhone,
            customerComment,
            paymentMethod: selectedAction.kind,
          })
        );
        await updateStatus(order.id, 'submitted');
        setCurrentOrder(order);
        clearSelectedItem();
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

  const fallbackOrderItem = order?.items?.[0];
  const selectedItemData =
    selectedItem || (isOrderItemLike(fallbackOrderItem) ? fallbackOrderItem : null);

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
  const orderWordLower = labels.orderWord.toLowerCase();
  const paymentPurpose = String(order
    ? order.order_number || order.id.slice(0, 8).toUpperCase()
    : 'номер заказа');

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
          <CardContent>
            <CustomerContactFields
              idPrefix="booking"
              customerName={customerName}
              customerPhone={customerPhone}
              customerComment={customerComment}
              onNameChange={setCustomerName}
              onPhoneChange={setCustomerPhone}
              onCommentChange={setCustomerComment}
              commentPlaceholder="Комментарий к записи"
            />
          </CardContent>
        </Card>

        <ActionOptionsField
          options={actionOptions}
          selectedValue={selectedActionValue}
          onChange={setSelectedActionId}
          idPrefix="booking"
          emptyText="Владелец каталога пока не настроил способы оформления."
          paymentPurpose={paymentPurpose}
        />

        <FulfillmentOptionsField
          options={fulfillmentOptions}
          selected={selectedFulfillment}
          onChange={setSelectedFulfillment}
          className="relative z-40"
          copy={{
            pickup: {
              title: 'Самовывоз',
              description: `Получу ${orderWordLower} в точке`,
            },
            delivery: {
              title: 'Доставка',
              description: `Нужна доставка ${orderWordLower}`,
            },
            digital: {
              title: 'Цифровой продукт',
              description: 'Цифровое получение услуги/доступа',
            },
            to_table: {
              title: 'К столику',
              description: 'Обслуживание у столика в заведении',
            },
            on_site: {
              title: 'На месте',
              description: 'Приду к исполнителю',
            },
            at_client: {
              title: 'У клиента',
              description: 'Нужен выезд по адресу',
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
