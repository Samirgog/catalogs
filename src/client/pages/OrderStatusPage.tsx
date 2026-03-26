import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrder, useUpdateOrderStatus } from '../hooks/useOrders';
import { useCatalog } from '../hooks/useCatalogs';
import type { ClientActionOption } from '../utils/actionOptions';
import {
  getCurrentOrdersByCatalog,
  clearCurrentOrder,
  getReadableOrderNumber,
  setCurrentOrder,
} from '../utils/currentOrder';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { toast } from 'sonner';
import { getFlowLabels } from '../utils/presentation';
import { Spinner } from '@/components/ui/spinner';
import { clientOrderService } from '../services/orders';
import { parseOrderItems } from '../utils/orderItems';
import { normalizeTelegramContactLink } from '../utils/fulfillment';
import { SellerContactsCard } from '../components/SellerContactsCard';
import { STATUS_META, TERMINAL_STATUSES } from './OrderStatusPage/statusMeta';
import { OrderStatusSummaryCard } from './OrderStatusPage/components/OrderStatusSummaryCard';
import { OrderItemsCard } from './OrderStatusPage/components/OrderItemsCard';
import { ActiveOrdersCard } from './OrderStatusPage/components/ActiveOrdersCard';
import { OrderNextActionsCard } from './OrderStatusPage/components/OrderNextActionsCard';
import { clientPaymentService } from '../services/payments';

type LocationState = {
  action?: ClientActionOption;
};

