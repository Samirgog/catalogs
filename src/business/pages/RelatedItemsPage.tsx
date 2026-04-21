import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Plus, Search, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { relatedItemsService } from '../services/relatedItems';
import type { Item, RelatedItemLink } from '@/types';
import { toast } from 'sonner';

type PickerMode = 'source' | 'related' | null;

const ItemMiniCard = ({
  item,
  onClick,
}: {
  item: Item;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left rounded-2xl border border-border/60 p-3 flex items-center gap-3"
  >
    {item.image_url ? (
      <img
        src={item.image_url}
        alt={item.title}
        className="h-14 w-14 rounded-2xl object-cover"
      />
    ) : (
      <div className="h-14 w-14 rounded-2xl bg-secondary/60" />
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
  </button>
);

export function RelatedItemsPage() {
  const { catalogId = '' } = useParams<{ catalogId: string }>();
  useAutoBackButton(`/catalogs/${catalogId}/growth`);
  const [links, setLinks] = useState<RelatedItemLink[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [sourceItemId, setSourceItemId] = useState('');
  const [relatedItemId, setRelatedItemId] = useState('');
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [itemsData, linksData] = await Promise.all([
          relatedItemsService.listCatalogItems(catalogId),
          relatedItemsService.list(catalogId),
        ]);
        if (!isMounted) return;
        setItems(itemsData);
        setLinks(linksData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Не удалось загрузить связи');
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [catalogId]);

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return items.filter((item) => {
      if (pickerMode === 'related' && item.id === sourceItemId) return false;
      if (!normalizedSearch) return true;
      return (
        item.title.toLowerCase().includes(normalizedSearch) ||
        (item.description || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [items, pickerMode, search, sourceItemId]);

  const sourceItem = itemsById.get(sourceItemId);
  const relatedItem = itemsById.get(relatedItemId);

  const handleSelect = (itemId: string) => {
    if (pickerMode === 'source') {
      setSourceItemId(itemId);
      if (relatedItemId === itemId) {
        setRelatedItemId('');
      }
    }
    if (pickerMode === 'related') {
      setRelatedItemId(itemId);
    }
    setPickerMode(null);
    setSearch('');
  };

  const handleAdd = async () => {
    if (!sourceItemId || !relatedItemId || sourceItemId === relatedItemId) return;
    try {
      const created = await relatedItemsService.create({
        catalog_id: catalogId,
        source_item_id: sourceItemId,
        related_item_id: relatedItemId,
      });
      setLinks((current) => [created, ...current]);
      setRelatedItemId('');
      toast.success('Связь для допродажи сохранена');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить связь');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await relatedItemsService.remove(id);
      setLinks((current) => current.filter((link) => link.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить связь');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <h1 className="text-2xl font-bold">Связанные товары</h1>
        <p className="text-sm text-muted-foreground">
          Настрой понятные допродажи через выбор карточек товаров
        </p>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Новая связь</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              type="button"
              className="w-full rounded-2xl border border-border/60 p-4 text-left"
              onClick={() => setPickerMode('source')}
            >
              <div className="text-xs text-muted-foreground mb-1">Если покупают</div>
              <div className="font-medium">
                {sourceItem?.title || 'Выбрать товар'}
              </div>
            </button>

            <div className="flex justify-center">
              <div className="h-10 w-10 rounded-full bg-secondary/70 flex items-center justify-center">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            <button
              type="button"
              className="w-full rounded-2xl border border-border/60 p-4 text-left"
              onClick={() => setPickerMode('related')}
            >
              <div className="text-xs text-muted-foreground mb-1">То предложить</div>
              <div className="font-medium">
                {relatedItem?.title || 'Выбрать товар для допродажи'}
              </div>
            </button>

            <Button className="w-full" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Сохранить связь
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Текущие рекомендации</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {links.length > 0 ? (
              links.map((link) => (
                <div key={link.id} className="rounded-2xl border border-border/60 p-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Если покупают</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>Предлагать</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    <div className="rounded-2xl bg-secondary/50 p-3 min-w-0">
                      <div className="font-medium truncate">
                        {itemsById.get(link.source_item_id)?.title || 'Товар'}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="rounded-2xl bg-primary/10 p-3 min-w-0">
                      <div className="font-medium truncate">
                        {itemsById.get(link.related_item_id)?.title || 'Товар'}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => handleRemove(link.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить связь
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Пока нет связей для допродаж.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Drawer open={pickerMode !== null} onOpenChange={(open) => !open && setPickerMode(null)}>
        <DrawerContent className="max-h-[86vh]">
          <DrawerHeader>
            <DrawerTitle>
              {pickerMode === 'source'
                ? 'Выберите основной товар'
                : 'Выберите товар для допродажи'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] space-y-3 overflow-y-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск товара"
                className="pl-9"
              />
            </div>

            <div className="space-y-2">
              {filteredItems.map((item) => (
                <DrawerClose asChild key={item.id}>
                  <div>
                    <ItemMiniCard item={item} onClick={() => handleSelect(item.id)} />
                  </div>
                </DrawerClose>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
