import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrder, useUpdateOrderStatus } from '../hooks/useOrders';
import { useCatalog } from '../hooks/useCatalogs';
import type { ClientActionOption } from '../utils/actionOptions';
import {
  clearOrderFromHistory,
  getCurrentOrdersByCatalog,
  clearCurrentOrder,
  getReadableOrderNumber,
  setCurrentOrder,
} from '../utils/currentOrder';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { toast } from 'sonner';
import { getFlowLabels, getFulfillmentLabel } from '../utils/presentation';
import { Spinner } from '@/components/ui/spinner';
import { clientOrderService } from '../services/orders';

const STATUS_META: Record<
  string,
  { label: string; className: string; description: string }
> = {
  created: {
    label: 'Создан',
    className: 'text-slate-700 bg-slate-200',
    description: 'Черновик заказа создан. Выберите способ оплаты.',
  },
  submitted: {
    label: 'Оформлен',
    className: 'text-amber-700 bg-amber-100',
    description: 'Заказ отправлен продавцу и ожидает обработки.',
  },
  payment_reported: {
    label: 'Оплата отправлена',
    className: 'text-blue-700 bg-blue-100',
    description: 'Клиент сообщил об оплате, ожидается подтверждение продавца.',
  },
  accepted: {
    label: 'Принят',
    className: 'text-green-700 bg-green-100',
    description: 'Продавец принял заказ в работу.',
  },
  rejected: {
    label: 'Отклонен',
    className: 'text-red-700 bg-red-100',
    description: 'Заказ отклонен продавцом.',
  },
  ready: {
    label: 'Готов',
    className: 'text-indigo-700 bg-indigo-100',
    description: 'Заказ готов к выдаче.',
  },
  new: {
    label: 'Новый',
    className: 'text-amber-700 bg-amber-100',
    description: 'Заказ получен и ожидает обработки.',
  },
  paid: {
    label: 'Оплачен',
    className: 'text-green-700 bg-green-100',
    description: 'Оплата подтверждена.',
  },
  completed: {
    label: 'Завершен',
    className: 'text-slate-700 bg-slate-200',
    description: 'Заказ завершен.',
  },
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
};

