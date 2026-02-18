import { useCartStore } from '@/client/stores/cart';
import { CartItemRow } from '@/client/components';
import { CartSummary } from '@/client/components';
import { useNavigate } from 'react-router-dom';
import { useCatalog } from '../hooks/useCatalogs';

type Props = {
  catalogId: string;
};

export const CartPage = ({ catalogId }: Props) => {
  const navigate = useNavigate();
  const { items, getTotalItems } = useCartStore();
  const { catalog, isLoading } = useCatalog(catalogId);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <div className="p-4">Загрузка…</div>;
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
      <CartSummary />
    </div>
  );
};
