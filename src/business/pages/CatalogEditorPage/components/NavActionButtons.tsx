import { Button } from '@/components/ui/button';
import { FolderOpen, KeyRound, Link, Settings, Truck, Users } from 'lucide-react';

type Props = {
  isSavingCatalog: boolean;
  onConfigureCategories: () => void;
  onConfigureActions: () => void;
  onConfigureFulfillment: () => void;
  onGenerateLink: () => void;
  onConfigureStaff: () => void;
  onConfigureAccess: () => void;
};

export function NavActionButtons({
  isSavingCatalog,
  onConfigureCategories,
  onConfigureActions,
  onConfigureFulfillment,
  onGenerateLink,
  onConfigureStaff,
  onConfigureAccess,
}: Props) {
  return (
    <div className="space-y-3" data-tour="catalog-editor-nav-actions">
      <Button
        variant="outline"
        className="w-full h-12 justify-start"
        onClick={onConfigureCategories}
        disabled={isSavingCatalog}
      >
        <FolderOpen className="w-4 h-4 mr-2" />
        Настроить категории
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 justify-start"
        onClick={onConfigureActions}
        disabled={isSavingCatalog}
      >
        <Settings className="w-4 h-4 mr-2" />
        Способы оплаты и действия
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 justify-start"
        onClick={onConfigureFulfillment}
        disabled={isSavingCatalog}
      >
        <Truck className="w-4 h-4 mr-2" />
        Способы получения
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 justify-start"
        onClick={onGenerateLink}
        disabled={isSavingCatalog}
      >
        <Link className="w-4 h-4 mr-2" />
        Получить ссылку и QR-код
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 justify-start"
        onClick={onConfigureAccess}
        disabled={isSavingCatalog}
      >
        <KeyRound className="w-4 h-4 mr-2" />
        Доступ к каталогу
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 justify-start"
        onClick={onConfigureStaff}
        disabled={isSavingCatalog}
      >
        <Users className="w-4 h-4 mr-2" />
        Сотрудники и уведомления
      </Button>
    </div>
  );
}
