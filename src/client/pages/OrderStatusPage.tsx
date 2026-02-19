import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrder } from '../hooks/useOrders';
import type { ClientActionOption } from '../utils/actionOptions';
import {
  clearCurrentOrder,
  getReadableOrderNumber,
  setCurrentOrder,
} from '../utils/currentOrder';

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

  const parsedItems = useMemo(() => asItems(order?.items), [order?.items]);
  const status = order?.status ?? 'created';
  const statusMeta = STATUS_META[status] ?? {
    label: status,
    className: 'text-slate-700 bg-slate-200',
    description: 'Статус заказа обновляется автоматически.',
  };

  useEffect(() => {
    if (!order) return;
    if (
      order.status === 'completed' ||
      order.status === 'cancelled' ||
      order.status === 'rejected' ||
      order.status === 'ready'
    ) {
      clearCurrentOrder();
      return;
    }
    setCurrentOrder(order);
  }, [order]);

  if (!orderId) {
    return <div className="p-4">Некорректный номер заказа</div>;
  }

  if (isLoading) {
    return <div className="p-4">Загрузка…</div>;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card>
          <CardHeader>
            <CardTitle>Не удалось загрузить заказ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Произошла ошибка.'}
            </p>
            <Button className="w-full" onClick={() => mutate()}>
              Повторить
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card>
          <CardHeader>
            <CardTitle>Заказ не найден</CardTitle>
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/catalog')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2 flex-1">Статус заказа</h1>
        <Button variant="ghost" size="icon" onClick={() => mutate()}>
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Заказ №{getReadableOrderNumber(order)}
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
              <span className="font-semibold">{order.total_price} ₽</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Позиции</CardTitle>
          </CardHeader>
          <CardContent>
            {parsedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Состав заказа отсутствует.
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
