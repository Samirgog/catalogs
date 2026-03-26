export type StatusMeta = {
  label: string;
  className: string;
  description: string;
};

export const STATUS_META: Record<string, StatusMeta> = {
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
  cancelled: {
    label: 'Отменен',
    className: 'text-slate-700 bg-slate-200',
    description: 'Заказ отменен.',
  },
};

export const TERMINAL_STATUSES = new Set([
  'cancelled',
  'rejected',
  'completed',
  'ready',
]);
