import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { useCatalog } from '../hooks/useCatalogs';
import { useFavoritesStore } from '../stores/favorites';
import { useCartStore } from '../stores/cart';

type Props = {
  catalogId: string;
};

export function FavoritesPage({ catalogId }: Props) {
  useAutoBackButton('/catalog');
  const { catalog } = useCatalog(catalogId);
  const favorites = useFavoritesStore((state) => state.getFavorites(catalogId));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const { addItem } = useCartStore();

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
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={() => addItem(item as never, 1)}>
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  В корзину
                </Button>
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
    </div>
  );
}
