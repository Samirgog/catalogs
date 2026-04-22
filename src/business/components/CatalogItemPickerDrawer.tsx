import { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { relatedItemsService } from '../services/relatedItems';
import type { Item } from '@/types';

type Props = {
  catalogId: string;
  title: string;
  buttonLabel: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function CatalogItemPickerDrawer({
  catalogId,
  title,
  buttonLabel,
  selectedIds,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await relatedItemsService.listCatalogItems(catalogId);
        if (!isMounted) return;
        setItems(data);
      } catch {
        setItems([]);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [catalogId]);

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      item.title.toLowerCase().includes(normalized) ||
      (item.description || '').toLowerCase().includes(normalized)
    );
  }, [items, search]);

  const toggleItem = (itemId: string) => {
    if (selectedIds.includes(itemId)) {
      onChange(selectedIds.filter((id) => id !== itemId));
      return;
    }
    onChange([...selectedIds, itemId]);
  };

  const selectedCount = selectedIds.length;

  return (
    <>
      <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setOpen(true)}>
        <span>{buttonLabel}</span>
        <span className="text-xs text-muted-foreground">{selectedCount} шт.</span>
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[86vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] space-y-3 overflow-y-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск товаров"
                className="pl-9"
              />
            </div>
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full rounded-2xl border p-3 flex items-center gap-3 text-left ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border/60 bg-background'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-secondary/60" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
            <DrawerClose asChild>
              <Button className="w-full">Готово</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
