import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { EditableItemCard } from './EditableItemCard';

interface CategorySectionProps {
  category: any;
  onEditCategory: (category: any) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddItem: (category: any) => void;
  onItemMouseDown: (category: any, item: any) => void;
  onItemMouseUp: () => void;
  onItemTouchStart: (category: any, item: any) => void;
  onItemTouchEnd: () => void;
  onItemCardClick: (category: any, item: any) => void;
}

export function CategorySection({
  category,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onItemMouseDown,
  onItemMouseUp,
  onItemTouchStart,
  onItemTouchEnd,
  onItemCardClick
}: CategorySectionProps) {
  return (
    <section key={category.id} className="scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{category.title}</h2>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEditCategory(category)}
          >
            <Pencil className="w-4 h-4 mr-1" />
            Редактировать
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDeleteCategory(category.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Удалить
          </Button>
        </div>
      </div>
      
      {/* Add Item Button */}
      <div className="mb-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onAddItem(category)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить товар
        </Button>
      </div>
      
      {/* Items Grid */}
      <div className="grid gap-3">
        {(category.items || []).map((item: any) => (
          <EditableItemCard
            key={item.id}
            category={category}
            item={item}
            onItemMouseDown={onItemMouseDown}
            onItemMouseUp={onItemMouseUp}
            onItemTouchStart={onItemTouchStart}
            onItemTouchEnd={onItemTouchEnd}
            onItemCardClick={onItemCardClick}
          />
        ))}
      </div>
    </section>
  );
}