const asItems = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

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
  useAutoBackButton('/catalog');

  useEffect(() => {
    if (!orderId) return;
    void mutate();
  }, [orderId, mutate]);

  const displayedOrder = order?.id === orderId ? order : null;
  const parsedItems = useMemo(
    () => asItems(displayedOrder?.items),
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
  const sellerTelegramLink = useMemo(() => {
    const raw = catalog?.emergency_telegram?.trim();
    if (!raw) return '';
    if (raw.startsWith('https://') || raw.startsWith('http://')) return raw;
    if (raw.startsWith('@')) return `https://t.me/${raw.slice(1)}`;
    if (raw.startsWith('t.me/')) return `https://${raw}`;
    if (/^[a-zA-Z0-9_]{5,}$/.test(raw)) return `https://t.me/${raw}`;
    return raw;
  }, [catalog?.emergency_telegram]);

  useEffect(() => {
    if (!displayedOrder) return;
    if (
      displayedOrder.status === 'completed' ||
      displayedOrder.status === 'cancelled' ||
      displayedOrder.status === 'rejected' ||
      displayedOrder.status === 'ready'
    ) {
      clearCurrentOrder();
      clearOrderFromHistory(displayedOrder.id);
      return;
    }
    setCurrentOrder(displayedOrder);
  }, [displayedOrder]);

  useEffect(() => {
    if (!catalog?.id) return;
    let isMounted = true;

    const load = async () => {
      const refs = getCurrentOrdersByCatalog(catalog.id);
      const terminalStatuses = new Set([
        'cancelled',
        'rejected',
        'completed',
        'ready',
      ]);
      const resolved = await Promise.all(
        refs.map(async ref => {
          try {
            const full = await clientOrderService.getById(ref.id);
            if (!full) return null;
            if (terminalStatuses.has(full.status)) {
              clearOrderFromHistory(full.id);
              return null;
            }
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
      setActiveOrders(unique);
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              {labels.orderWord} №{getReadableOrderNumber(displayedOrder)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Статус</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {statusMeta.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Сумма</span>
              <span className="font-semibold">{displayedOrder.total_price} ₽</span>
            </div>
            {displayedOrder.fulfillment_method && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Способ получения
                </span>
                <span className="font-medium">{getFulfillmentLabel(displayedOrder.fulfillment_method)}</span>
              </div>
            )}
            {displayedOrder.delivery_address && (
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-muted-foreground">Адрес</span>
                <span className="font-medium text-right break-words">
                  {displayedOrder.delivery_address}
                </span>
              </div>
            )}
            {displayedOrder.table_number && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Столик</span>
                <span className="font-medium">{displayedOrder.table_number}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Позиции</CardTitle>
          </CardHeader>
          <CardContent>
            {parsedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {labels.orderWord === 'Запись'
                  ? 'Состав записи отсутствует.'
                  : 'Состав заказа отсутствует.'}
              </p>
            ) : (
              <div className="space-y-3">
                {parsedItems.map((item, index) => {
                  const title = String(item.title ?? 'Позиция');
                  const quantity = Number(item.quantity ?? 1);
                  const price = Number(item.price ?? 0);
                  return (
                    <div
                      key={`${title}-${index}`}
                      className="flex items-center justify-between border-b border-border/20 pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-sm text-muted-foreground">
                          {quantity} шт.
                        </p>
                      </div>
                      <p className="font-semibold">{price * quantity} ₽</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {(catalog?.emergency_phone || catalog?.emergency_telegram) && (
          <Card>
            <CardHeader>
              <CardTitle>Связь с продавцом</CardTitle>
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

        {[
          'created',
          'submitted',
          'payment_reported',
          'new',
          'accepted',
        ].includes(status) && (
          <Card>
            <CardHeader>
              <CardTitle>Управление {labels.orderWord.toLowerCase()}</CardTitle>
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

        {status === 'created' && catalog?.type === 'goods' && (
          <Card>
            <CardHeader>
              <CardTitle>Продолжить оформление</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => navigate(`/checkout/${displayedOrder.id}`)}
              >
                Перейти к оплате
              </Button>
            </CardContent>
          </Card>
        )}

        {activeOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Активные заказы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeOrders.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/order/${item.id}`, { state: null })}
                  className="w-full text-left rounded-xl border p-3 hover:bg-secondary/40"
                >
                  <p className="font-medium">№{item.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Статус: {STATUS_META[item.status]?.label || item.status}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {['created', 'submitted', 'payment_reported', 'new'].includes(status) &&
          selectedAction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="w-5 h-5" />
                  Дальнейшие действия
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {selectedAction.kind === 'payment_on_delivery' && (
                  <p>Оплата производится при получении.</p>
                )}
                {selectedAction.kind === 'payment_in_chat' && (
                  <>
                    <p>
                      Свяжитесь с продавцом в Telegram для подтверждения оплаты.
                    </p>
                    {selectedAction.telegramUrl ? (
                      <a
                        href={selectedAction.telegramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center px-4 rounded-xl bg-primary text-primary-foreground"
                      >
                        Открыть Telegram
                      </a>
                    ) : (
                      <p>Ссылка Telegram не указана.</p>
                    )}
                  </>
                )}
                {selectedAction.kind === 'light_sbp' && (
                  <>
                    {selectedAction.details.bank && (
                      <p>Банк: {selectedAction.details.bank}</p>
                    )}
                    {selectedAction.details.name && (
                      <p>Имя: {selectedAction.details.name}</p>
                    )}
                    {selectedAction.details.phone && (
                      <p>Телефон: {selectedAction.details.phone}</p>
                    )}
                    {selectedAction.details.sbp_link && (
                      <a
                        href={selectedAction.details.sbp_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center px-4 rounded-xl bg-primary text-primary-foreground"
                      >
                        Перейти к оплате СБП
                      </a>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-x-0 border-b-0 p-4 pb-8">
        <Button className="w-full h-12" onClick={() => navigate('/catalog')}>
          В каталог
        </Button>
      </div>
    </div>
  );
}
