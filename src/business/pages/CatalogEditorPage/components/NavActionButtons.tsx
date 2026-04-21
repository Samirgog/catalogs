import { FolderOpen, KeyRound, Link, Settings, Sparkles, Truck, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  isSavingCatalog: boolean;
  itemsLabel: string;
  onConfigureCategories: () => void;
  onConfigureActions: () => void;
  onConfigureFulfillment: () => void;
  onGenerateLink: () => void;
  onConfigureStaff: () => void;
  onConfigureAccess: () => void;
  onOpenGrowth: () => void;
};

export function NavActionButtons({
  isSavingCatalog,
  itemsLabel,
  onConfigureCategories,
  onConfigureActions,
  onConfigureFulfillment,
  onGenerateLink,
  onConfigureStaff,
  onConfigureAccess,
  onOpenGrowth,
}: Props) {
  return (
    <div className="space-y-4" data-tour="catalog-editor-nav-actions">
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Основные разделы</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: itemsLabel, icon: FolderOpen, onClick: onConfigureCategories },
            { label: 'Оплата', icon: Settings, onClick: onConfigureActions },
            { label: 'Получение', icon: Truck, onClick: onConfigureFulfillment },
            { label: 'Ссылка и QR', icon: Link, onClick: onGenerateLink },
            { label: 'Доступ', icon: KeyRound, onClick: onConfigureAccess },
            { label: 'Сотрудники', icon: Users, onClick: onConfigureStaff },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.label}
                className={`cursor-pointer ${isSavingCatalog ? 'opacity-60 pointer-events-none' : ''}`}
                onClick={action.onClick}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-medium text-sm">{action.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card
        className={`cursor-pointer overflow-hidden ${isSavingCatalog ? 'opacity-60 pointer-events-none' : ''}`}
        onClick={onOpenGrowth}
      >
        <CardContent className="p-4 flex items-center gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Рост и CRM</div>
            <div className="text-sm text-muted-foreground">
              Клиенты, аналитика, допродажи и удержание
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
