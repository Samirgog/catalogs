import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { setForcedTutorialSection } from './storage';
import type { TutorialSectionId } from './types';
import { cn } from '@/lib/utils';

type SectionOption = {
  id: TutorialSectionId;
  title: string;
  requiresCatalog?: boolean;
};

const sectionOptions: SectionOption[] = [
  {
    id: 'catalogs',
    title: 'Список каталогов',
  },
  {
    id: 'catalog_editor',
    title: 'Редактор каталога',
    requiresCatalog: true,
  },
  {
    id: 'categories_editor',
    title: 'Категории и товары',
    requiresCatalog: true,
  },
  {
    id: 'item_editor',
    title: 'Редактор товара или услуги',
    requiresCatalog: true,
  },
  {
    id: 'staff',
    title: 'Сотрудники и уведомления',
    requiresCatalog: true,
  },
  {
    id: 'links',
    title: 'Ссылки и QR',
    requiresCatalog: true,
  },
];

const resolveCatalogIdFromPath = (path: string) => {
  const patterns = [
    /\/catalogs\/([^/]+)\/edit/,
    /\/catalogs\/([^/]+)\/links/,
    /\/categories\/editor\/([^/]+)/,
    /\/categories\/([^/]+)\/item-editor\/[^/]+(?:\/[^/]+)?/,
    /\/staff\/([^/]+)/,
    /\/actions\/editor\/([^/]+)/,
    /\/catalogs\/([^/]+)\/fulfillment/,
  ];

  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
};

type Props = {
  currentSection: TutorialSectionId;
};

export function BusinessTutorialLauncher({ currentSection }: Props) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const catalogId = useMemo(() => {
    return (
      resolveCatalogIdFromPath(location.pathname) ||
      localStorage.getItem('business-current-catalog-id')
    );
  }, [location.pathname]);

  const currentOption = sectionOptions.find(
    (section) => section.id === currentSection
  );

  const startSection = (sectionId: TutorialSectionId) => {
    setForcedTutorialSection(sectionId);
    setOpen(false);
  };

  if (!currentOption) return null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('h-10 w-10 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50')}
          aria-label="Открыть помощь"
        >
          <CircleHelp className="w-5 h-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Помощь по интерфейсу</DrawerTitle>
          <DrawerDescription>
            Подсказки доступны для текущего экрана.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-2 px-4 pb-6 overflow-auto">
          <Button
            variant="outline"
            className="w-full justify-start"
            disabled={Boolean(currentOption.requiresCatalog && !catalogId)}
            onClick={() => startSection(currentOption.id)}
          >
            {currentOption.title}
          </Button>
          {currentOption.requiresCatalog && !catalogId && (
            <p className="text-xs text-muted-foreground">
              Чтобы запустить подсказки, сначала откройте каталог.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
