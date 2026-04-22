import {
  BarChart3,
  ChevronRight,
  HeartHandshake,
  Megaphone,
  Repeat2,
  Users2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';

const sections = [
  {
    title: 'Клиенты и CRM',
    description: 'Список клиентов, история заказов, любимые товары и сегменты.',
    icon: Users2,
    path: 'customers',
  },
  {
    title: 'Аналитика',
    description: 'Повторные продажи, воронка, средний чек и источники трафика.',
    icon: BarChart3,
    path: 'analytics',
  },
  {
    title: 'Связанные товары',
    description: 'Ручные допродажи и рекомендации к корзине.',
    icon: Repeat2,
    path: 'related',
  },
  {
    title: 'Рассылки и сегменты',
    description: 'Массовые сообщения, промокоды и выбор аудитории.',
    icon: Megaphone,
    path: 'campaigns',
  },
  {
    title: 'Автосценарии',
    description: 'Напоминания, возврат клиентов и VIP-механики.',
    icon: HeartHandshake,
    path: 'automations',
  },
];

export function GrowthHubPage() {
  const navigate = useNavigate();
  const { catalogId = '' } = useParams<{ catalogId: string }>();
  useAutoBackButton(`/catalogs/${catalogId}/edit`);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <h1 className="text-2xl font-bold">Рост и CRM</h1>
        <p className="text-sm text-muted-foreground">
          Клиенты, повторные продажи и удержание в одном мобильном разделе
        </p>
      </div>

      <div className="p-4 space-y-3">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <Card
              key={section.path}
              className="cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => navigate(`/catalogs/${catalogId}/${section.path}`)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{section.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {section.description}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
