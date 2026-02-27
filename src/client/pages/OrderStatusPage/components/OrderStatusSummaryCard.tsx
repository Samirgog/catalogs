import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order } from '@/types';
import { getReadableOrderNumber } from '../../../utils/currentOrder';
import { getFulfillmentLabel } from '../../../utils/presentation';
import type { StatusMeta } from '../statusMeta';

type Props = {
  orderWord: string;
  order: Order;
  statusMeta: StatusMeta;
};

export function OrderStatusSummaryCard({ orderWord, order, statusMeta }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          {orderWord} №{getReadableOrderNumber(order)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Статус</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${statusMeta.className}`}
          >
            {statusMeta.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{statusMeta.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Сумма</span>
          <span className="font-semibold">{order.total_price} ₽</span>
        </div>
        {order.fulfillment_method && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Способ получения</span>
            <span className="font-medium">
              {getFulfillmentLabel(order.fulfillment_method)}
            </span>
          </div>
        )}
        {order.delivery_address && (
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm text-muted-foreground">Адрес</span>
            <span className="font-medium text-right break-words">
              {order.delivery_address}
            </span>
          </div>
        )}
        {order.table_number && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Столик</span>
            <span className="font-medium">{order.table_number}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
