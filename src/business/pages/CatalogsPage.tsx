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

export function CatalogsPage() {
  const { catalogs, loading, error } = useCatalogs();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const telegramPhoto =
    (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || '';
  const avatarText =
    user?.first_name?.[0] ||
    user?.username?.[0] ||
    'U';

  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error]);
  
  const handleEditCatalog = (catalogId: string) => {
    navigate(`/catalogs/${catalogId}/edit`);
  };
  
  const handleCreateCatalog = () => {
    navigate('/catalogs/new');
  };

  const handleSupport = () => {
    const supportUsername = (import.meta.env.VITE_SUPPORT_TELEGRAM || 'catalogs_support_bot').replace('@', '');
    const text = encodeURIComponent('Здравствуйте! Нужна помощь по настройке каталога.');
    window.open(`https://t.me/${supportUsername}?text=${text}`, '_blank');
  };
  
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Каталоги</h1>
            <p className="text-sm text-muted-foreground">Управление каталогами</p>
          </div>
          {telegramPhoto ? (
            <img
              src={telegramPhoto}
              alt="User avatar"
              className="w-12 h-12 rounded-full object-cover border border-border/40"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="text-xl font-bold uppercase">{avatarText}</span>
            </div>
          )}
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
            {catalogs.length === 0 && (
              <Card className="p-6 text-center space-y-3">
                <div className="flex justify-center">
                  <EmptyLottie src={`${import.meta.env.BASE_URL}empty_ghost.lottie`} className="w-44 h-44" />
                </div>
                <h3 className="text-lg font-semibold">Каталогов пока нет</h3>
                <p className="text-sm text-muted-foreground">
                  Создайте свой первый каталог, чтобы начать принимать заказы.
                </p>
              </Card>
            )}
            {catalogs.map((catalog) => (
            <Card 
              key={catalog.id} 
              className="overflow-hidden cursor-pointer"
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
                    <span className="text-white font-medium text-5xl">{catalog.title.charAt(0)}</span>
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
                  <CardTitle className="text-lg">
                    {catalog.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {new Date(catalog.updated_at).toLocaleDateString('ru-RU')}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-9 w-9"
                      onClick={(e) => {
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
          className="w-full h-14 text-base"
          onClick={handleCreateCatalog}
        >
          <Plus className="w-5 h-5 mr-2" />
          Создать каталог
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 mt-2"
          onClick={handleSupport}
        >
          <LifeBuoy className="w-4 h-4 mr-2" />
          Связаться с поддержкой
        </Button>
      </div>
    </div>
  );
}
