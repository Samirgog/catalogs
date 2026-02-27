import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Pencil } from 'lucide-react';
import type { Category, Item } from '@/types';

type Props = {
  category: Category;
  item: Item;
  tourMarker?: string;
  onEditItem: (category: Category, item: Item) => void;
  onDuplicateItem: (categoryId: string, item: Item) => void;
  onDeleteItem: (itemId: string, categoryId: string) => void;
};

export function CategoryItemCard({
  category,
  item,
  tourMarker,
  onEditItem,
  onDuplicateItem,
  onDeleteItem,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative glass-card border-0 p-3" data-tour={tourMarker}>
      <div className="flex gap-4">
        {item.image_url ? (
          <img
            src={item.image_url}
            className="h-20 w-20 rounded-md object-cover"
            alt={item.title}
          />
        ) : (
          <div className="h-20 w-20 rounded-md bg-gray-200 flex items-center justify-center">
            <div className="h-6 w-6 text-gray-400 bg-gray-300 rounded" />
          </div>
        )}
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col">
            <h3 className="font-medium">{item.title}</h3>
            {item.description && (
              <h5 className="font-regular text-gray-500 text-xs">
                {item.description}
              </h5>
            )}
          </div>
          <div className="mt-3">
            <div className="font-semibold text-base">{item.price} ₽</div>
          </div>
        </div>
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start py-2 text-left"
              onClick={(e) => {
                e.stopPropagation();
                onEditItem(category, item);
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
                onDuplicateItem(category.id, item);
                setIsOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span className="ml-2">Дублировать</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start py-2 text-left text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem(item.id, category.id);
                setIsOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span className="ml-2">Удалить</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
