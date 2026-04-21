import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { customerInsightsService } from '../services/customerInsights';
import type { CatalogAnalyticsSnapshot } from '@/types';
import { getTrafficSourceLabel } from '../utils/customerLabels';

const MetricCard = ({
  title,
  value,
  caption,
}: {
  title: string;
  value: string;
  caption?: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {caption && <div className="text-xs text-muted-foreground mt-2">{caption}</div>}
    </CardContent>
  </Card>
);

const MiniBarChart = ({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; label: string; value: number }>;
}) => {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export function AnalyticsPage() {
  const { catalogId = '' } = useParams<{ catalogId: string }>();
  useAutoBackButton(`/catalogs/${catalogId}/growth`);
  const [analytics, setAnalytics] = useState<CatalogAnalyticsSnapshot | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const data = await customerInsightsService.getAnalytics(catalogId);
      if (!isMounted) return;
      setAnalytics(data);
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [catalogId]);

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <h1 className="text-2xl font-bold">Аналитика</h1>
        <p className="text-sm text-muted-foreground">
          Ключевые метрики удержания и повторных продаж
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard title="Клиентов" value={String(analytics.customers_total)} />
          <MetricCard title="Выручка" value={`${Math.round(analytics.revenue_total)} ₽`} />
          <MetricCard title="Средний чек" value={`${Math.round(analytics.average_check)} ₽`} />
          <MetricCard
            title="Возвраты"
            value={`${analytics.retention_rate.toFixed(0)}%`}
            caption={`${analytics.returning_customers} повторных клиентов`}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Новые клиенты</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-2xl font-bold">{analytics.new_today}</div>
              <div className="text-xs text-muted-foreground">за день</div>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-2xl font-bold">{analytics.new_week}</div>
              <div className="text-xs text-muted-foreground">за неделю</div>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-2xl font-bold">{analytics.new_month}</div>
              <div className="text-xs text-muted-foreground">за месяц</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Конверсия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-sm text-muted-foreground">Вход → корзина</div>
              <div className="text-xl font-bold">
                {analytics.conversion_visit_to_cart.toFixed(0)}%
              </div>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-sm text-muted-foreground">Корзина → заказ</div>
              <div className="text-xl font-bold">
                {analytics.conversion_cart_to_order.toFixed(0)}%
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Брошенных корзин: {analytics.abandoned_carts}. Конверсия считается по уникальным клиентам, а не по числу событий.
            </div>
          </CardContent>
        </Card>

        <MiniBarChart
          title="Популярные товары"
          items={analytics.popular_items.map((item) => ({
            id: item.item_id,
            label: item.title,
            value: item.count,
          }))}
        />

        <MiniBarChart
          title="Товары в избранном"
          items={analytics.favorite_items.map((item) => ({
            id: item.item_id,
            label: item.title,
            value: item.count,
          }))}
        />

        <MiniBarChart
          title="Источники трафика"
          items={analytics.traffic_sources.map((source) => ({
            id: source.source,
            label: getTrafficSourceLabel(source.source),
            value: source.count,
          }))}
        />
      </div>
    </div>
  );
}
