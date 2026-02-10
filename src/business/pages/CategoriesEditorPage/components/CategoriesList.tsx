import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Category, Item } from '../../../../types';

interface CategoriesListProps {
  categories: (Category & { items: Item[] })[];
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddItem: (category: Category) => void;
  onItemMouseDown: (category: Category, item: Item) => void;
  onItemMouseUp: () => void;
  onItemTouchStart: (category: Category, item: Item) => void;
  onItemTouchEnd: () => void;
  onItemCardClick: (category: Category, item: Item) => void;
}

export function CategoriesList({
  categories,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onItemMouseDown,
  onItemMouseUp,
  onItemTouchStart,
  onItemTouchEnd,
  onItemCardClick
}: CategoriesListProps) {
  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          onAddItem={onAddItem}
          onItemMouseDown={onItemMouseDown}
          onItemMouseUp={onItemMouseUp}
          onItemTouchStart={onItemTouchStart}
          onItemTouchEnd={onItemTouchEnd}
          onItemCardClick={onItemCardClick}
        />
      ))}
    </div>
  );
}

interface CategorySectionProps {
  category: Category & { items: Item[] };
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddItem: (category: Category) => void;
  onItemMouseDown: (category: Category, item: Item) => void;
  onItemMouseUp: () => void;
  onItemTouchStart: (category: Category, item: Item) => void;
  onItemTouchEnd: () => void;
  onItemCardClick: (category: Category, item: Item) => void;
}

function CategorySection({
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
        {category.items.map((item) => (
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

interface EditableItemCardProps {
  category: Category;
  item: Item;
  onItemMouseDown: (category: Category, item: Item) => void;
  onItemMouseUp: () => void;
  onItemTouchStart: (category: Category, item: Item) => void;
  onItemTouchEnd: () => void;
  onItemCardClick: (category: Category, item: Item) => void;
}

function EditableItemCard({
  category,
  item,
  onItemMouseDown,
  onItemMouseUp,
  onItemTouchStart,
  onItemTouchEnd,
  onItemCardClick
}: EditableItemCardProps) {
  return (
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
      <div className="bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow p-3">
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
              <div className="font-semibold text-base">
                {item.price} ₽
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}