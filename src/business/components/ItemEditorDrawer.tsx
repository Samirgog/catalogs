import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check, Upload, X } from 'lucide-react';

interface ItemEditorDrawerProps {
  isOpen: boolean;
  editingItem: any;
  formData: any;
  previewUrl: string | null;
  onFormChange: (data: any) => void;
  onFileChange: (file: File | null) => void;
  onClearPreview: () => void;
  onSubmit: () => void;
  onClose: () => void;
  generatePreview: (file: File) => Promise<void>;
}

export function ItemEditorDrawer({
  isOpen,
  editingItem,
  formData,
  previewUrl,
  onFormChange,
  onFileChange,
  onClearPreview,
  onSubmit,
  onClose,
  generatePreview
}: ItemEditorDrawerProps) {
  return (
    <Drawer open={isOpen} onClose={onClose} direction="right">
      <DrawerContent className="h-screen w-full max-w-md fixed right-0 top-0 rounded-none p-0 m-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DrawerHeader className="flex-shrink-0 border-b p-4 flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              {editingItem ? 'Редактировать товар' : 'Создать товар'}
            </DrawerTitle>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={async () => {
                  await onSubmit();
                  onClose();
                }}
              >
                <Check className="w-5 h-5 text-green-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DrawerHeader>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              <div>
                <Label htmlFor="item-title" className="block mb-2 text-sm font-medium">Название</Label>
                <Input
                  id="item-title"
                  value={formData.title}
                  onChange={(e) => onFormChange({...formData, title: e.target.value})}
                  placeholder="Введите название товара"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="item-description" className="block mb-2 text-sm font-medium">Описание</Label>
                <Textarea
                  id="item-description"
                  value={formData.description}
                  onChange={(e) => onFormChange({...formData, description: e.target.value})}
                  placeholder="Введите описание товара"
                  className="w-full min-h-[100px]"
                />
              </div>
              
              <div>
                <Label htmlFor="item-price" className="block mb-2 text-sm font-medium">Цена</Label>
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
                <Label htmlFor="item-image" className="block mb-2 text-sm font-medium">Изображение товара</Label>
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
              
              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="item-available" className="text-sm font-medium">Доступен</Label>
                <Switch
                  id="item-available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => onFormChange({...formData, is_available: checked})}
                />
              </div>
              
              <div>
                <Label htmlFor="item-position" className="block mb-2 text-sm font-medium">Позиция</Label>
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
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}