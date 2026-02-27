import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SectionOption = {
  id: TutorialSectionId;
  title: string;
  resolvePath: (catalogId?: string) => string;
  requiresCatalog?: boolean;
};

const sectionOptions: SectionOption[] = [
  {
    id: 'catalogs',
    title: 'Список каталогов',
    resolvePath: () => '/catalogs',
  },
  {
    id: 'catalog_editor',
    title: 'Редактор каталога',
    resolvePath: (catalogId) => `/catalogs/${catalogId}/edit`,
    requiresCatalog: true,
  },
  {
    id: 'categories_editor',
    title: 'Категории и товары',
    resolvePath: (catalogId) => `/categories/editor/${catalogId}`,
    requiresCatalog: true,
  },
  {
    id: 'staff',
    title: 'Сотрудники и уведомления',
    resolvePath: (catalogId) => `/staff/${catalogId}`,
    requiresCatalog: true,
  },
  {
    id: 'links',
    title: 'Ссылки и QR',
    resolvePath: (catalogId) => `/catalogs/${catalogId}/links`,
    requiresCatalog: true,
  },
];

const resolveCatalogIdFromPath = (path: string) => {
  const patterns = [
    /\/catalogs\/([^/]+)\/edit/,
    /\/catalogs\/([^/]+)\/links/,
    /\/categories\/editor\/([^/]+)/,
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

export function BusinessTutorialLauncher() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const catalogId = useMemo(() => {
    return (
      resolveCatalogIdFromPath(location.pathname) ||
      localStorage.getItem('business-current-catalog-id')
    );
  }, [location.pathname]);

  const startSection = (section: SectionOption) => {
    if (section.requiresCatalog && !catalogId) {
      toast.error('Сначала откройте нужный каталог');
      return;
    }

    setForcedTutorialSection(section.id);
    const nextPath = section.resolvePath(catalogId ?? undefined);
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
    setOpen(false);
  };

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
            Выберите раздел, по которому хотите посмотреть подсказки.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-2 px-4 pb-6 overflow-auto">
          {sectionOptions.map((section) => (
            <Button
              key={section.id}
              variant="outline"
              className="w-full justify-start"
              disabled={Boolean(section.requiresCatalog && !catalogId)}
              onClick={() => startSection(section)}
            >
              {section.title}
            </Button>
          ))}
          {!catalogId && (
            <p className="text-xs text-muted-foreground">
              Чтобы запустить подсказки по разделам, сначала откройте любой каталог.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
