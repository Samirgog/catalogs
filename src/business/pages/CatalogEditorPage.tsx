import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Save,
  FolderOpen,
  Settings,
  Upload,
  X,
  Link,
  Users,
  Truck,
} from 'lucide-react';
import { useCatalog, useCatalogs } from '../hooks/useCatalogs';
import { useImagePreview } from '../hooks/useImages';
import { uploadImage } from '../services/images'; // Direct import for upload
import type { CatalogFormData, CatalogSubtype, CatalogType, Place } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useAddressSuggestions } from '@/hooks/useAddressSuggestions';
import { placesService } from '../services/places';
import { fulfillmentService } from '../services/fulfillment';
import { actionService } from '../services/actions';

const catalogOptions = [
  {
    value: 'goods',
    title: 'Товары',
    description: 'Продажа физических товаров',
  },
  {
    value: 'services',
    title: 'Услуги',
    description: 'Предоставление услуг с возможностью записаться',
  },
];

const subtypeOptions: Record<CatalogType, Array<{
  value: CatalogSubtype;
  title: string;
  description: string;
}>> = {
  goods: [
    {
      value: 'shop',
      title: 'Магазин',
      description: 'Классические товары, витрина и корзина',
    },
    {
      value: 'cafe_restaurant',
      title: 'Кафе/Ресторан',
      description: 'Еда и напитки, поддержка выдачи к столику',
    },
    {
      value: 'digital_store',
      title: 'Цифровой магазин',
      description: 'Цифровые товары и доступы',
    },
  ],
  services: [
    {
      value: 'salon',
      title: 'Салон',
      description: 'Услуги в точке (beauty/wellness и т.п.)',
    },
    {
      value: 'private_master',
      title: 'Частный мастер',
      description: 'Выездные и локальные услуги частного специалиста',
    },
    {
      value: 'studio_club',
      title: 'Студия/Клуб (абонементы)',
      description: 'Услуги и абонементные форматы',
    },
  ],
};

