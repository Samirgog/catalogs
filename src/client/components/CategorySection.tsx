import { ItemCard } from "./ItemCard";
import type { CatalogType, Item } from "../../types";

type Props = {
  id: string;
  title: string;
  items: Item[];
  businessType?: CatalogType;
};

export function CategorySection({ id, title, items, businessType = 'goods' }: Props) {
    const visibleItems = items
      .filter(item => item.is_available)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    return (
        <section id={id} className="scroll-mt-20">
          <h2 className="mb-3 text-xl font-semibold">{title}</h2>
          <div className="grid gap-3">
            {visibleItems.map((item) => {
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
