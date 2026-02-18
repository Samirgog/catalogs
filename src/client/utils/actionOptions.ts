import type { Action } from '../../types';

type SbpDetails = {
  bank?: string;
  name?: string;
  phone?: string;
  sbp_link?: string;
};

export type ClientActionOption =
  | {
      id: string;
      kind: 'payment_on_delivery';
      label: string;
      description: string;
    }
  | {
      id: string;
      kind: 'payment_in_chat';
      label: string;
      description: string;
      telegramUrl?: string;
    }
  | {
      id: string;
      kind: 'light_sbp';
      label: string;
      description: string;
      details: SbpDetails;
    };

const getString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
};

export const getClientActionOptions = (
  actions: Action[] | undefined
): ClientActionOption[] => {
  if (!actions?.length) return [];

  const options: ClientActionOption[] = [];

  for (const action of actions) {
    if (!action.is_enabled) continue;

    const config = asRecord(action.config);
    const paymentType = getString(config.paymentType);

    if (action.type === 'order' && paymentType === 'payment_on_delivery') {
      options.push({
        id: action.id,
        kind: 'payment_on_delivery',
        label: 'Оплата при получении',
        description: 'Оплатите заказ при получении.',
      });
      continue;
    }

    if (action.type === 'chat' && paymentType === 'payment_in_chat') {
      const telegramUrl =
        getString(config.telegramUrl) ||
        getString(config.telegram_url) ||
        getString(config.chat_link);

      options.push({
        id: action.id,
        kind: 'payment_in_chat',
        label: 'Связаться в Telegram',
        description: 'Менеджер отправит детали оплаты в чате.',
        telegramUrl,
      });
      continue;
    }

    if (action.type === 'pay' && paymentType === 'light_sbp') {
      const details = asRecord(config.details);
      options.push({
        id: action.id,
        kind: 'light_sbp',
        label: 'Упрощенная оплата по СБП',
        description: 'Оплатите переводом по данным СБП.',
        details: {
          bank: getString(details.bank),
          name: getString(details.name),
          phone: getString(details.phone),
          sbp_link: getString(details.sbp_link),
        },
      });
    }
  }

  return options;
};
