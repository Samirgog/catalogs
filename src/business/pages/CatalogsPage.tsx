import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCatalogs } from '../hooks/useCatalogs';
import { toast } from 'sonner';
import { useCurrentUser } from '@/useTelegramAuth';
import { Spinner } from '@/components/ui/spinner';
import { EmptyLottie } from '@/components/empty-lottie';
import { getTelegramUser } from '@/lib/telegram';
import { BusinessTutorialLauncher } from '../tutorial/BusinessTutorialLauncher';
import { TourOverlay } from '../tutorial/TourOverlay';
import { useSectionTutorial } from '../tutorial/useSectionTutorial';
import type { TutorialStep } from '../tutorial/types';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { catalogAccessService } from '../services/catalogAccess';
import { showRequestError } from '../utils/request-feedback';

const catalogsTutorialBaseSteps: TutorialStep[] = [
  {
    id: 'header',
    target: '[data-tour="catalogs-header"]',
    title: 'Ваши каталоги',
    description:
      'Здесь отображаются все созданные каталоги и их текущий статус.',
  },
  {
    id: 'join',
    target: '[data-tour="catalogs-join"]',
    title: 'Подключение по коду',
    description:
      'Если вам выдали код доступа к каталогу, введите его здесь и подключите каталог в свой список.',
  },
  {
    id: 'create',
    target: '[data-tour="catalogs-create"]',
    title: 'Создание нового каталога',
    description:
      'Нажмите кнопку, чтобы создать новый каталог товаров или услуг.',
  },
  {
    id: 'support',
    target: '[data-tour="catalogs-support"]',
    title: 'Связь с поддержкой',
    description: 'Если нужна помощь по настройке, используйте эту кнопку.',
  },
];

