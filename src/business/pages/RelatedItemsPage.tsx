import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { relatedItemsService } from '../services/relatedItems';
import type { Item, RelatedItemLink } from '@/types';
import { toast } from 'sonner';

export function RelatedItemsPage() {
  const { catalogId = '' } = useParams<{ catalogId: string }>();
  useAutoBackButton(`/catalogs/${catalogId}/growth`);
  const [links, setLinks] = useState<RelatedItemLink[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [sourceItemId, setSourceItemId] = useState('');
  const [relatedItemId, setRelatedItemId] = useState('');

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
          Настрой, что предложить клиенту к основному товару
        </p>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Новая связь</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={sourceItemId} onValueChange={setSourceItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Если покупают..." />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={relatedItemId} onValueChange={setRelatedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="То предложить..." />
              </SelectTrigger>
              <SelectContent>
                {items
                  .filter((item) => item.id !== sourceItemId)
                  .map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
                <div key={link.id} className="rounded-2xl border border-border/60 p-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {itemsById.get(link.source_item_id)?.title || 'Товар'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Предлагать: {itemsById.get(link.related_item_id)?.title || 'Товар'}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(link.id)}>
                    <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
