import { Card, CardContent } from "@/components/ui/card";
import type { Item, CatalogType } from "../../types";
import { ItemActions } from "./ItemActions";

type Props = {
  srcImage?: string;
  title?: string;
  price?: number;
  description?: string;
  item: Item;
  businessType?: CatalogType;
};

export function ItemCard({ srcImage, title, description, item, businessType = 'goods' }: Props) {
  return (
    <Card className="glass-card overflow-hidden">
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

            <ItemActions item={item} businessType={businessType} />
        </div>
      </CardContent>
    </Card>
  );
}
