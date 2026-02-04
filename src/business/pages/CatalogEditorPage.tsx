import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, FolderOpen, Settings, Upload, X, Link } from 'lucide-react';
import type { Catalog } from '../../types';

export function CatalogEditorPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  const isEditing = catalogId && catalogId !== 'new';
  
  // Sample initial data - in a real app this would come from an API
  const initialCatalog: Catalog = {
    id: catalogId || '',
    title: '',
    is_active: true,
    settings: {},
    created_at: new Date().toISOString(),
    categories: []
  };
  
  const [catalog, setCatalog] = useState<Catalog>(initialCatalog);
  const [isLoading, setIsLoading] = useState(isEditing); // Start loading if editing an existing catalog
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load catalog data if editing
  useEffect(() => {
    if (isEditing) {
      // In a real app, this would fetch from an API
      // For demo purposes, we'll simulate loading
      setTimeout(() => {
        setCatalog({
          ...initialCatalog,
          title: `Catalog ${catalogId}`, // Demo title
          is_active: true,
        });
        setIsLoading(false);
      }, 500);
    } else {
      // For new catalog, initialize with empty state
      setCatalog(initialCatalog);
      setIsLoading(false);
    }
  }, [catalogId, isEditing]);

  const handleInputChange = (field: keyof Catalog, value: any) => {
    setCatalog(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to an API
    console.log('Saving catalog:', catalog);
    // Navigate back to catalogs list after saving
    navigate('/catalogs');
  };

  const handleConfigureCategories = () => {
    // Navigate to categories configuration page
    // This could be a separate route or modal in a real implementation
    navigate('/categories/editor');
  };

  const handleConfigureActions = () => {
    // Navigate to actions configuration page
    console.log('Navigating to /actions/editor');
    navigate('/actions/editor');
  };

  const handleGenerateLink = () => {
    // Navigate to links page with catalog ID
    navigate(`/catalogs/${catalogId || 'new'}/links`);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите файл изображения');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5 МБ');
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setBannerImage(file.name); // In real app, this would be the uploaded URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setBannerImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };



  const handleBack = () => {
    navigate(-1);
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
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
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
                value={catalog.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
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
                checked={!!catalog.is_active}
                onCheckedChange={(checked: boolean) => handleInputChange('is_active', checked)}
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
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Предпросмотр баннера" 
                    className="w-full h-48 object-cover rounded-lg border"
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
              
              {imagePreview && (
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