export function OrderStatusPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? null;
  const selectedAction = state?.action;
  const { order, isLoading, isError, error, mutate } = useOrder(
    orderId ?? null
  );
  const { updateStatus } = useUpdateOrderStatus();
  const { catalog } = useCatalog(
    order && order.id === orderId ? order.catalog_id : null
  );
  const [activeOrders, setActiveOrders] = useState<
    Array<{ id: string; orderNumber: string; status: string }>
  >([]);
  const [archiveOrders, setArchiveOrders] = useState<
    Array<{ id: string; orderNumber: string; status: string }>
  >([]);
  const currentPlaceId = localStorage.getItem('client-current-place-id') || '';
  useAutoBackButton(currentPlaceId ? '/foodcourt' : '/catalog');

  useEffect(() => {
    if (!orderId) return;
    void mutate();
  }, [orderId, mutate]);

  const displayedOrder = order?.id === orderId ? order : null;
  const parsedItems = useMemo(
    () => parseOrderItems(displayedOrder?.items),
    [displayedOrder?.items]
  );
  const labels = getFlowLabels(catalog?.type ?? 'goods', catalog?.subtype);
  const status = displayedOrder?.status ?? 'created';
  const baseStatusMeta = STATUS_META[status] ?? {
    label: status,
    className: 'text-slate-700 bg-slate-200',
    description: 'Статус заказа обновляется автоматически.',
  };
  const statusMeta = {
    ...baseStatusMeta,
    description:
      labels.orderWord === 'Запись'
        ? baseStatusMeta.description
            .replaceAll('Заказ', 'Запись')
            .replaceAll('заказ', 'запись')
            .replaceAll('заказа', 'записи')
        : baseStatusMeta.description,
  };
  const sellerTelegramLink = useMemo(
    () => normalizeTelegramContactLink(catalog?.emergency_telegram),
    [catalog?.emergency_telegram]
  );

  useEffect(() => {
    if (!displayedOrder) return;
    if (TERMINAL_STATUSES.has(displayedOrder.status)) {
      clearCurrentOrder();
    } else {
      setCurrentOrder(displayedOrder);
    }
  }, [displayedOrder]);

  useEffect(() => {
    if (!catalog?.id) return;
    let isMounted = true;

    const load = async () => {
      const refs = getCurrentOrdersByCatalog(catalog.id);
      const resolved = await Promise.all(
        refs.map(async ref => {
          try {
            const full = await clientOrderService.getById(ref.id);
            if (!full) return null;
            return {
              id: full.id,
              orderNumber: getReadableOrderNumber(full),
              status: full.status,
            };
          } catch {
            return null;
          }
        })
      );
      if (!isMounted) return;
      const unique = resolved
        .filter(Boolean)
        .filter(
          (value, index, arr) =>
            arr.findIndex(item => item?.id === value?.id) === index
        ) as Array<{ id: string; orderNumber: string; status: string }>;
      const active = unique.filter(item => !TERMINAL_STATUSES.has(item.status));
      const archive = unique.filter(item => TERMINAL_STATUSES.has(item.status));
      setActiveOrders(active);
      setArchiveOrders(archive);
    };

    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [catalog?.id]);

  useEffect(() => {
    if (!isError) return;
    toast.error(
      error instanceof Error
        ? error.message
        : `Не удалось загрузить ${labels.orderWord.toLowerCase()}`
    );
  }, [error, isError, labels.orderWord]);

  const handleRefresh = async () => {
    try {
      await mutate();
      toast.success(`Статус ${labels.orderWord.toLowerCase()} обновлен`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка обновления');
    }
  };

  const handleCancelOrder = async () => {
    if (!displayedOrder) return;

    try {
      await updateStatus(displayedOrder.id, 'cancelled');
      await mutate();
      clearCurrentOrder();
      toast.success(`${labels.orderWord} отменена`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Не удалось отменить ${labels.orderWord.toLowerCase()}`
      );
    }
  };

  const handleContinueOnlinePayment = async () => {
    if (!displayedOrder) return;
    try {
      const confirmationUrl =
        displayedOrder.payment_confirmation_url ||
        (await clientPaymentService.createYookassaPayment(displayedOrder.id))
          .confirmationUrl;
      window.location.href = confirmationUrl;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Не удалось открыть оплату'
      );
    }
  };

  const handleSyncOnlinePayment = async () => {
    if (!displayedOrder) return;
    try {
      await clientPaymentService.syncYookassaPayment(displayedOrder.id);
      await mutate();
      toast.success('Статус оплаты обновлен');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Не удалось обновить оплату'
      );
    }
  };

  const handleContinueOrderFlow = () => {
    if (!displayedOrder || !catalog) return;

    if (displayedOrder.payment_method === 'online_yookassa') {
      void handleContinueOnlinePayment();
      return;
    }

    navigate(
      catalog.type === 'services'
        ? `/booking/${displayedOrder.id}`
        : `/checkout/${displayedOrder.id}`
    );
  };

  const handleGoBackToCatalog = () => {
    if (currentPlaceId) {
      navigate('/foodcourt');
      return;
    }
    navigate('/catalog');
  };

  if (!orderId) {
    return (
      <div className="p-4">
        Некорректный номер {labels.orderWord.toLowerCase()}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Не удалось загрузить {labels.orderWord.toLowerCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Произошла ошибка.'}
            </p>
            <Button className="w-full" onClick={handleRefresh}>
              Повторить
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!displayedOrder) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card>
          <CardHeader>
            <CardTitle>{labels.orderWord} не найдена</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/catalog')}>
              В каталог
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0 flex items-center">
        <h1 className="text-lg font-semibold ml-2 flex-1">
          Статус {labels.orderWord.toLowerCase()}
        </h1>
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <OrderStatusSummaryCard
          order={displayedOrder}
          orderWord={labels.orderWord}
          statusMeta={statusMeta}
        />

        <OrderItemsCard items={parsedItems} orderWord={labels.orderWord} />

        <SellerContactsCard
          title="Связь с продавцом"
          phone={catalog?.emergency_phone}
          telegram={catalog?.emergency_telegram}
          telegramLink={sellerTelegramLink}
        />

        {[
          'created',
          'submitted',
          'payment_reported',
          'new',
          'accepted',
        ].includes(status) && (
          <Card>
            <CardHeader>
              <CardTitle>Управлять</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancelOrder}
              >
                Отменить {labels.orderWord.toLowerCase()}
              </Button>
            </CardContent>
          </Card>
        )}

        {status === 'created' && catalog && (
          <Card>
            <CardHeader>
              <CardTitle>Продолжить оформление</CardTitle>
            </CardHeader>
            <CardContent>
              {displayedOrder.payment_method === 'online_yookassa' ? (
                <div className="space-y-2">
                  <Button className="w-full" onClick={handleContinueOrderFlow}>
                    Перейти к онлайн-оплате
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSyncOnlinePayment}
                  >
                    Проверить оплату
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={handleContinueOrderFlow}>
                  Перейти к оплате
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <ActiveOrdersCard
          activeOrders={activeOrders}
          archiveOrders={archiveOrders}
          onOpenOrder={id => navigate(`/order/${id}`, { state: null })}
        />

        <OrderNextActionsCard status={status} selectedAction={selectedAction} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-x-0 border-b-0 p-4 pb-8">
        <Button className="w-full h-12" onClick={handleGoBackToCatalog}>
          В каталог
        </Button>
      </div>
    </div>
  );
}
