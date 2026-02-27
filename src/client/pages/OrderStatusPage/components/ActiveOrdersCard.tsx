import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUS_META } from '../statusMeta';

type ActiveOrder = {
  id: string;
  orderNumber: string;
  status: string;
};

type Props = {
  activeOrders: ActiveOrder[];
  onOpenOrder: (id: string) => void;
};

export function ActiveOrdersCard({ activeOrders, onOpenOrder }: Props) {
  if (activeOrders.length === 0) return null;

  return (
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
              Статус: {STATUS_META[item.status]?.label || item.status}
            </p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
