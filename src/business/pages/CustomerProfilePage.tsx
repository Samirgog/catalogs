import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { customerInsightsService } from '../services/customerInsights';
import type { CustomerEvent, CustomerNote, CustomerProfile, CustomerTag, Order } from '@/types';

export function CustomerProfilePage() {
  const { catalogId = '', customerId = '' } = useParams<{
    catalogId: string;
    customerId: string;
  }>();
  useAutoBackButton(`/catalogs/${catalogId}/customers`);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const data = await customerInsightsService.getProfileDetail(catalogId, customerId);
      if (!isMounted) return;
      setProfile(data.profile);
      setOrders(data.orders);
      setEvents(data.events);
      setNotes(data.notes);
      setTags(data.tags);
      setLoading(false);
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [catalogId, customerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-4">Клиент не найден</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <h1 className="text-2xl font-bold">{profile.name}</h1>
        <p className="text-sm text-muted-foreground">
          {profile.username ? `@${profile.username}` : 'Без username'}
        </p>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-xs text-muted-foreground">Выручка</div>
              <div className="font-semibold">{Math.round(profile.revenue)} ₽</div>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-xs text-muted-foreground">Средний чек</div>
              <div className="font-semibold">
                {Math.round(profile.average_check)} ₽
              </div>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-xs text-muted-foreground">Первый визит</div>
              <div className="font-semibold">{profile.first_visit_at?.slice(0, 10) || '—'}</div>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-xs text-muted-foreground">Источник</div>
              <div className="font-semibold">{profile.source || '—'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Теги клиента</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag) => <Badge key={tag.id}>{tag.tag}</Badge>)
            ) : (
              <p className="text-sm text-muted-foreground">Теги еще не назначены.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>История заказов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border/60 p-3">
                  <div className="font-medium">Заказ #{order.order_number || '—'}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.created_at.slice(0, 10)} • {Math.round(order.total_price)} ₽
                  </div>
                  <div className="text-sm mt-1">Статус: {order.status}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Заказов пока нет.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>События в приложении</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className="rounded-2xl border border-border/60 p-3">
                  <div className="font-medium">{event.event_type}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.created_at.slice(0, 16).replace('T', ' ')} • {event.source}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">События пока не накоплены.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Комментарии менеджера</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.length > 0 ? (
              notes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-border/60 p-3">
                  <div className="text-sm whitespace-pre-wrap">{note.note}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Комментарии еще не добавлены.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
