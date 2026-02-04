import { Card, CardContent } from "@/components/ui/card";
import { BusinessType, type Item } from "../../types";
import { ItemActions } from "./ItemActions";

type Props = {
  srcImage?: string;
  title?: string;
  price?: number;
  description?: string;
  item: Item;
  businessType?: BusinessType;
};

export function ItemCard({ srcImage, title, description, item, businessType = BusinessType.goods }: Props) {
  return (
    <Card>
      <CardContent className="flex gap-4 p-3">
        <img
          src={srcImage}
          className="h-20 w-20 rounded-md object-cover"
        />
        <div className="flex flex-1 flex-col">
            <div className="flex flex-col">
              <h3 className="font-medium">{title}</h3>
              {description && <h5 className="font-regular color-gray-500 text-xs">{description}</h5>}
            </div>

            <ItemActions item={item} businessType={businessType} />
        </div>
      </CardContent>
    </Card>
  );
}
