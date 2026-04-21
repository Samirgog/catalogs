import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clientRelatedItemsService } from '@/client/services/relatedItems';
import { useCartStore } from '@/client/stores/cart';
import type { Item } from '@/types';

type Props = {
  catalogId: string;
  sourceItemIds: string[];
  title?: string;
};

export function RelatedSuggestions({
  catalogId,
  sourceItemIds,
  title = 'Можно добавить к заказу',
}: Props) {
  const { addItem, items } = useCartStore();
  const [suggestions, setSuggestions] = useState<Item[]>([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const data = await clientRelatedItemsService.getSuggestions(
        catalogId,
        sourceItemIds
      );
      if (!isMounted) return;
      const cartIds = new Set(items.map((item) => item.item.id));
      setSuggestions(data.filter((item) => !cartIds.has(item.id)).slice(0, 4));
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [catalogId, items, sourceItemIds]);

  if (!suggestions.length) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border/60 p-3 flex items-center gap-3"
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-secondary/60" />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{item.title}</div>
              {item.description && (
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {item.description}
                </div>
              )}
              {typeof item.price === 'number' && (
                <div className="text-sm font-semibold mt-1">{item.price} ₽</div>
              )}
            </div>
            <Button size="sm" onClick={() => addItem(item, 1)}>
              Добавить
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
