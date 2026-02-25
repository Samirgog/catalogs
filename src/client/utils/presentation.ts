import type { CatalogType, Order } from '../../types';

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
};

const asItems = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

export const getFlowLabels = (catalogType: CatalogType) => {
  if (catalogType === 'services') {
    return {
      orderWord: 'Запись',
      ordersWord: 'Записи',
      itemWord: 'Услуга',
      itemsWord: 'Услуги',
      checkoutTitle: 'Оформление записи',
      submitLabel: 'Подтвердить запись',
    };
  }
  return {
    orderWord: 'Заказ',
    ordersWord: 'Заказы',
    itemWord: 'Товар',
    itemsWord: 'Товары',
    checkoutTitle: 'Оформление заказа',
    submitLabel: 'Подтвердить заказ',
  };
};

export const getReadableOrderNumber = (order: Order) => {
  if (typeof order.order_number === 'number') return String(order.order_number);
  return order.id.slice(0, 8).toUpperCase();
};

export const buildTelegramOrderMessage = (params: {
  catalogType: CatalogType;
  order: Order;
}) => {
  const labels = getFlowLabels(params.catalogType);
  const number = getReadableOrderNumber(params.order);
  const items = asItems(params.order.items);

  const lines = items.map(item => {
    const title = String(item.title ?? labels.itemWord);
    const quantity = Number(item.quantity ?? 1);
    const price = Number(item.price ?? 0);
    return `• ${title} x${quantity} — ${price * quantity} ₽`;
  });

  return [
    'Здравствуйте!',
    `${labels.orderWord} №${number}`,
    `Способ получения: ${getFulfillmentLabel(params.order.fulfillment_method)}`,
    ...(params.order.delivery_address
      ? [`Адрес: ${params.order.delivery_address}`]
      : []),
    '',
    `Состав (${labels.itemsWord.toLowerCase()}):`,
    ...lines,
    '',
    `Итого: ${params.order.total_price} ₽`,
  ].join('\n');
};

export const appendTelegramTextParam = (baseUrl: string, text: string) => {
  const delimiter = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${delimiter}text=${encodeURIComponent(text)}`;
};

export const getFulfillmentLabel = (method?: string) => {
  switch (method) {
    case 'pickup':
      return 'Самовывоз';
    case 'delivery':
      return 'Доставка';
    case 'digital':
      return 'Цифровой продукт';
    case 'to_table':
      return 'К столику';
    case 'on_site':
      return 'На месте';
    case 'at_client':
      return 'У клиента';
    default:
      return 'Не указан';
  }
};

export const requiresAddressForFulfillment = (method?: string) =>
  method === 'delivery' || method === 'at_client';
