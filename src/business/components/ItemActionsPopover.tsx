import { useState, useEffect } from 'react';
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
}

export function ItemActionsPopover({
  category,
  item,
  onEdit,
  onDuplicate,
  onDelete
}: ItemActionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className="absolute top-2 right-2 z-10"
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start py-2 text-left"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(category, item);
              setIsOpen(false);
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start py-2 text-left"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(category.id, item);
              setIsOpen(false);
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Дублировать
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start py-2 text-left text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category.id, item.id);
              setIsOpen(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}