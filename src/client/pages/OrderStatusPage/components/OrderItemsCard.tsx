import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  items: Record<string, unknown>[];
  orderWord: string;
};

export function OrderItemsCard({ items, orderWord }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Позиции</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {orderWord === 'Запись'
              ? 'Состав записи отсутствует.'
              : 'Состав заказа отсутствует.'}
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const title = String(item.title ?? 'Позиция');
              const quantity = Number(item.quantity ?? 1);
              const price = Number(item.price ?? 0);
              return (
                <div
                  key={`${title}-${index}`}
                  className="flex items-center justify-between border-b border-border/20 pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{quantity} шт.</p>
                  </div>
                  <p className="font-semibold">{price * quantity} ₽</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
