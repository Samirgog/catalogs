import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrderStatusLabel } from '@/shared/orderStatus';

type ActiveOrder = {
  id: string;
  orderNumber: string;
  status: string;
};

type Props = {
  activeOrders: ActiveOrder[];
  archiveOrders?: ActiveOrder[];
  onOpenOrder: (id: string) => void;
};

export function ActiveOrdersCard({
  activeOrders,
  archiveOrders = [],
  onOpenOrder,
}: Props) {
  if (activeOrders.length === 0 && archiveOrders.length === 0) return null;

  return (
    <div className="space-y-4">
      {activeOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Активные заказы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeOrders.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenOrder(item.id)}
                className="w-full text-left rounded-xl border p-3 hover:bg-secondary/40"
              >
                <p className="font-medium">№{item.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  Статус: {getOrderStatusLabel(item.status)}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {archiveOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Архив заказов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {archiveOrders.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenOrder(item.id)}
                className="w-full text-left rounded-xl border p-3 hover:bg-secondary/40"
              >
                <p className="font-medium">№{item.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  Статус: {getOrderStatusLabel(item.status)}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
