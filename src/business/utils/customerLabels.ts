import { getOrderStatusLabel } from '@/shared/orderStatus';
import type { CustomerEventType, CustomerTrafficSource, Order } from '@/types';

export const getTrafficSourceLabel = (source?: CustomerTrafficSource | string | null) => {
  switch (source) {
    case 'qr_code':
      return 'QR-код';
    case 'direct_link':
      return 'Прямая ссылка';
    case 'repeat_visit':
      return 'Повторный заход';
    default:
      return source || 'Неизвестно';
  }
};

export const getCustomerEventLabel = (eventType: CustomerEventType | string) => {
  switch (eventType) {
    case 'first_visit':
      return 'Первый вход';
    case 'repeat_visit':
      return 'Повторный вход';
    case 'catalog_view':
      return 'Просмотр каталога';
    case 'category_view':
      return 'Просмотр категории';
    case 'item_view':
      return 'Просмотр товара';
    case 'cart_add':
      return 'Добавление в корзину';
    case 'cart_remove':
      return 'Удаление из корзины';
    case 'cart_quantity_change':
      return 'Изменение количества';
    case 'favorite_add':
      return 'Добавление в избранное';
    case 'favorite_remove':
      return 'Удаление из избранного';
    case 'checkout_started':
      return 'Начало оформления';
    case 'payment_method_selected':
      return 'Выбран способ оплаты';
    case 'order_checkout_completed':
      return 'Заказ оформлен';
    case 'order_cancelled':
      return 'Заказ отменен';
    case 'session_without_purchase':
      return 'Ушел без покупки';
    case 'returned_later':
      return 'Вернулся спустя время';
    case 'promo_used':
      return 'Использован промокод';
    case 'repeat_order':
      return 'Повторный заказ';
    default:
      return eventType;
  }
};

export const getReadableOrderStatus = (order: Pick<Order, 'status' | 'fulfillment_method'>) =>
  getOrderStatusLabel(order.status, order.fulfillment_method);
