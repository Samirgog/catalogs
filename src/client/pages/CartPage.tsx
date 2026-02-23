import { useCartStore } from '@/client/stores/cart';
import { CartItemRow } from '@/client/components';
import { CartSummary } from '@/client/components';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCurrentUser } from '@/useTelegramAuth';
import { useCatalog } from '../hooks/useCatalogs';
import { useCreateOrder } from '../hooks/useOrders';
import { getCurrentOrder, setCurrentOrder } from '../utils/currentOrder';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

type Props = {
  catalogId: string;
};

export const CartPage = ({ catalogId }: Props) => {
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const { items, getTotalItems } = useCartStore();
  const { catalog, isLoading } = useCatalog(catalogId);
  const { createOrder } = useCreateOrder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useAutoBackButton('/catalog');

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToCheckout = async () => {
    if (!catalog || items.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const currentOrder = getCurrentOrder();

      if (currentOrder?.id && currentOrder.catalogId === catalog.id) {
        navigate(`/checkout/${currentOrder.id}`);
        toast.success('Продолжите оформление текущего заказа');
        return;
      }

      const order = await createOrder({
        catalog_id: catalog.id,
        customer_id: userId || 'anonymous',
        items: items.map(cartItem => ({
          item_id: cartItem.item.id,
          category_id: cartItem.item.category_id,
          title: cartItem.item.title,
          price: cartItem.item.price ?? 0,
          quantity: cartItem.quantity,
        })),
        total_price: items.reduce(
          (sum, cartItem) =>
            sum + (cartItem.item.price ?? 0) * cartItem.quantity,
          0
        ),
        status: 'created',
      });

      setCurrentOrder(order);
      navigate(`/checkout/${order.id}`);
      toast.success('Заказ создан, выберите способ оплаты');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать заказ');
      toast.error('Не удалось создать заказ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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
        <div className="glass-card p-6 rounded-xl text-center space-y-4">
          <h2 className="text-lg font-semibold">Корзина недоступна</h2>
          <p className="text-sm text-muted-foreground">
            Для услуг оформление заказа происходит со страницы выбранной услуги.
          </p>
          <button
            onClick={() => navigate('/catalog')}
            className="h-11 px-4 rounded-xl bg-primary text-primary-foreground"
          >
            Вернуться в каталог
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0 flex items-center">
        <button
          onClick={handleGoBack}
          className="text-sm text-muted-foreground"
        >
          ← Назад
        </button>
        <h1 className="ml-4 text-lg font-semibold">Корзина</h1>
        <span className="ml-2 text-sm text-muted-foreground">
          ({getTotalItems()} шт.)
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3 pb-32">
        {error && (
          <div className="glass-card p-3 text-sm text-red-600">{error}</div>
        )}

        {items.length === 0 && (
          <div className="text-center text-muted-foreground mt-12 glass-card p-6 rounded-xl">
            Корзина пуста
          </div>
        )}

        {items.map(item => (
          <CartItemRow key={item.item.id} item={item} />
        ))}
      </div>

      {/* Summary */}
      <CartSummary
        onCheckout={handleGoToCheckout}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
