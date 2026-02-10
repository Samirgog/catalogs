import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { X } from 'lucide-react';

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
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>
            {editingItem ? 'Редактировать товар' : 'Создать товар'}
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4">
              <X className="w-4 h-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="item-title">Название</Label>
            <Input
              id="item-title"
              value={formData.title}
              onChange={(e) => onFormChange({...formData, title: e.target.value})}
              placeholder="Введите название товара"
            />
          </div>
          <div>
            <Label htmlFor="item-description">Описание</Label>
            <Textarea
              id="item-description"
              value={formData.description}
              onChange={(e) => onFormChange({...formData, description: e.target.value})}
              placeholder="Введите описание товара"
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
            />
          </div>
          <div>
            <Label htmlFor="item-image">Изображение товара</Label>
            <div className="space-y-3">
              {/* File input */}
              <div className="flex gap-2">
                <Input
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
                  className="flex-1"
                />
                {previewUrl && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      onClearPreview();
                      onFileChange(null);
                      const fileInput = document.getElementById('item-image-file') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Image preview */}
              {previewUrl && (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Предпросмотр изображения" 
                    className="h-32 w-full object-cover rounded-lg border"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Предпросмотр изображения
                  </p>
                </div>
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
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={onSubmit}
          >
            Сохранить
          </Button>
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onClose}
          >
            Отмена
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}