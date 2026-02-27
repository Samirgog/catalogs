import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import type { Place } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  enabled: boolean;
  loading: boolean;
  selectedFoodcourtId: string;
  foodcourtOptions: Place[];
  currentFoodcourt: Place | null;
  isBindingFoodcourt: boolean;
  canAttach: boolean;
  onEnabledChange: (checked: boolean) => void;
  onSelectedFoodcourtChange: (value: string) => void;
  onAttach: () => void;
  onDetach: () => void;
  onSupportClick: () => void;
};

export function FoodcourtSection({
  enabled,
  loading,
  selectedFoodcourtId,
  foodcourtOptions,
  currentFoodcourt,
  isBindingFoodcourt,
  canAttach,
  onEnabledChange,
  onSelectedFoodcourtChange,
  onAttach,
  onDetach,
  onSupportClick,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Фудкорт</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Являюсь частью фудкорта</p>
            <p className="text-sm text-muted-foreground">
              Включите, если каталог относится к фудкорту
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>

        {enabled && (
          <>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Проверяем привязку...
              </div>
            )}
            {!loading && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Выберите фудкорт</Label>
                  <Select value={selectedFoodcourtId} onValueChange={onSelectedFoodcourtChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите из списка" />
                    </SelectTrigger>
                    <SelectContent>
                      {foodcourtOptions.map((place) => (
                        <SelectItem key={place.id} value={place.id}>
                          {place.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!canAttach || isBindingFoodcourt}
                  onClick={onAttach}
                >
                  {isBindingFoodcourt ? 'Сохраняем...' : 'Привязать выбранный фудкорт'}
                </Button>
                {currentFoodcourt && (
                  <div className="glass-card p-3 rounded-xl space-y-2">
                    <p className="text-sm">
                      Текущий фудкорт: <b>{currentFoodcourt.name}</b>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentFoodcourt.address || 'Адрес не указан'}
                    </p>
                    <Button variant="destructive" className="w-full" onClick={onDetach}>
                      Открепиться от фудкорта
                    </Button>
                  </div>
                )}
                <div className="glass-card rounded-xl p-3 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Не нашли нужный фудкорт? Напишите нам и мы поможем
                  </p>
                  <Button variant="secondary" className="w-full" onClick={onSupportClick}>
                    Написать в поддержку
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
