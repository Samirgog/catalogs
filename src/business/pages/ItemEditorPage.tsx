import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Check, Upload, X } from 'lucide-react';
import { useImagePreview } from '../hooks/useImages';
import { itemService } from '../services/items';
import { FormValidator, ErrorHandler, ValidationError } from './CategoriesEditorPage/utils';
import type { ItemFormData } from '@/types';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';

export function ItemEditorPage() {
  const { catalogId, categoryId, itemId } = useParams<{ 
    catalogId: string; 
    categoryId: string; 
    itemId?: string;
  }>();
  const navigate = useNavigate();
  
  useAutoBackButton();

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
    price: 0, 
    image_url: '', 
    is_available: true, 
    position: 0 
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
              price: item.price || 0,
              image_url: item.image_url || '',
              is_available: item.is_available ?? true,
              position: item.position || 0
            });
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
    }
  }, [itemId, categoryId, navigate]);

  const handleSubmit = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      FormValidator.validateItemForm(formData);
      
      if (itemId) {
        // Update existing item
        await itemService.update(itemId, formData);
        ErrorHandler.showSuccess('Item updated successfully');
      } else {
        // Create new item
        await itemService.create(formData, categoryId);
        ErrorHandler.showSuccess('Item created successfully');
      }
      
      // Navigate back to categories editor
      navigate(`/categories/editor/${catalogId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        ErrorHandler.showError(error, 'Invalid item data');
      } else {
        ErrorHandler.showError(error, itemId ? 'Failed to update item' : 'Failed to create item');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/categories/editor/${catalogId}`);
  };

  if (isLoading && itemId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="flex items-center p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCancel}
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">
            {itemId ? 'Редактировать товар' : 'Создать товар'}
          </h1>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8">
        <div className="space-y-6 max-w-md mx-auto">
          <div>
            <Label htmlFor="item-title" className="block mb-2 text-sm font-medium">
              Название
            </Label>
            <Input
              id="item-title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Введите название товара"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="item-description" className="block mb-2 text-sm font-medium">
              Описание
            </Label>
            <Textarea
              id="item-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Введите описание товара"
              className="w-full min-h-[100px]"
            />
          </div>
          
          <div>
            <Label htmlFor="item-price" className="block mb-2 text-sm font-medium">
              Цена
            </Label>
            <Input
              id="item-price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
              placeholder="Цена товара"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="item-image" className="block mb-2 text-sm font-medium">
              Изображение товара
            </Label>
            <div className="space-y-4">
              {formData.image_url || previewUrl ? (
                <div className="relative">
                  <img 
                    src={formData.image_url || previewUrl || ''} 
                    alt="Предпросмотр изображения" 
                    className="w-full h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Image failed to load:', e);
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
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
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => document.getElementById('item-image-file')?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Нажмите для загрузки изображения
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF до 5MB
                  </p>
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
                      const url = await generatePreview(file);
                      setPreviewUrl(url);
                    } catch (err) {
                      console.error('Preview generation failed:', err);
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
                  onClick={() => document.getElementById('item-image-file')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Заменить изображение
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="item-available" className="text-sm font-medium">
              Доступен
            </Label>
            <Switch
              id="item-available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
            />
          </div>
          
          <div>
            <Label htmlFor="item-position" className="block mb-2 text-sm font-medium">
              Позиция
            </Label>
            <Input
              id="item-position"
              type="number"
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: parseInt(e.target.value) || 0})}
              placeholder="Позиция в списке"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}