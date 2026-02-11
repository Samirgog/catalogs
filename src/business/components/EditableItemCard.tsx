import { Card, CardContent } from '@/components/ui/card';
import { Image } from 'lucide-react';
import { ItemActionsPopover } from './ItemActionsPopover';

interface EditableItemCardProps {
  category: any;
  item: any;
  onItemMouseDown: (category: any, item: any) => void;
  onItemMouseUp: () => void;
  onItemTouchStart: (category: any, item: any) => void;
  onItemTouchEnd: () => void;
  onItemCardClick: (category: any, item: any) => void;
  onEditItem: (category: any, item: any) => void;
  onDuplicateItem: (categoryId: string, item: any) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
}

export function EditableItemCard({
  category,
  item,
  onItemMouseDown,
  onItemMouseUp,
  onItemTouchStart,
  onItemTouchEnd,
  onItemCardClick,
  onEditItem,
  onDuplicateItem,
  onDeleteItem
}: EditableItemCardProps) {
  return (
    <ItemActionsPopover
      category={category}
      item={item}
      onEdit={onEditItem}
      onDuplicate={onDuplicateItem}
      onDelete={onDeleteItem}
    >
      <div 
        key={item.id}
        className="relative"
        onMouseDown={() => onItemMouseDown(category, item)}
        onMouseUp={onItemMouseUp}
        onMouseLeave={onItemMouseUp}
        onTouchStart={() => onItemTouchStart(category, item)}
        onTouchEnd={onItemTouchEnd}
        onClick={() => onItemCardClick(category, item)}
      >
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex gap-4 p-3">
            {item.image_url ? (
              <img
                src={item.image_url}
                className="h-20 w-20 rounded-md object-cover"
                alt={item.title}
              />
            ) : (
              <div className="h-20 w-20 rounded-md bg-gray-200 flex items-center justify-center">
                <Image className="h-6 w-6 text-gray-400" />
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
                <div className="font-semibold text-base">
                  {item.price} ₽
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ItemActionsPopover>
  );
}