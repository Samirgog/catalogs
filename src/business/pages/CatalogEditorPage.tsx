import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Save, FolderOpen, Settings, Upload, X, Link } from 'lucide-react';
import { useCatalog, useCatalogs } from '../hooks/useCatalogs';
import { useImagePreview } from '../hooks/useImages';
import { uploadImage } from '../services/images'; // Direct import for upload
import type { CatalogFormData } from '../../types';
import { v4 as uuidv4 } from "uuid";
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';

export function CatalogEditorPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  const isEditing = catalogId && catalogId !== 'new';

  // Enable auto back button for this page
  useAutoBackButton(`/catalogs`);
  
  // Use hooks for data management
  const { catalog: fetchedCatalog, loading: catalogLoading } = useCatalog(catalogId && catalogId !== 'new' ? catalogId : '');
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
      });
    }
  }, [fetchedCatalog]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const catalogData: CatalogFormData = {
        title: formData.title,
        // description: formData.description,
        type: 'goods', // Default type
        is_active: formData.is_active,
        banner_url: formData.banner_url
      };
      
      let savedCatalogId = catalogId;
      
      if (isEditing && catalogId) {
        // Update existing catalog
        await updateCatalog(catalogId, catalogData);
      } else {
        // Create new catalog
        console.log('Creating catalog with data:', catalogData);
        const newCatalog = await createCatalog(catalogData);
        savedCatalogId = newCatalog.id;
        console.log('Created new catalog with ID:', savedCatalogId);
      }
      
      // Navigate to categories editor with the catalog ID
      navigate(`/categories/editor/${savedCatalogId}`);
    } catch (err) {
      console.error('Error saving catalog:', err);
      console.error('Ошибка сохранения каталога. Попробуйте еще раз.');
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
    console.log('Navigating to /actions/editor');
    navigate(`/actions/editor/${catalogId}`);
  };

  const handleGenerateLink = () => {
    // Navigate to links page with catalog ID
    if (isEditing && catalogId) {
      navigate(`/catalogs/${catalogId}/links`);
    } else {
      alert('Пожалуйста, сначала сохраните каталог перед получением ссылки');
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
          banner_url: imageUrl
        }));
        
        // Show appropriate success message
        if (imageUrl.startsWith('data:image')) {
          console.log('Image processed successfully! (Using local storage due to cloud storage issues)');
        } else {
          console.log('Image uploaded successfully!');
        }
      } catch (err) {
        console.error('Image processing failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Image processing failed. Please try again.';
        console.log(`Processing Error: ${errorMessage}`);
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
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 border-b bg-background">
        <div className="flex items-center">
          <h1 className="text-xl font-bold ml-2">
            {isEditing ? 'Редактировать каталог' : 'Создать каталог'}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Настройки каталога</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Название каталога</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Введите название каталога"
              />
            </div>
            
            <div className="flex items-center justify-between pt-2">
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
                    is_active: checked
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Баннер каталога</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData?.banner_url || previewUrl ? (
                <div className="relative">
                  <img 
                    src={formData?.banner_url || previewUrl || ''} 
                    alt="Предпросмотр баннера" 
                    className="w-full h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Image failed to load:', e);
                      console.log('Preview URL that failed:', formData?.banner_url || previewUrl);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', previewUrl);
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={triggerFileInput}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Нажмите для загрузки баннера
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
        
        <div className="space-y-3">
          <Button
            className="w-full"
            variant="outline"
            onClick={handleConfigureCategories}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Настроить категории
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={handleConfigureActions}
          >
            <Settings className="w-4 h-4 mr-2" />
            Настроить действия
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={handleGenerateLink}
          >
            <Link className="w-4 h-4 mr-2" />
            Получить ссылку и QR-код
          </Button>
        </div>
      </div>

      <div className="fixed bottom-6 left-4 right-4 px-4">
        <Button 
          className="w-full h-14 text-lg" 
          onClick={handleSave}
        >
          <Save className="w-5 h-5 mr-2" />
          Сохранить
        </Button>
      </div>
    </div>
  );
}