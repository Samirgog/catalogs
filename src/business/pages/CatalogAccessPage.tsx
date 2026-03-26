import { useEffect, useState } from 'react';
import { Copy, RefreshCcw, UserX } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { useCatalogAccess } from '../hooks/useCatalogAccess';
import { useCurrentUser } from '@/useTelegramAuth';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { showRequestError } from '../utils/request-feedback';

export function CatalogAccessPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  const { userId, user } = useCurrentUser();
  useAutoBackButton(catalogId ? `/catalogs/${catalogId}/edit` : '/catalogs');

  const {
    collaborators,
    invite,
    loading,
    error,
    generateInvite,
    refetch,
    revokeAccess,
  } = useCatalogAccess(catalogId || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [revokingAccessId, setRevokingAccessId] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    showRequestError(error, {
      onRetry: () => {
        void refetch();
      },
    });
  }, [error, refetch]);

  const handleGenerate = async () => {
    if (!catalogId || !userId) return;
    try {
      setIsGenerating(true);
      await generateInvite(userId);
      toast.success('Новый код доступа создан');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось создать код');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!invite?.code) return;
    try {
      await navigator.clipboard.writeText(invite.code);
      toast.success('Код скопирован');
    } catch {
      toast.error('Не удалось скопировать код');
    }
  };

  const handleRevoke = async (accessId: string) => {
    try {
      setRevokingAccessId(accessId);
      await revokeAccess(accessId);
      toast.success('Доступ отключен');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Не удалось отключить доступ'
      );
    } finally {
      setRevokingAccessId(null);
    }
  };

  const getCollaboratorName = (user: typeof collaborators[number]['user']) => {
    if (!user) return 'Пользователь';

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    if (user.username) return `@${user.username}`;
    return 'Пользователь';
  };

  const getCollaboratorSubtitle = (item: (typeof collaborators)[number]) => {
    const parts = [item.role === 'owner' ? 'Владелец' : 'Редактор'];
    if (item.user?.username) {
      parts.push(`@${item.user.username}`);
    }
    if (!item.user && item.user_id === userId) {
      parts.push(
        user?.username ? `@${user.username}` : 'Текущий пользователь'
      );
    }
    return parts.join(' · ');
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <h1 className="text-2xl font-bold">Доступ к каталогу</h1>
      </div>

      <div className="p-4 space-y-4">
        {loading && (
          <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="glass-card p-4 flex items-center gap-2">
              <Spinner />
              <span>Загрузка...</span>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Код приглашения</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Передайте этот код другому пользователю. Он откроет приложение для
              бизнеса и подключит каталог через ввод кода.
            </p>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Текущий код</p>
              <p className="text-2xl font-semibold tracking-widest mt-1">
                {invite?.code || 'Код еще не создан'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                {invite ? 'Сгенерировать заново' : 'Создать код'}
              </Button>
              <Button size="icon" onClick={handleCopy} disabled={!invite?.code}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Пользователи с доступом</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Пока никто не подключен.
              </p>
            ) : (
              collaborators.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-xl p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium break-words">
                      {getCollaboratorName(item.user)}
                    </p>
                    <p className="text-xs text-muted-foreground break-words">
                      {getCollaboratorSubtitle(item)}
                    </p>
                  </div>
                  {item.role !== 'owner' && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleRevoke(item.id)}
                      disabled={revokingAccessId === item.id}
                      aria-label="Отключить доступ"
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 left-4 right-4">
        <Button className="w-full h-12" onClick={() => navigate(`/catalogs/${catalogId}/edit`)}>
          Вернуться в каталог
        </Button>
      </div>
    </div>
  );
}
