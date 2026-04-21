import { useEffect, useMemo, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { customerInsightsService } from '../services/customerInsights';
import type { CustomerProfile } from '@/types';

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'new', label: 'Новые' },
  { id: 'regular', label: 'Постоянные' },
  { id: 'vip', label: 'VIP' },
  { id: 'lost', label: 'Без заказа 30 дней' },
  { id: 'abandoned', label: 'Бросили корзину' },
] as const;

const statusLabel: Record<CustomerProfile['status'], string> = {
  new: 'Новый',
  regular: 'Постоянный',
  vip: 'VIP',
  lost: 'Нужен возврат',
  no_orders: 'Без заказа',
};

export function CustomersPage() {
  const navigate = useNavigate();
  const { catalogId = '' } = useParams<{ catalogId: string }>();
  useAutoBackButton(`/catalogs/${catalogId}/growth`);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const data = await customerInsightsService.getProfiles(catalogId);
      if (!isMounted) return;
      setCustomers(data);
      setLoading(false);
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [catalogId]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        !search.trim() ||
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        (customer.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (customer.phone || '').includes(search);

      if (!matchesSearch) return false;
      if (filter === 'all') return true;
      if (filter === 'abandoned') return customer.orders_count === 0;
      return customer.status === filter;
    });
  }, [customers, filter, search]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0 space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Клиенты</h1>
          <p className="text-sm text-muted-foreground">
            CRM-карточки клиентов в мобильном формате
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по имени, username, телефону"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-full px-4 h-9 text-sm border ${
                filter === item.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-10">
            <Spinner className="h-7 w-7" />
          </div>
        )}

        {!loading &&
          filteredCustomers.map((customer) => (
            <Card
              key={customer.customer_id}
              className="cursor-pointer"
              onClick={() =>
                navigate(`/catalogs/${catalogId}/customers/${customer.customer_id}`)
              }
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {customer.username ? `@${customer.username}` : 'Без username'}
                    </div>
                  </div>
                  <Badge variant={customer.status === 'vip' ? 'default' : 'secondary'}>
                    {statusLabel[customer.status]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-secondary/50 p-3">
                    <div className="text-muted-foreground">Заказов</div>
                    <div className="font-semibold">{customer.orders_count}</div>
                  </div>
                  <div className="rounded-2xl bg-secondary/50 p-3">
                    <div className="text-muted-foreground">Выручка</div>
                    <div className="font-semibold">
                      {Math.round(customer.total_spent)} ₽
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Первый визит: {customer.first_visit_at?.slice(0, 10) || '—'}</span>
                  <span>Последний визит: {customer.last_visit_at?.slice(0, 10) || '—'}</span>
                </div>
                {customer.favorite_items.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="truncate">
                      Любит: {customer.favorite_items.map((item) => item.title).join(', ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
