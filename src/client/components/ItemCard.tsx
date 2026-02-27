import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import type { Item, CatalogSubtype, CatalogType } from "../../types";
import { ItemActions } from "./ItemActions";

type Props = {
  srcImage?: string;
  title?: string;
  price?: number;
  description?: string;
  item: Item;
  businessType?: CatalogType;
  businessSubtype?: CatalogSubtype;
};

export function ItemCard({
  srcImage,
  title,
  description,
  item,
  businessType = 'goods',
  businessSubtype,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        className="glass-card overflow-hidden cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <CardContent className="flex gap-4 p-3">
          <img
            src={srcImage}
            className="h-20 w-20 rounded-xl object-cover"
          />
          <div className="flex flex-1 flex-col">
              <div className="flex flex-col">
                <h3 className="font-medium text-base">{title}</h3>
                {description && <h5 className="font-normal text-muted-foreground text-xs mt-1">{description}</h5>}
              </div>

              <ItemActions
                item={item}
                businessType={businessType}
                businessSubtype={businessSubtype}
              />
            </div>
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
