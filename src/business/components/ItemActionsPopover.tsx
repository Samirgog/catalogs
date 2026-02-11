import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Pencil, Copy, Trash2 } from 'lucide-react';

interface ItemActionsPopoverProps {
  category: any;
  item: any;
  onEdit: (category: any, item: any) => void;
  onDuplicate: (categoryId: string, item: any) => void;
  onDelete: (categoryId: string, itemId: string) => void;
  children: React.ReactNode;
}

export function ItemActionsPopover({
  category,
  item,
  onEdit,
  onDuplicate,
  onDelete,
  children
}: ItemActionsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start py-2 text-left"
            onClick={() => onEdit(category, item)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start py-2 text-left"
            onClick={() => onDuplicate(category.id, item)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Дублировать
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start py-2 text-left text-red-500 hover:text-red-700"
            onClick={() => onDelete(category.id, item.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}