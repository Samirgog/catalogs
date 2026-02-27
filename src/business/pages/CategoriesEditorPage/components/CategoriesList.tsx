import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Category, Item } from '../../../../types';
import { CategoryHeader } from './CategoryHeader';
import { CategoryItemCard } from './CategoryItemCard';
import { PendingItemSkeleton } from './PendingItemSkeleton';

interface CategoriesListProps {
  categories: (Category & { items: Item[] })[];
  pendingCategoryId?: string;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddItem: (category: Category) => void;
  onEditItem: (category: Category, item: Item) => void;
  onDuplicateItem: (categoryId: string, item: Item) => void;
  onDeleteItem: (itemId: string, categoryId: string) => void;
}

export function CategoriesList({
  categories,
  pendingCategoryId,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDuplicateItem,
  onDeleteItem
}: CategoriesListProps) {
  return (
    <div className="space-y-8" data-tour="categories-list">
      {categories.map((category, index) => (
        <CategorySection
          key={category.id}
          category={category}
          isFirst={index === 0}
          pending={pendingCategoryId === category.id}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onDuplicateItem={onDuplicateItem}
          onDeleteItem={onDeleteItem}
        />
      ))}
    </div>
  );
}

interface CategorySectionProps {
  category: Category & { items: Item[] };
  isFirst: boolean;
  pending?: boolean;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddItem: (category: Category) => void;
  onEditItem: (category: Category, item: Item) => void;
  onDuplicateItem: (categoryId: string, item: Item) => void;
  onDeleteItem: (itemId: string, categoryId: string) => void;
}

function CategorySection({
  category,
  isFirst,
  pending = false,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDuplicateItem,
  onDeleteItem
}: CategorySectionProps) {
  return (
    <section key={category.id} className="scroll-mt-24">
      <CategoryHeader
        category={category}
        onEditCategory={onEditCategory}
        onDeleteCategory={onDeleteCategory}
      />
      
      {/* Add Item Button */}
      <div className="mb-4">
        <Button 
          variant="outline" 
          className="w-full"
          data-tour={isFirst ? 'categories-add-item' : undefined}
          onClick={() => onAddItem(category)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить товар
        </Button>
      </div>
      
      {/* Items Grid */}
      <div className="grid gap-3">
        {pending && <PendingItemSkeleton />}
        {category.items.map((item, index) => (
          <CategoryItemCard
            key={item.id}
            category={category}
            item={item}
            tourMarker={isFirst && index === 0 ? 'categories-first-item-card' : undefined}
            onEditItem={onEditItem}
            onDuplicateItem={onDuplicateItem}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </div>
    </section>
  );
}
