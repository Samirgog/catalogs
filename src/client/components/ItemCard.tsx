import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import type { Item, CatalogSubtype, CatalogType } from "../../types";
import { ItemActions } from "./ItemActions";
import { ItemCardContent } from '@/components/item/ItemCardContent';
import { useFavoritesStore } from '../stores/favorites';
import { useCurrentUser } from '@/useTelegramAuth';
import { customerIntelligenceService } from '../services/customerIntelligence';

type Props = {
  catalogId: string;
  srcImage?: string;
  title?: string;
  price?: number;
  description?: string;
  item: Item;
  businessType?: CatalogType;
  businessSubtype?: CatalogSubtype;
};

export function ItemCard({
  catalogId,
  srcImage,
  title,
  description,
  item,
  businessType = 'goods',
  businessSubtype,
}: Props) {
  const [open, setOpen] = useState(false);
  const { userId } = useCurrentUser();
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(catalogId, item.id));

  const handleOpen = () => {
    setOpen(true);
    void customerIntelligenceService.trackEvent({
      catalogId,
      customerId: userId,
      eventType: 'item_view',
      metadata: {
        item_id: item.id,
        item_title: item.title,
      },
    });
  };

  const handleFavoriteToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const nextFavorite = toggleFavorite(catalogId, {
      id: item.id,
      title: item.title,
      price: item.price,
      image_url: item.image_url,
      description: item.description,
      category_id: item.category_id,
    });

    void customerIntelligenceService.trackEvent({
      catalogId,
      customerId: userId,
      eventType: nextFavorite ? 'favorite_add' : 'favorite_remove',
      metadata: {
        item_id: item.id,
        item_title: item.title,
      },
    });
    void customerIntelligenceService.syncFavorite(
      nextFavorite ? 'add' : 'remove',
      catalogId,
      userId || '',
      item.id
    );
  };

  return (
    <>
      <Card
        className="glass-card overflow-hidden cursor-pointer relative"
        onClick={handleOpen}
      >
        <button
          type="button"
          className={`absolute right-3 top-3 z-10 h-9 w-9 rounded-full border backdrop-blur-sm flex items-center justify-center ${
            isFavorite
              ? 'border-rose-200 bg-rose-50/95 text-rose-500'
              : 'border-border/60 bg-background/90 text-muted-foreground'
          }`}
          onClick={handleFavoriteToggle}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <CardContent className="flex gap-4 p-3">
          <ItemCardContent
            imageUrl={srcImage}
            imageAlt={title}
            title={title}
            description={description}
            showPrice={false}
            fallbackImage={<div className="h-20 w-20 rounded-xl bg-secondary/40" />}
            titleClassName="font-medium text-base"
            descriptionClassName="font-normal text-muted-foreground text-xs mt-1"
            actions={
              <ItemActions
                catalogId={catalogId}
                item={item}
                businessType={businessType}
                businessSubtype={businessSubtype}
              />
            }
          />
        </CardContent>
      </Card>

      <Drawer open={open} onClose={() => setOpen(false)} direction="bottom">
        <DrawerContent className="rounded-t-2xl p-0 max-h-[90vh]">
          <DrawerHeader className="p-4 border-b">
            <DrawerTitle className="text-left">{item.title}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4 overflow-y-auto">
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-52 object-cover rounded-xl"
              />
            )}
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
            {item.detailed_description && (
              <p className="text-sm whitespace-pre-wrap">{item.detailed_description}</p>
            )}
            {typeof item.price === 'number' && (
              <p className="text-xl font-semibold">{item.price} ₽</p>
            )}
            <div>
              <ItemActions
                catalogId={catalogId}
                item={item}
                businessType={businessType}
                businessSubtype={businessSubtype}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
