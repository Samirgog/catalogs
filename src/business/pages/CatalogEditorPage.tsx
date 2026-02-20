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
} from 'lucide-react';
import { useCatalog, useCatalogs } from '../hooks/useCatalogs';
import { useImagePreview } from '../hooks/useImages';
import { uploadImage } from '../services/images'; // Direct import for upload
import type { CatalogFormData, CatalogType } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { toast } from 'sonner';

const catalogOptions = [
  {
    value: 'goods',
    title: 'Товары',
    description: 'Продажа физических товаров',
  },
  {
    value: 'services',
    title: 'Услуги',
    description: 'Предоставление услуг с возможностью записатьсяы',
  },
];

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
  const [formData, setFormData] = useState({
    title: '',
    // description: '',
    banner_url: '',
    is_active: true,
    type: 'goods' as CatalogType,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with fetched data
  useEffect(() => {
    if (fetchedCatalog) {
      setFormData({
        title: fetchedCatalog.title,
        // description: fetchedCatalog.description || '',
        is_active: fetchedCatalog.is_active,
        banner_url: fetchedCatalog.banner_url || '',
        type: fetchedCatalog.type || 'goods',
      });
    }
  }, [fetchedCatalog]);

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
    try {
      if (!formData.title.trim()) {
        toast.error('Заполните название каталога');
        return;
      }

      const catalogData: CatalogFormData = {
        title: formData.title.trim(),
        // description: formData.description,
        type: formData.type, // Default type
        is_active: formData.is_active,
        banner_url: formData.banner_url,
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

      // Navigate to categories editor with the catalog ID
      navigate(`/categories/editor/${savedCatalogId}`);
      toast.success('Каталог успешно сохранен');
    } catch (err) {
      console.error('Error saving catalog:', err);
      toast.error('Ошибка сохранения каталога. Попробуйте еще раз.');
    }
  };

  const handleConfigureCategories = () => {
    // Navigate to categories configuration page with catalog ID
    if (isEditing && catalogId) {
      navigate(`/categories/editor/${catalogId}`);
    } else {
      // For new catalogs, save first then navigate
      handleSave();
    }
  };

  const handleConfigureActions = () => {
    // Navigate to actions configuration page
    navigate(`/actions/editor/${catalogId}`);
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
        <div className="text-lg">Загрузка...</div>
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
            <CardTitle>Тип каталога</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={formData.type}
              onValueChange={(value: CatalogType) =>
                setFormData(prev => ({
                  ...prev,
                  type: value,
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
          </CardContent>
        </Card>

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
