import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Check, Upload, X } from 'lucide-react';
import { useImagePreview } from '../hooks/useImages';
import { itemService } from '../services/items';
import { uploadImage } from '../services/images';
import { FormValidator, ErrorHandler, ValidationError } from './CategoriesEditorPage/utils';
import type { ItemFormData } from '@/types';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { Spinner } from '@/components/ui/spinner';
import { BusinessTutorialLauncher } from '../tutorial/BusinessTutorialLauncher';
import { TourOverlay } from '../tutorial/TourOverlay';
import { useSectionTutorial } from '../tutorial/useSectionTutorial';
import type { TutorialStep } from '../tutorial/types';

const itemEditorTutorialSteps: TutorialStep[] = [
  {
    id: 'item-title',
    target: '[data-tour="item-editor-title"]',
    title: 'Название позиции',
    description:
      'Укажите название товара или услуги так, как его увидит клиент в каталоге.',
  },
  {
    id: 'item-short-description',
    target: '[data-tour="item-editor-short-description"]',
    title: 'Краткое описание',
    description:
      'Этот текст будет виден на карточке позиции в каталоге.',
  },
  {
    id: 'item-detailed-description',
    target: '[data-tour="item-editor-detailed-description"]',
    title: 'Детальное описание',
    description:
      'Здесь можно подробно рассказать о составе, преимуществах или условиях оказания услуги.',
  },
  {
    id: 'item-image',
    target: '[data-tour="item-editor-image"]',
    title: 'Изображение',
    description:
      'Добавьте фотографию, чтобы карточка выглядела заметнее и понятнее.',
  },
  {
    id: 'item-save',
    target: '[data-tour="item-editor-save"]',
    title: 'Сохранение',
    description:
      'Когда заполните форму, нажмите кнопку сохранения внизу экрана.',
  },
];

export function ItemEditorPage() {
  const { catalogId, categoryId, itemId } = useParams<{ 
    catalogId: string; 
    categoryId: string; 
    itemId?: string;
  }>();
  const navigate = useNavigate();
  
  useAutoBackButton(`/categories/editor/${catalogId}`);

  // Validate required params
  useEffect(() => {
    if (!catalogId || !categoryId) {
      console.error('Missing required parameters');
      navigate(-1);
    }
  }, [catalogId, categoryId, navigate]);

  // Early return if missing params
  if (!catalogId || !categoryId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <ItemEditorView 
      catalogId={catalogId} 
      categoryId={categoryId} 
      itemId={itemId}
    />
  );
}

interface ItemEditorViewProps {
  catalogId: string;
  categoryId: string;
  itemId?: string;
}

