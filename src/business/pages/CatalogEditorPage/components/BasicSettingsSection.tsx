import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { CatalogEditorFormData } from '../config';

type AddressOption = {
  value: string;
  label: string;
};

type Props = {
  formData: CatalogEditorFormData;
  onFormChange: (
    updater: (prev: CatalogEditorFormData) => CatalogEditorFormData
  ) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showAddressSuggestions: boolean;
  setShowAddressSuggestions: (value: boolean) => void;
  addressOptions: AddressOption[];
  onAddressSelect: (value: string) => void;
};

export function BasicSettingsSection({
  formData,
  onFormChange,
  onInputChange,
  showAddressSuggestions,
  setShowAddressSuggestions,
  addressOptions,
  onAddressSelect,
}: Props) {
  return (
    <Card data-tour="catalog-editor-settings">
      <CardHeader>
        <CardTitle>Настройки каталога</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div data-tour="catalog-editor-title">
          <Label htmlFor="title" className="block mb-2 text-sm font-medium">
            Название каталога
          </Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={onInputChange}
            placeholder="Введите название каталога"
          />
        </div>

        <div data-tour="catalog-editor-address">
          <Label htmlFor="address" className="block mb-2 text-sm font-medium">
            Адрес
          </Label>
          <div className="relative">
            <Input
              id="address"
              name="address"
              value={formData.address}
              onFocus={() => setShowAddressSuggestions(true)}
              onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 120)}
              onChange={onInputChange}
              placeholder="Укажите адрес точки"
            />
            {showAddressSuggestions && addressOptions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border bg-background shadow-lg overflow-hidden">
                {addressOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60"
                    onClick={() => {
                      onAddressSelect(option.value);
                      setShowAddressSuggestions(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_open_24_7" className="text-base font-medium">
                Круглосуточно
              </Label>
              <p className="text-sm text-muted-foreground">
                Если выключено — нужно указать время работы
              </p>
            </div>
            <Switch
              id="is_open_24_7"
              checked={formData.is_open_24_7}
              onCheckedChange={(checked: boolean) =>
                onFormChange((prev) => ({
                  ...prev,
                  is_open_24_7: checked,
                }))
              }
            />
          </div>

          {!formData.is_open_24_7 && (
            <div className="flex flex-wrap gap-3 w-full">
              <div className="min-w-0 w-[220px] max-w-full">
                <Label htmlFor="work_start" className="block mb-2 text-sm font-medium">
                  Время начала работы
                </Label>
                <Input
                  id="work_start"
                  name="work_start"
                  type="time"
                  className="w-full"
                  value={formData.work_start}
                  onChange={onInputChange}
                />
              </div>
              <div className="min-w-0 w-[220px] max-w-full">
                <Label htmlFor="work_end" className="block mb-2 text-sm font-medium">
                  Время окончания работы
                </Label>
                <Input
                  id="work_end"
                  name="work_end"
                  type="time"
                  className="w-full"
                  value={formData.work_end}
                  onChange={onInputChange}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="emergency_phone" className="block mb-2 text-sm font-medium">
            Телефон для связи
          </Label>
          <Input
            id="emergency_phone"
            name="emergency_phone"
            value={formData.emergency_phone}
            onChange={onInputChange}
            placeholder="+7 900 000-00-00"
          />
        </div>

        <div>
          <Label htmlFor="emergency_telegram" className="block mb-2 text-sm font-medium">
            Telegram контакт для связи
          </Label>
          <Input
            id="emergency_telegram"
            name="emergency_telegram"
            value={formData.emergency_telegram}
            onChange={onInputChange}
            placeholder="@username или https://t.me/username"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <Label htmlFor="is_active" className="text-base font-medium">
              Активен
            </Label>
            <p className="text-sm text-muted-foreground">
              Каталог будет доступен клиентам
            </p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked: boolean) =>
              onFormChange((prev) => ({
                ...prev,
                is_active: checked,
              }))
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
