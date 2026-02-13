import { ItemCard } from "./ItemCard";
import type { CatalogType, Item } from "../../types";

type Props = {
  id: string;
  title: string;
  items: Item[];
  businessType?: CatalogType;
};

export function CategorySection({ id, title, items, businessType = 'goods' }: Props) {
    return (
        <section id={id} className="scroll-mt-20">
          <h2 className="mb-3 text-xl font-semibold">{title}</h2>
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