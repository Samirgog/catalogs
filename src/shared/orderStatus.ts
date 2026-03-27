import type { FulfillmentMethodType, OrderStatus } from '../types';

export type StatusTone =
  | 'slate'
  | 'amber'
  | 'blue'
  | 'green'
  | 'indigo'
  | 'sky'
  | 'emerald'
  | 'red';

export type StaffStatusAction = {
  nextStatus: OrderStatus;
  label: string;
};

export type OrderStatusMeta = {
  label: string;
  description: string;
  tone: StatusTone;
};

type FulfillmentContext = FulfillmentMethodType | null | undefined;

export const TERMINAL_ORDER_STATUSES = new Set<OrderStatus>([
  'rejected',
  'cancelled',
  'completed',
]);

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'submitted',
  'payment_reported',
  'accepted',
  'ready',
  'paid',
  'in_transit',
  'delivered',
];

export function isTerminalOrderStatus(status: string): status is OrderStatus {
  return TERMINAL_ORDER_STATUSES.has(status as OrderStatus);
}

export function getOrderStatusLabel(
  status: string,
  fulfillmentMethod?: FulfillmentContext
) {
  switch (status) {
    case 'created':
      return 'Черновик';
    case 'submitted':
      return 'Ожидает подтверждения';
    case 'payment_reported':
      return 'Оплата получена';
    case 'accepted':
      return 'Принят в работу';
    case 'rejected':
      return 'Отклонен';
    case 'ready':
      if (fulfillmentMethod === 'delivery') return 'Готов к отправке';
      if (fulfillmentMethod === 'at_client') return 'Готов к выезду';
      if (fulfillmentMethod === 'to_table') return 'Готов к подаче';
      if (fulfillmentMethod === 'digital') return 'Готов к отправке';
      return 'Готов к выдаче';
    case 'paid':
      return 'Оплачен';
    case 'in_transit':
      if (fulfillmentMethod === 'at_client') return 'Исполнитель в пути';
      return 'В пути';
    case 'delivered':
      if (fulfillmentMethod === 'at_client') return 'Исполнитель на месте';
      return 'Доставлен';
    case 'completed':
      return fulfillmentMethod === 'digital' ? 'Доступ предоставлен' : 'Выполнен';
    case 'cancelled':
      return 'Отменен';
    case 'new':
      return 'Ожидает подтверждения';
    default:
      return status;
  }
}

export function getOrderStatusMeta(
  status: string,
  fulfillmentMethod?: FulfillmentContext
): OrderStatusMeta {
  switch (status) {
    case 'created':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'slate',
        description: 'Черновик создан. Выберите способ оплаты и подтвердите оформление.',
      };
    case 'submitted':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'amber',
        description: 'Заявка отправлена продавцу и ожидает подтверждения.',
      };
    case 'payment_reported':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'blue',
        description: 'Оплата зафиксирована. Продавец проверяет платеж и берет заказ в работу.',
      };
    case 'accepted':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'green',
        description: 'Заказ подтвержден и уже обрабатывается.',
      };
    case 'rejected':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'red',
        description: 'Продавец отклонил заказ. При необходимости свяжитесь с ним напрямую.',
      };
    case 'ready':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'indigo',
        description:
          fulfillmentMethod === 'delivery'
            ? 'Заказ собран и готов к передаче в доставку.'
            : fulfillmentMethod === 'at_client'
              ? 'Исполнитель подготовился к выезду по вашему адресу.'
              : fulfillmentMethod === 'digital'
                ? 'Все готово к отправке цифровых материалов.'
                : fulfillmentMethod === 'to_table'
                  ? 'Заказ готов и скоро будет подан к столику.'
                  : 'Заказ готов к выдаче.',
      };
    case 'paid':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'green',
        description: 'Оплата подтверждена.',
      };
    case 'in_transit':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'sky',
        description:
          fulfillmentMethod === 'at_client'
            ? 'Исполнитель уже едет к вам.'
            : 'Курьер уже в пути с вашим заказом.',
      };
    case 'delivered':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'emerald',
        description:
          fulfillmentMethod === 'at_client'
            ? 'Исполнитель прибыл и заказ можно завершать.'
            : 'Заказ доставлен и ожидает финального закрытия.',
      };
    case 'completed':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'slate',
        description: 'Заказ завершен.',
      };
    case 'cancelled':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'slate',
        description: 'Заказ отменен.',
      };
    case 'new':
      return {
        label: getOrderStatusLabel(status, fulfillmentMethod),
        tone: 'amber',
        description: 'Заявка отправлена продавцу и ожидает подтверждения.',
      };
    default:
      return {
        label: status,
        tone: 'slate',
        description: 'Статус заказа обновляется автоматически.',
      };
  }
}

export function getStatusToneClasses(tone: StatusTone) {
  switch (tone) {
    case 'amber':
      return 'text-amber-700 bg-amber-100';
    case 'blue':
      return 'text-blue-700 bg-blue-100';
    case 'green':
      return 'text-green-700 bg-green-100';
    case 'indigo':
      return 'text-indigo-700 bg-indigo-100';
    case 'sky':
      return 'text-sky-700 bg-sky-100';
    case 'emerald':
      return 'text-emerald-700 bg-emerald-100';
    case 'red':
      return 'text-red-700 bg-red-100';
    default:
      return 'text-slate-700 bg-slate-200';
  }
}

export function getStaffPrimaryAction(
  status: string,
  fulfillmentMethod?: FulfillmentContext
): StaffStatusAction | null {
  if (status === 'accepted') {
    if (fulfillmentMethod === 'digital') {
      return { nextStatus: 'completed', label: 'Отметить выполненным' };
    }
    return { nextStatus: 'ready', label: getReadyActionLabel(fulfillmentMethod) };
  }

  if (status === 'ready') {
    if (fulfillmentMethod === 'delivery') {
      return { nextStatus: 'in_transit', label: 'Передать в доставку' };
    }
    if (fulfillmentMethod === 'at_client') {
      return { nextStatus: 'in_transit', label: 'Исполнитель выехал' };
    }
    return { nextStatus: 'completed', label: 'Выдано / выполнено' };
  }

  if (status === 'in_transit') {
    if (fulfillmentMethod === 'at_client') {
      return { nextStatus: 'delivered', label: 'Исполнитель на месте' };
    }
    return { nextStatus: 'delivered', label: 'Доставлено' };
  }

  if (status === 'delivered') {
    return { nextStatus: 'completed', label: 'Завершить заказ' };
  }

  return null;
}

export function canStaffAcceptOrder(status: string) {
  return ['submitted', 'payment_reported', 'accepted'].includes(status);
}

function getReadyActionLabel(fulfillmentMethod?: FulfillmentContext) {
  if (fulfillmentMethod === 'delivery') return 'Собран и готов к отправке';
  if (fulfillmentMethod === 'at_client') return 'Готов к выезду';
  if (fulfillmentMethod === 'to_table') return 'Готов к подаче';
  if (fulfillmentMethod === 'digital') return 'Материалы отправлены';
  return 'Готов к выдаче';
}
