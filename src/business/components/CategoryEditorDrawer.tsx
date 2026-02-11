import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check } from 'lucide-react';

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
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>
            {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
          </DrawerTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4"
            onClick={() => {
              onSubmit();
              onClose();
            }}
          >
            <Check className="w-5 h-5 text-green-600" />
          </Button>
        </DrawerHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="category-title">Название</Label>
            <Input
              id="category-title"
              value={formData.title}
              onChange={(e) => onFormChange({...formData, title: e.target.value})}
              placeholder="Введите название категории"
            />
          </div>
          <div>
            <Label htmlFor="category-position">Позиция</Label>
            <Input
              id="category-position"
              type="number"
              value={formData.position}
              onChange={(e) => onFormChange({...formData, position: parseInt(e.target.value) || 0})}
              placeholder="Позиция в списке"
            />
          </div>
        </div>

      </DrawerContent>
    </Drawer>
  );
}