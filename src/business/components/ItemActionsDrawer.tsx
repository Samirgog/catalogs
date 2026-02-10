import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { X, Pencil, Copy, Trash2 } from 'lucide-react';

interface ItemActionsDrawerProps {
  isOpen: boolean;
  selectedItem: { category: any; item: any } | null;
  onEdit: (category: any, item: any) => void;
  onDuplicate: (categoryId: string, item: any) => void;
  onDelete: (categoryId: string, itemId: string) => void;
  onClose: () => void;
}

export function ItemActionsDrawer({
  isOpen,
  selectedItem,
  onEdit,
  onDuplicate,
  onDelete,
  onClose
}: ItemActionsDrawerProps) {
  return (
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Действия с товаром</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4">
              <X className="w-4 h-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="py-4">
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start py-3 text-left"
              onClick={() => {
                if (selectedItem) {
                  onEdit(selectedItem.category, selectedItem.item);
                  onClose();
                }
              }}
            >
              <Pencil className="h-5 w-5 mr-3" />
              Редактировать
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start py-3 text-left"
              onClick={() => {
                if (selectedItem) {
                  onDuplicate(selectedItem.category.id, selectedItem.item);
                  onClose();
                }
              }}
            >
              <Copy className="h-5 w-5 mr-3" />
              Дублировать
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start py-3 text-left text-red-500 hover:text-red-700"
              onClick={() => {
                if (selectedItem) {
                  onDelete(selectedItem.category.id, selectedItem.item.id);
                  onClose();
                }
              }}
            >
              <Trash2 className="h-5 w-5 mr-3" />
              Удалить
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}