export function CatalogEditorPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  const isEditing = catalogId && catalogId !== 'new';

  // Enable auto back button for this page
  useAutoBackButton(`/catalogs`);

  // Use hooks for data management
  const { catalog: fetchedCatalog, loading: catalogLoading } = useCatalog(
    catalogId && catalogId !== 'new' ? catalogId : ''
  );
  const { createCatalog, updateCatalog } = useCatalogs();

  // Image handling hooks
  const { generatePreview, previewUrl, clearPreview } = useImagePreview();

  // Loading state
  const isLoading = isEditing && catalogLoading;

  // Form state
  const draftKey = `catalog-editor-draft:${catalogId || 'new'}`;
  const [formData, setFormData] = useState({
    title: '',
    banner_url: '',
    address: '',
    subtype: 'shop' as CatalogSubtype,
    is_open_24_7: false,
    work_start: '',
    work_end: '',
    emergency_phone: '',
    emergency_telegram: '',
    is_active: true,
    type: 'goods' as CatalogType,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hydratedFromDraftRef = useRef(false);
  const [foodcourtEnabled, setFoodcourtEnabled] = useState(false);
  const [foodcourtPlace, setFoodcourtPlace] = useState<Place | null>(null);
  const [foodcourtLoading, setFoodcourtLoading] = useState(false);
  const addressSuggestions = useAddressSuggestions(formData.address);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      setFormData(prev => ({ ...prev, ...parsed }));
      hydratedFromDraftRef.current = true;
    } catch {
      // ignore broken draft
    }
  }, [draftKey]);

  // Initialize form with fetched data
  useEffect(() => {
    if (fetchedCatalog && !hydratedFromDraftRef.current) {
      setFormData({
        title: fetchedCatalog.title,
        is_active: fetchedCatalog.is_active,
        banner_url: fetchedCatalog.banner_url || '',
        address: fetchedCatalog.address || '',
        subtype: fetchedCatalog.subtype || (fetchedCatalog.type === 'goods' ? 'shop' : 'salon'),
        is_open_24_7: Boolean(fetchedCatalog.is_open_24_7),
        work_start: fetchedCatalog.work_start || '',
        work_end: fetchedCatalog.work_end || '',
        emergency_phone: fetchedCatalog.emergency_phone || '',
        emergency_telegram: fetchedCatalog.emergency_telegram || '',
        type: fetchedCatalog.type || 'goods',
      });
      setFoodcourtEnabled(
        fetchedCatalog.type === 'goods' &&
          (fetchedCatalog.subtype || '') === 'cafe_restaurant'
      );
    }
  }, [fetchedCatalog]);

  useEffect(() => {
    const loadFoodcourt = async () => {
      if (!catalogId || !isEditing) return;
      try {
        setFoodcourtLoading(true);
        const place = await placesService.getFoodcourtForCatalog(catalogId);
        setFoodcourtPlace(place);
      } catch {
        setFoodcourtPlace(null);
      } finally {
        setFoodcourtLoading(false);
      }
    };
    void loadFoodcourt();
  }, [catalogId, isEditing]);

  useEffect(() => {
    sessionStorage.setItem(draftKey, JSON.stringify(formData));
  }, [draftKey, formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    await saveCatalog(false);
  };

  const saveCatalog = async (keepOnEditor: boolean) => {
    try {
      if (!formData.title.trim()) {
        toast.error('Заполните название каталога');
        return;
      }
      if (!formData.emergency_phone.trim()) {
        toast.error('Укажите номер телефона для связи');
        return;
      }
      if (!formData.emergency_telegram.trim()) {
        toast.error('Укажите Telegram контакт для связи');
        return;
      }
      if (
        !formData.is_open_24_7 &&
        (!formData.work_start.trim() || !formData.work_end.trim())
      ) {
        toast.error(
          'Укажите время работы "с" и "до" или включите "Круглосуточно"'
        );
        return;
      }

      if (formData.is_active && isEditing && catalogId) {
        const [methods, actions] = await Promise.all([
          fulfillmentService.getByCatalogId(catalogId),
          actionService.getByCatalogId(catalogId),
        ]);

        const hasEnabledMethod = methods.some(method => method.is_enabled);
        const hasEnabledAction = actions.some(action => action.is_enabled);

        if (!hasEnabledMethod) {
          toast.error('Настройте хотя бы один способ получения');
          return;
        }
        if (!hasEnabledAction) {
          toast.error('Настройте хотя бы один способ оплаты');
          return;
        }
      }

      const catalogData: CatalogFormData = {
        title: formData.title.trim(),
        type: formData.type,
        subtype: formData.subtype,
        is_active: formData.is_active,
        banner_url: formData.banner_url,
        address: formData.address.trim(),
        is_open_24_7: formData.is_open_24_7,
        work_start: formData.is_open_24_7 ? undefined : formData.work_start,
        work_end: formData.is_open_24_7 ? undefined : formData.work_end,
        emergency_phone: formData.emergency_phone.trim(),
        emergency_telegram: formData.emergency_telegram.trim(),
      };

      let savedCatalogId = catalogId;

      if (isEditing && catalogId) {
        // Update existing catalog
        await updateCatalog(catalogId, catalogData);
      } else {
        // Create new catalog
        const newCatalog = await createCatalog(catalogData);
        savedCatalogId = newCatalog.id;
      }

      toast.success('Каталог успешно сохранен');
      sessionStorage.removeItem(draftKey);
      if (!isEditing && savedCatalogId && keepOnEditor) {
        navigate(`/catalogs/${savedCatalogId}/edit`, { replace: true });
      }
      return savedCatalogId || '';
    } catch (err) {
      console.error('Error saving catalog:', err);
      toast.error('Ошибка сохранения каталога. Попробуйте еще раз.');
      return '';
    }
  };

  const handleConfigureCategories = () => {
    // Navigate to categories configuration page with catalog ID
    if (isEditing && catalogId) {
      navigate(`/categories/editor/${catalogId}`);
    } else {
      void (async () => {
        const savedCatalogId = await saveCatalog(true);
        if (savedCatalogId) {
          navigate(`/categories/editor/${savedCatalogId}`);
        }
      })();
    }
  };

  const handleConfigureActions = () => {
    if (isEditing && catalogId) {
      navigate(`/actions/editor/${catalogId}`);
    } else {
      toast.error('Сначала сохраните каталог перед настройкой способов оплаты');
    }
  };

  const handleGenerateLink = () => {
    // Navigate to links page with catalog ID
    if (isEditing && catalogId) {
      navigate(`/catalogs/${catalogId}/links`);
    } else {
      toast.error('Сначала сохраните каталог перед получением ссылки');
    }
  };

  const handleConfigureStaff = () => {
    if (isEditing && catalogId) {
      navigate(`/staff/${catalogId}`);
    } else {
      toast.error('Сначала сохраните каталог перед настройкой сотрудников');
    }
  };

  const handleConfigureFulfillment = () => {
    if (isEditing && catalogId) {
      navigate(`/catalogs/${catalogId}/fulfillment`);
    } else {
      toast.error(
        'Сначала сохраните каталог перед настройкой способов получения'
      );
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log('File size should not exceed 5MB');
        return;
      }

      try {
        // Create a safe filename using English transliteration
        const timestamp = Date.now();
        const safeFileName = `banner-${timestamp}-${uuidv4()}`;
        const uploadPath = `catalogs/${safeFileName}`;

        // First, generate immediate preview
        await generatePreview(file);

        // Then upload to Supabase storage (with fallback to base64)
        const imageUrl = await uploadImage(file, uploadPath);

        setFormData(prev => ({
          ...prev,
          banner_url: imageUrl,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Image processing failed. Please try again.';

        toast.error(errorMessage);
      }
    }
  };

  const handleRemoveImage = () => {
    clearPreview();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Редактировать каталог' : 'Создать каталог'}
        </h1>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Баннер каталога</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData?.banner_url || previewUrl ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={formData?.banner_url || previewUrl || ''}
                    alt="Предпросмотр баннера"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-3 right-3 h-9 w-9 backdrop-blur-sm"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer bg-secondary/30"
                  onClick={triggerFileInput}
                >
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-foreground">
                    Нажмите для загрузки баннера
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF до 5MB
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {(formData?.banner_url || previewUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={triggerFileInput}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Заменить изображение
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Настройки каталога</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="block mb-2 text-sm font-medium">
                Название каталога
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Введите название каталога"
              />
            </div>

            <div>
              <Label
                htmlFor="address"
                className="block mb-2 text-sm font-medium"
              >
                Адрес
              </Label>
              <div className="relative">
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onFocus={() => setShowAddressSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 120)}
                  onChange={handleInputChange}
                  placeholder="Укажите адрес точки"
                />
                {showAddressSuggestions && addressSuggestions.suggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border bg-background shadow-lg overflow-hidden">
                    {addressSuggestions.suggestions.map(option => (
                      <button
                        type="button"
                        key={option.value}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/60"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            address: option.value,
                          }))
                        }
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
                  <Label
                    htmlFor="is_open_24_7"
                    className="text-base font-medium"
                  >
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
                    setFormData(prev => ({
                      ...prev,
                      is_open_24_7: checked,
                    }))
                  }
                />
              </div>

              {!formData.is_open_24_7 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  <div className="min-w-0 w-full">
                    <Label
                      htmlFor="work_start"
                      className="block mb-2 text-sm font-medium"
                    >
                      С
                    </Label>
                    <Input
                      id="work_start"
                      name="work_start"
                      type="time"
                      className="w-full min-w-0"
                      value={formData.work_start}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="min-w-0 w-full">
                    <Label
                      htmlFor="work_end"
                      className="block mb-2 text-sm font-medium"
                    >
                      До
                    </Label>
                    <Input
                      id="work_end"
                      name="work_end"
                      type="time"
                      className="w-full min-w-0"
                      value={formData.work_end}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label
                htmlFor="emergency_phone"
                className="block mb-2 text-sm font-medium"
              >
                Телефон для связи
              </Label>
              <Input
                id="emergency_phone"
                name="emergency_phone"
                value={formData.emergency_phone}
                onChange={handleInputChange}
                placeholder="+7 900 000-00-00"
              />
            </div>

            <div>
              <Label
                htmlFor="emergency_telegram"
                className="block mb-2 text-sm font-medium"
              >
                Telegram контакт для связи
              </Label>
              <Input
                id="emergency_telegram"
                name="emergency_telegram"
                value={formData.emergency_telegram}
                onChange={handleInputChange}
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
                  setFormData(prev => ({
                    ...prev,
                    is_active: checked,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Тип и подтип</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={formData.type}
              onValueChange={(value: CatalogType) =>
                setFormData(prev => ({
                  ...prev,
                  type: value,
                  subtype: subtypeOptions[value][0].value,
                }))
              }
              className="space-y-3"
            >
              {catalogOptions.map(option => (
                <div
                  key={option.value}
                  className="flex items-start gap-3 p-4 glass-card"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.value}
                      className="text-base font-medium leading-none"
                    >
                      {option.title}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">Подтип</p>
              <RadioGroup
                value={formData.subtype}
                onValueChange={(value: CatalogSubtype) =>
                  setFormData(prev => ({ ...prev, subtype: value }))
                }
                className="space-y-2"
              >
                {subtypeOptions[formData.type].map(option => (
                  <div
                    key={option.value}
                    className="flex items-start gap-3 p-3 glass-card rounded-xl"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`subtype-${option.value}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`subtype-${option.value}`}
                        className="text-sm font-medium leading-none"
                      >
                        {option.title}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {formData.type === 'goods' && formData.subtype === 'cafe_restaurant' && (
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
                <Switch
                  checked={foodcourtEnabled}
                  onCheckedChange={setFoodcourtEnabled}
                />
              </div>

              {foodcourtEnabled && (
                <>
                  {foodcourtLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner className="h-4 w-4" />
                      Проверяем привязку...
                    </div>
                  )}
                  {!foodcourtLoading && !foodcourtPlace && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const text = encodeURIComponent(
                          `Здравствуйте! Хочу подключиться к фудкорту.\nКаталог: ${formData.title || 'Без названия'}\nID: ${catalogId || 'new'}`
                        );
                        const supportUsername = (import.meta.env.VITE_SUPPORT_TELEGRAM || 'catalogs_support_bot').replace('@', '');
                        window.open(`https://t.me/${supportUsername}?text=${text}`, '_blank');
                      }}
                    >
                      Перейти в чат с поддержкой
                    </Button>
                  )}
                  {!foodcourtLoading && foodcourtPlace && (
                    <div className="glass-card p-3 rounded-xl space-y-2">
                      <p className="text-sm">
                        Фудкорт: <b>{foodcourtPlace.name}</b>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {foodcourtPlace.address || 'Адрес не указан'}
                      </p>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={async () => {
                          if (!catalogId) return;
                          try {
                            await placesService.detachFromFoodcourt(catalogId);
                            setFoodcourtPlace(null);
                            toast.success('Каталог откреплен от фудкорта');
                          } catch {
                            toast.error('Не удалось открепить каталог от фудкорта');
                          }
                        }}
                      >
                        Открепиться от фудкорта
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleConfigureCategories}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Настроить категории
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleConfigureActions}
          >
            <Settings className="w-4 h-4 mr-2" />
            Способы оплаты и действия
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleConfigureFulfillment}
          >
            <Truck className="w-4 h-4 mr-2" />
            Способы получения
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleGenerateLink}
          >
            <Link className="w-4 h-4 mr-2" />
            Получить ссылку и QR-код
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleConfigureStaff}
          >
            <Users className="w-4 h-4 mr-2" />
            Сотрудники и уведомления
          </Button>
        </div>
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-6 left-4 right-4">
        <Button className="w-full h-14 text-base" onClick={handleSave}>
          <Save className="w-5 h-5 mr-2" />
          Сохранить
        </Button>
      </div>
    </div>
  );
}
