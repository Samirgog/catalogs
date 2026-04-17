import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { UsersRound } from 'lucide-react';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { platformAdminService, type PlatformUserWithCatalogs } from '../services/platformAdmin';
import { showRequestError } from '../utils/request-feedback';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const getFullName = (user: PlatformUserWithCatalogs) => {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (user.username) return `@${user.username}`;
  return 'Без имени';
};

export function PlatformUsersPage() {
  useAutoBackButton('/catalogs');

  const [users, setUsers] = useState<PlatformUserWithCatalogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await platformAdminService.getUsersWithCatalogs();
        setUsers(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Не удалось загрузить пользователей';
        setError(message);
        showRequestError(message, {
          retryLabel: 'Повторить',
          onRetry: () => void load(),
          id: 'platform-users-load-error',
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-3">
          <UsersRound className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Пользователи</h1>
            <p className="text-sm text-muted-foreground">
              Список пользователей и созданных ими каталогов
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button className="w-full" onClick={() => window.location.reload()}>
                Обновить
              </Button>
            </CardContent>
          </Card>
        )}

        {!error && users.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Пользователи не найдены.
            </CardContent>
          </Card>
        )}

        {!error &&
          users.map((user) => (
            <Card key={user.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{getFullName(user)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Дата создания: {formatDate(user.created_at)}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Созданные каталоги: {user.catalogs.length}
                  </p>
                  {user.catalogs.length > 0 ? (
                    <div className="space-y-2">
                      {user.catalogs.map((catalog) => (
                        <div
                          key={catalog.id}
                          className="rounded-xl border border-border/60 px-3 py-2"
                        >
                          <div className="font-medium">{catalog.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Создан: {formatDate(catalog.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Пока нет созданных каталогов.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
