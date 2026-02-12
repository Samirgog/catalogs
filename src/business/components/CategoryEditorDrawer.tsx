import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check, X } from 'lucide-react';

interface CategoryEditorDrawerProps {
  isOpen: boolean;
  editingCategory: any;
  formData: { title: string; position: number };
  onFormChange: (data: { title: string; position: number }) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function CategoryEditorDrawer({
  isOpen,
  editingCategory,
  formData,
  onFormChange,
  onSubmit,
  onClose
}: CategoryEditorDrawerProps) {
  return (
    <Drawer open={isOpen} onClose={onClose} direction="right">
      <DrawerContent className="h-screen w-full max-w-md fixed right-0 top-0 rounded-none p-0 m-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DrawerHeader className="flex-shrink-0 border-b p-4 flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
            </DrawerTitle>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  onSubmit();
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
                <Label htmlFor="category-title" className="block mb-2 text-sm font-medium">Название</Label>
                <Input
                  id="category-title"
                  value={formData.title}
                  onChange={(e) => onFormChange({...formData, title: e.target.value})}
                  placeholder="Введите название категории"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="category-position" className="block mb-2 text-sm font-medium">Позиция</Label>
                <Input
                  id="category-position"
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