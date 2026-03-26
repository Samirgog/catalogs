import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import type { Place } from '@/types';
import { useEffect, useMemo, useState } from 'react';

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
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedPlace = useMemo(
    () => foodcourtOptions.find((place) => place.id === selectedFoodcourtId) || currentFoodcourt,
    [currentFoodcourt, foodcourtOptions, selectedFoodcourtId]
  );

  useEffect(() => {
    if (!selectedPlace) return;
    setQuery(
      [selectedPlace.name, selectedPlace.address].filter(Boolean).join(' · ')
    );
  }, [selectedPlace]);

  const filteredOptions = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return foodcourtOptions;
    return foodcourtOptions.filter((place) => {
      const haystack = `${place.name} ${place.address || ''}`.toLowerCase();
      return haystack.includes(value);
    });
  }, [foodcourtOptions, query]);

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
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <div>
                        <Input
                          value={query}
                          onFocus={() => setOpen(true)}
                          onChange={(e) => {
                            setQuery(e.target.value);
                            if (!open) setOpen(true);
                          }}
                          placeholder="Введите название или адрес"
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {filteredOptions.length === 0 ? (
                          <p className="px-2 py-1 text-sm text-muted-foreground">
                            Ничего не найдено
                          </p>
                        ) : (
                          filteredOptions.map((place) => (
                            <button
                              key={place.id}
                              type="button"
                              className="w-full text-left rounded-lg px-2 py-2 hover:bg-accent"
                              onClick={() => {
                                onSelectedFoodcourtChange(place.id);
                                setQuery(
                                  [place.name, place.address].filter(Boolean).join(' · ')
                                );
                                setOpen(false);
                              }}
                            >
                              <p className="text-sm font-medium">{place.name}</p>
                              {place.address && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {place.address}
                                </p>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
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