export function CatalogsPage() {
  const { catalogs, loading, error, refetch } = useCatalogs();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const tgUser = getTelegramUser();
  const telegramPhoto = tgUser?.photo_url || '';
  const avatarText = user?.first_name?.[0] || user?.username?.[0] || 'U';
  const tutorialSteps: TutorialStep[] = catalogs.length
    ? [
        ...catalogsTutorialBaseSteps.slice(0, 1),
        {
          id: 'card',
          target: '[data-tour="catalogs-card"]',
          title: 'Карточка каталога',
          description:
            'Откройте карточку, чтобы перейти к настройкам конкретного каталога.',
        },
        ...catalogsTutorialBaseSteps.slice(1),
      ]
    : [
        ...catalogsTutorialBaseSteps.slice(0, 1),
        {
          id: 'empty',
          target: '[data-tour="catalogs-empty"]',
          title: 'Пустой список',
          description:
            'Сейчас каталогов нет. Создайте первый, чтобы начать работу.',
        },
        ...catalogsTutorialBaseSteps.slice(1),
      ];
  const tutorial = useSectionTutorial('catalogs', tutorialSteps, {
    enabled: !loading && !error,
  });
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!error) return;
    showRequestError(error, {
      retryLabel: 'Обновить',
      onRetry: () => window.location.reload(),
    });
  }, [error]);

  const handleEditCatalog = (catalogId: string) => {
    navigate(`/catalogs/${catalogId}/edit`);
  };

  const handleCreateCatalog = () => {
    navigate('/catalogs/new');
  };

  const handleSupport = () => {
    const supportUsername = (
      import.meta.env.VITE_SUPPORT_TELEGRAM || 'samir_gafaroff'
    ).replace('@', '');
    const text = encodeURIComponent(
      'Здравствуйте! Нужна помощь по настройке каталога.'
    );
    window.open(`https://t.me/${supportUsername}?text=${text}`, '_blank');
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim() || !user?.id) return;
    try {
      setIsJoining(true);
      await catalogAccessService.acceptInvite(inviteCode, user.id);
      setInviteCode('');
      await refetch();
      toast.success('Каталог подключен');
    } catch (err) {
      showRequestError(
        err instanceof Error ? err.message : 'Не удалось подключить каталог',
        {
          onRetry: () => {
            void refetch();
          },
        }
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div
        className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0"
        data-tour="catalogs-header"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Каталоги</h1>
            <p className="text-sm text-muted-foreground">
              Управление каталогами
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BusinessTutorialLauncher currentSection="catalogs" />
            {telegramPhoto ? (
              <img
                src={telegramPhoto}
                alt="User avatar"
                className="w-10 h-10 rounded-full object-cover border border-border/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                <span className="text-lg font-bold uppercase">
                  {avatarText}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading && (
          <div className="text-center py-8">
            <div className="text-lg flex items-center justify-center gap-2">
              <Spinner />
              <span>Загрузка каталогов...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            <div className="text-lg">Ошибка загрузки: {error}</div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Повторить попытку
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            <Card
              data-tour="catalogs-join"
              className="overflow-hidden border-primary/15 bg-gradient-to-br from-white/80 via-white/60 to-primary/5"
            >
              <CardHeader>
                <CardTitle>Подключить каталог по коду</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Если владелец дал вам код доступа, введите его здесь.
                </p>
                <div className="glass-card rounded-2xl p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Например: A1B2C3"
                      className="h-12 tracking-[0.25em] text-center sm:text-left font-medium uppercase"
                    />
                    <Button
                      className="h-12 sm:px-6"
                      onClick={handleJoinByCode}
                      disabled={isJoining || !inviteCode.trim()}
                    >
                      {isJoining ? 'Подключаем...' : 'Подключить'}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Код не чувствителен к регистру. После подключения каталог появится в списке ниже.
                  </p>
                </div>
              </CardContent>
            </Card>
            {catalogs.length === 0 && (
              <Card
                className="p-6 text-center space-y-3"
                data-tour="catalogs-empty"
              >
                <div className="flex justify-center">
                  <EmptyLottie
                    src={`${import.meta.env.BASE_URL}empty_ghost.lottie`}
                    className="w-44 h-44"
                  />
                </div>
                <h3 className="text-lg font-semibold">Каталогов пока нет</h3>
                <p className="text-sm text-muted-foreground">
                  Создайте свой первый каталог, чтобы начать принимать заказы.
                </p>
              </Card>
            )}
            {catalogs.map((catalog, index) => (
              <Card
                key={catalog.id}
                className="overflow-hidden cursor-pointer"
                data-tour={index === 0 ? 'catalogs-card' : undefined}
                onClick={() => handleEditCatalog(catalog.id)}
              >
                <div className="relative h-36 overflow-hidden">
                  {catalog.banner_url ? (
                    <img
                      src={catalog.banner_url}
                      alt={catalog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center">
                      <span className="text-white font-medium text-5xl">
                        {catalog.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <Badge
                    variant={catalog.is_active ? 'default' : 'secondary'}
                    className={`absolute top-3 right-3 ${catalog.is_active ? 'bg-green-500/90 backdrop-blur-sm' : 'bg-secondary/80 backdrop-blur-sm'}`}
                  >
                    {catalog.is_active ? 'Активный' : 'Черновик'}
                  </Badge>
                </div>

                <div className="p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-lg">{catalog.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {new Date(catalog.updated_at).toLocaleDateString(
                          'ru-RU'
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9"
                        onClick={e => {
                          e.stopPropagation();
                          handleEditCatalog(catalog.id);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-4 right-4">
        <Button
          data-tour="catalogs-create"
          className="w-full h-14 text-base"
          onClick={handleCreateCatalog}
        >
          <Plus className="w-5 h-5 mr-2" />
          Создать каталог
        </Button>
        <Button
          data-tour="catalogs-support"
          variant="outline"
          className="w-full h-12 mt-2"
          onClick={handleSupport}
        >
          <LifeBuoy className="w-4 h-4 mr-2" />
          Связаться с поддержкой
        </Button>
      </div>
      <TourOverlay
        open={tutorial.open}
        steps={tutorialSteps}
        sectionTitle="Список каталогов"
        onClose={tutorial.closeAndMarkSeen}
        onComplete={tutorial.complete}
      />
    </div>
  );
}
