import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { useNavigate } from 'react-router-dom';
import { useCatalog } from '../hooks/useCatalogs';
import { useFavoritesStore } from '../stores/favorites';
import { useCartStore } from '../stores/cart';

type Props = {
  catalogId: string;
};

export function FavoritesPage({ catalogId }: Props) {
  const navigate = useNavigate();
  useAutoBackButton('/catalog');
  const { catalog } = useCatalog(catalogId);
  const favorites = useFavoritesStore((state) => state.getFavorites(catalogId));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const { items, addItem, removeItem, updateQuantity, getTotalItems, getTotalPrice } =
    useCartStore();
  const itemsCount = getTotalItems();
  const total = getTotalPrice();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Избранное</h1>
            <p className="text-sm text-muted-foreground">
              Быстрый возврат к любимым товарам
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {!favorites.length && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Пока нет избранных товаров в каталоге {catalog?.title || ''}.
            </CardContent>
          </Card>
        )}

        {favorites.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-3 flex items-center gap-3">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-secondary/60" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium">{item.title}</div>
                {item.description && (
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </div>
                )}
                {typeof item.price === 'number' && (
                  <div className="text-sm font-semibold mt-1">{item.price} ₽</div>
                )}
                {(() => {
                  const cartItem = items.find((cartItem) => cartItem.item.id === item.id);
                  if (!cartItem) {
                    return (
                      <Button size="sm" className="mt-2" onClick={() => addItem(item as never, 1)}>
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        В корзину
                      </Button>
                    );
                  }

                  return (
                    <div className="mt-2 w-fit flex items-center rounded-xl overflow-hidden glass-card border-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-none h-8 px-3"
                        onClick={() => {
                          if (cartItem.quantity > 1) {
                            updateQuantity(item.id, cartItem.quantity - 1);
                          } else {
                            removeItem(item.id);
                          }
                        }}
                      >
                        -
                      </Button>
                      <span className="px-3 font-medium min-w-[24px] text-center text-sm">
                        {cartItem.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-none h-8 px-3"
                        onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                      >
                        +
                      </Button>
                      <span className="px-3 py-1 font-semibold bg-secondary text-sm rounded-r-xl">
                        {item.price} ₽
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleFavorite(catalogId, item)}
                >
                  Убрать
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {itemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <button
            onClick={() => navigate('/cart')}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-between px-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <ShoppingCart size={18} />
              </div>
              <span className="font-medium">Корзина · {itemsCount}</span>
            </div>
            <span className="text-lg font-semibold">{Math.round(total)} ₽</span>
          </button>
        </div>
      )}
    </div>
  );
}
