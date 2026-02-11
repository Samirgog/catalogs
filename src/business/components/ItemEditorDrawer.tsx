import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check, Upload } from 'lucide-react';

interface ItemEditorDrawerProps {
  isOpen: boolean;
  editingItem: any;
  editingCategory: any;
  formData: any;
  previewUrl: string | null;
  onFormChange: (data: any) => void;
  onFileChange: (file: File | null) => void;
  onClearPreview: () => void;
  onSubmit: () => void;
  onClose: () => void;
  onCategoryClear?: () => void;
  generatePreview: (file: File) => Promise<void>;
}

export function ItemEditorDrawer({
  isOpen,
  editingItem,
  editingCategory,
  formData,
  previewUrl,
  onFormChange,
  onFileChange,
  onClearPreview,
  onSubmit,
  onClose,
  onCategoryClear,
  generatePreview
}: ItemEditorDrawerProps) {
  return (
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent className="p-4 max-h-[90vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>
            {editingItem ? 'Редактировать товар' : 'Создать товар'}
          </DrawerTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4"
            onClick={async () => {
              await onSubmit();
              onClose();
              // Clear category state after successful submission if editing existing item
              if (editingItem && editingCategory && onCategoryClear) {
                onCategoryClear();
              }
            }}
          >
            <Check className="w-5 h-5 text-green-600" />
          </Button>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div>
            <Label htmlFor="item-title">Название</Label>
            <Input
              id="item-title"
              value={formData.title}
              onChange={(e) => onFormChange({...formData, title: e.target.value})}
              placeholder="Введите название товара"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="item-description">Описание</Label>
            <Textarea
              id="item-description"
              value={formData.description}
              onChange={(e) => onFormChange({...formData, description: e.target.value})}
              placeholder="Введите описание товара"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="item-price">Цена</Label>
            <Input
              id="item-price"
              type="number"
              value={formData.price}
              onChange={(e) => onFormChange({...formData, price: parseFloat(e.target.value) || 0})}
              placeholder="Цена товара"
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="item-image">Изображение товара</Label>
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
                      onClearPreview();
                      onFileChange(null);
                      const fileInput = document.getElementById('item-image-file') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                      onFormChange({...formData, image_url: ''});
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onFileChange(file);
                    generatePreview(file).catch(err => {
                      console.error('Preview generation failed:', err);
                    });
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
          <div className="flex items-center justify-between">
            <Label htmlFor="item-available">Доступен</Label>
            <Switch
              id="item-available"
              checked={formData.is_available}
              onCheckedChange={(checked) => onFormChange({...formData, is_available: checked})}
            />
          </div>
          <div>
            <Label htmlFor="item-position">Позиция</Label>
            <Input
              id="item-position"
              type="number"
              value={formData.position}
              onChange={(e) => onFormChange({...formData, position: parseInt(e.target.value) || 0})}
              placeholder="Позиция в списке"
              className="w-full"
            />
          </div>
        </div>

      </DrawerContent>
    </Drawer>
  );
}