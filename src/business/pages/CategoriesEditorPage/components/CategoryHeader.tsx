import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { Category } from '@/types';

type Props = {
  category: Category;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
};

export function CategoryHeader({
  category,
  onEditCategory,
  onDeleteCategory,
}: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">{category.title}</h2>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEditCategory(category)}
          aria-label="Редактировать категорию"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDeleteCategory(category.id)}
          className="text-red-500 hover:text-red-700"
          aria-label="Удалить категорию"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
