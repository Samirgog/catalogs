import { Button } from '@/components/ui/button';
import { useCartStore } from '@/client/stores/cart';

type Props = {
  onCheckout: () => void;
  isSubmitting: boolean;
};

export const CartSummary = ({ onCheckout, isSubmitting }: Props) => {
  const { getTotalPrice, clearCart, items } = useCartStore();

  const total = getTotalPrice();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-x-0 border-b-0 p-4 pb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground">Итого</span>
        <span className="text-xl font-bold">{total.toFixed(0)} ₽</span>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-12" onClick={clearCart}>
          Очистить
        </Button>
        <Button
          className="flex-1 h-12 text-base"
          onClick={onCheckout}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Создаем заказ...' : 'Перейти к оформлению'}
        </Button>
      </div>
    </div>
  );
};
