import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, RefreshCcw, Share2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { useStaff } from '../hooks/useStaff';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

export function StaffPage() {
  const navigate = useNavigate();
  const { catalogId } = useParams<{ catalogId: string }>();
  useAutoBackButton(catalogId ? `/catalogs/${catalogId}/edit` : '/catalogs');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [accessCodeValue, setAccessCodeValue] = useState('');
  const staffBotUrl = import.meta.env.VITE_STAFF_BOT_URL || '';

  const {
    accessCode,
    members,
    isLoading,
    error,
    generateAccessCode,
    setMemberActive,
    refetch,
  } = useStaff(catalogId ?? '');

  if (!catalogId) {
    return <div className="p-4">Отсутствует идентификатор каталога.</div>;
  }

  useEffect(() => {
    if (accessCode?.access_code) {
      setAccessCodeValue(accessCode.access_code);
    } else {
      setAccessCodeValue('');
    }
  }, [accessCode?.access_code]);

  async function handleGenerate() {
    try {
      setIsGenerating(true);
      setLocalMessage(null);
      const generated = await generateAccessCode();
      setAccessCodeValue(generated.access_code);
      setLocalMessage('Код доступа обновлен.');
      toast.success('Код доступа обновлен');
    } catch (err) {
      setLocalMessage(
        err instanceof Error ? err.message : 'Не удалось сгенерировать код.'
      );
      toast.error(
        err instanceof Error ? err.message : 'Не удалось сгенерировать код.'
      );
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    if (isLoading) return;
    if (accessCodeValue) return;
    void handleGenerate();
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async () => {
    if (!accessCodeValue) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(accessCodeValue);
      setLocalMessage('Код скопирован.');
      toast.success('Код скопирован');
    } catch {
      setLocalMessage('Не удалось скопировать код.');
      toast.error('Не удалось скопировать код');
    } finally {
      setIsCopying(false);
    }
  };

  const handleToggleMember = async (id: string, isActive: boolean) => {
    try {
      await setMemberActive(id, !isActive);
      toast.success(!isActive ? 'Сотрудник включен' : 'Сотрудник отключен');
    } catch (err) {
      setLocalMessage(
        err instanceof Error ? err.message : 'Не удалось обновить сотрудника.'
      );
      toast.error(
        err instanceof Error ? err.message : 'Не удалось обновить сотрудника.'
      );
    }
  };

  const handleShareBotLink = async () => {
    if (!staffBotUrl) {
      toast.error('Ссылка на бота не настроена');
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Бот для сотрудников',
          text: 'Откройте бота и введите код доступа',
          url: staffBotUrl,
        });
      } else {
        await navigator.clipboard.writeText(staffBotUrl);
      }
      toast.success('Ссылка на бота отправлена');
    } catch {
      toast.error('Не удалось поделиться ссылкой');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <h1 className="text-2xl font-bold">Сотрудники и уведомления</h1>
      </div>

      <div className="p-4 space-y-4">
        {isLoading && (
          <div className="glass-card p-3 flex items-center justify-center">
            <Spinner />
          </div>
        )}
        {(error || localMessage) && (
          <div className="glass-card p-3 text-sm">{error || localMessage}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Код доступа для сотрудников</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Сотрудник вводит этот код в Telegram-боте и привязывается к
              каталогу.
            </p>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Текущий код</p>
              <p className="text-2xl font-semibold tracking-widest mt-1">
                {accessCodeValue || 'Код не создан'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Ссылка на бот</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={staffBotUrl || 'Укажите VITE_STAFF_BOT_URL'}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShareBotLink}
                  disabled={!staffBotUrl}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                {isGenerating ? 'Генерируем...' : 'Сгенерировать новый код'}
              </Button>
              <Button
                size="icon"
                onClick={handleCopy}
                disabled={!accessCodeValue || isCopying}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Подключенные сотрудники</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Пока нет сотрудников. Попросите сотрудника ввести код в боте.
              </p>
            ) : (
              members.map(member => (
                <div
                  key={member.id}
                  className="glass-card rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {member.first_name ||
                        member.username ||
                        member.telegram_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{member.username || 'без_username'} ·{' '}
                      {member.on_shift ? 'на смене' : 'вне смены'} ·{' '}
                      {member.is_active ? 'активен' : 'отключен'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleToggleMember(member.id, member.is_active)
                    }
                  >
                    {member.is_active ? (
                      <>
                        <UserX className="w-4 h-4 mr-1" />
                        Отключить
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-1" />
                        Включить
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => refetch()}
            >
              Обновить список
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 left-4 right-4">
        <Button
          className="w-full h-12"
          onClick={() => navigate(`/catalogs/${catalogId}/edit`)}
        >
          Вернуться в каталог
        </Button>
      </div>
    </div>
  );
}
