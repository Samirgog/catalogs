import { ItemCard } from "./ItemCard";
import type { Item } from "../../types";
import { BusinessType } from "../../types";

type Props = {
  id: string;
  title: string;
  items: Item[];
  businessType?: BusinessType;
};

export function CategorySection({ id, title, items, businessType = BusinessType.goods }: Props) {
    return (
        <section id={id} className="scroll-mt-24">
          <h2 className="mb-3 text-lg font-semibold">{title}</h2>
          <div className="grid gap-3">
            {items.map((item) => {
              return (
                <ItemCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  srcImage={item.image_url}
                  price={item.price}
                  item={item}
                  businessType={businessType}
                />
              )
            })}
          </div>
        </section>
      );
}