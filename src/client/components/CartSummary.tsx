import { useCartStore } from '@/client/stores/cart';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const CartSummary = () => {
  const { getTotalPrice, clearCart, items } = useCartStore();
  const navigate = useNavigate();

  const total = getTotalPrice();

  if (items.length === 0) return null;

  const handleGoToCheckout = () => {
    navigate('/checkout');
  };

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
        <Button className="flex-1 h-12 text-base" onClick={handleGoToCheckout}>
          Перейти к оформлению
        </Button>
      </div>
    </div>
  );
};
