import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { useCatalogsByPlace } from '../hooks/useCatalogs';

type Props = {
  placeId: string;
};

export function FoodcourtCatalogsPage({ placeId }: Props) {
  const navigate = useNavigate();
  useAutoBackButton('/');

  const { catalogs, isLoading, isError } = useCatalogsByPlace(placeId || null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4">Не удалось загрузить фудкорт</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <h1 className="text-2xl font-bold">Каталоги фудкорта</h1>
      </div>

      <div className="p-4 space-y-3">
        {catalogs.length === 0 && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              В этом фудкорте пока нет активных каталогов.
            </CardContent>
          </Card>
        )}
        {catalogs.map(catalog => (
          <button
            key={catalog.id}
            type="button"
            className="w-full text-left"
            onClick={() =>
              navigate(`/catalog/${catalog.id}`, {
                state: { fromFoodcourt: true, placeId },
              })
            }
          >
            <Card className="overflow-hidden">
              {catalog.banner_url && (
                <img
                  src={catalog.banner_url}
                  alt={catalog.title}
                  className="w-full h-32 object-cover"
                />
              )}
              <CardContent className="p-4">
                <p className="font-semibold">{catalog.title}</p>
                {catalog.address && (
                  <p className="text-xs text-muted-foreground mt-1">{catalog.address}</p>
                )}
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="fixed bottom-6 left-4 right-4">
        <Button className="w-full h-12" onClick={() => navigate('/')}>Назад</Button>
      </div>
    </div>
  );
}