function ItemEditorView({ catalogId, categoryId, itemId }: ItemEditorViewProps) {
  const navigate = useNavigate();
  const { generatePreview, clearPreview } = useImagePreview();

  // Form state
  const [formData, setFormData] = useState<ItemFormData>({ 
    title: '', 
    description: '', 
    detailed_description: '',
    price: 0, 
    image_url: '', 
    is_available: true, 
    position: 0 
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [priorityInput, setPriorityInput] = useState('1');
  const tutorial = useSectionTutorial('item_editor', itemEditorTutorialSteps, {
    enabled: !isLoading,
  });

  // Load existing item data if editing
  useEffect(() => {
    if (itemId) {
      const loadItemData = async () => {
        try {
          setIsLoading(true);
          const item = await itemService.getById(itemId);
          
          if (item) {
            setFormData({
              title: item.title,
              description: item.description || '',
              detailed_description: item.detailed_description || '',
              price: item.price || 0,
              image_url: item.image_url || '',
              is_available: item.is_available ?? true,
              position: item.position || 0
            });
            setPriorityInput(String(item.position || 1));
            setPreviewUrl(item.image_url || null);
          }
        } catch (error) {
          ErrorHandler.showError(error, 'Failed to load item data');
          navigate(-1);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadItemData();
    } else {
      // For new items, set default position
      setFormData(prev => ({
        ...prev,
        position: 1 // Will be adjusted when saving
      }));
      setPriorityInput('1');
    }
  }, [itemId, categoryId, navigate]);

  const handleSubmit = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      FormValidator.validateItemForm(formData);
      
      const parsedPriority = Number(priorityInput);
      const normalizedPriority = Number.isFinite(parsedPriority)
        ? Math.max(1, parsedPriority)
        : 1;
      const payload: ItemFormData = {
        ...formData,
        position: normalizedPriority,
      };

      if (itemId) {
        // Update existing item
        await itemService.update(itemId, payload);
        ErrorHandler.showSuccess('Товар успешно обновлен');
      } else {
        // Create new item
        await itemService.create(payload, categoryId);
        ErrorHandler.showSuccess('Товар успешно создан');
      }
      
      // Navigate back to categories editor
      navigate(`/categories/editor/${catalogId}`, {
        state: itemId
          ? undefined
          : {
              pendingCategoryId: categoryId,
              pendingMode: 'create',
              pendingUntil: Date.now() + 1200,
            },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        ErrorHandler.showError(error, 'Проверьте корректность заполнения полей');
      } else {
        ErrorHandler.showError(
          error,
          itemId ? 'Не удалось сохранить изменения' : 'Не удалось создать товар',
          { allowReload: false, id: 'item-editor-save-error' }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && itemId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-6 rounded-xl">
          <div className="text-lg">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Header */}
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">
            {itemId ? 'Редактировать товар' : 'Создать товар'}
          </h1>
          <BusinessTutorialLauncher currentSection="item_editor" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8">
        <div className="space-y-4 max-w-md mx-auto">
          <div>
            <Label htmlFor="item-title" className="block mb-2 text-sm font-medium">
              Название
            </Label>
            <Input
              data-tour="item-editor-title"
              id="item-title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Введите название товара"
              className="w-full glass-input"
            />
          </div>
          
          <div>
            <Label htmlFor="item-description" className="block mb-2 text-sm font-medium">
              Описание
            </Label>
            <Textarea
              data-tour="item-editor-short-description"
              id="item-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Краткое описание для карточки"
              className="w-full min-h-[80px] glass-input"
            />
          </div>

          <div>
            <Label htmlFor="item-detailed-description" className="block mb-2 text-sm font-medium">
              Детальное описание
            </Label>
            <Textarea
              data-tour="item-editor-detailed-description"
              id="item-detailed-description"
              value={formData.detailed_description}
              onChange={(e) =>
                setFormData({ ...formData, detailed_description: e.target.value })
              }
              placeholder="Подробное описание, которое откроется в карточке"
              className="w-full min-h-[120px] glass-input"
              autoFocus
            />
          </div>
          
          <div>
            <Label htmlFor="item-price" className="block mb-2 text-sm font-medium">
              Цена
            </Label>
            <Input
              id="item-price"
              type="number"
              value={formData.price || ''}
              onChange={(e) => setFormData({...formData, price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0})}
              placeholder="Цена товара"
              className="w-full glass-input"
            />
          </div>
          
          <div>
            <Label htmlFor="item-image" className="block mb-2 text-sm font-medium">
              Изображение товара
            </Label>
            <div className="space-y-4" data-tour="item-editor-image">
              {formData.image_url || previewUrl ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img 
                    src={formData.image_url || previewUrl || ''} 
                    alt="Предпросмотр изображения" 
                    className="w-full h-48 object-cover"
                  />
                  {isImageUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                      <div className="flex items-center gap-2 rounded-xl bg-background px-4 py-3 shadow-sm">
                        <Spinner className="h-4 w-4" />
                        <span className="text-sm">Загружаем изображение...</span>
                      </div>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-3 right-3 h-9 w-9 backdrop-blur-sm"
                    onClick={() => {
                      clearPreview();
                      setPreviewUrl(null);
                      const fileInput = document.getElementById('item-image-file') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                      setFormData({...formData, image_url: ''});
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer bg-secondary/30"
                  onClick={() => document.getElementById('item-image-file')?.click()}
                >
                  {isImageUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Spinner className="h-8 w-8" />
                      <p className="text-sm text-foreground">Загружаем изображение...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-2 text-sm text-foreground">
                        Нажмите для загрузки изображения
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF до 5MB
                      </p>
                    </>
                  )}
                </div>
              )}
              
              <input
                id="item-image-file"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      setIsImageUploading(true);
                      const previewUrl = await generatePreview(file);
                      setPreviewUrl(previewUrl);
                      
                      const timestamp = Date.now();
                      const safeFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                      const uploadPath = `items/${categoryId}/${safeFileName}`;
                      
                      const imageUrl = await uploadImage(file, uploadPath);
                      
                      setFormData(prev => ({
                        ...prev,
                        image_url: imageUrl
                      }));
                      
                    } catch (err) {
                      console.error('Image upload failed:', err);
                      ErrorHandler.showError(err, 'Не удалось загрузить изображение', {
                        allowReload: false,
                        id: 'item-editor-image-error',
                      });
                    } finally {
                      setIsImageUploading(false);
                    }
                  }
                }}
                className="hidden"
              />
              
              {(formData.image_url || previewUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isImageUploading}
                  onClick={() => document.getElementById('item-image-file')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Заменить изображение
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 glass-card rounded-xl">
            <Label htmlFor="item-available" className="text-sm font-medium">
              Доступен
            </Label>
            <Switch
              id="item-available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
            />
          </div>
          
          <input type="hidden" value={priorityInput} readOnly />
        </div>
      </div>

      <div className="fixed bottom-6 left-4 right-4 z-50">
        <Button
          data-tour="item-editor-save"
          onClick={handleSubmit}
          disabled={isLoading || isImageUploading}
          className="w-full h-12 gap-2"
        >
          <Check className="w-4 h-4" />
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
      <TourOverlay
        open={tutorial.open}
        steps={itemEditorTutorialSteps}
        sectionTitle="Редактор позиции"
        onClose={tutorial.closeAndMarkSeen}
        onComplete={tutorial.complete}
      />
    </div>
  );
}
