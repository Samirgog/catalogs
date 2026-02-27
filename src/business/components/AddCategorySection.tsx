import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface AddCategorySectionProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSubmit: () => void;
}

export function AddCategorySection({ title, onTitleChange, onSubmit }: AddCategorySectionProps) {
  return (
    <div className="mb-4 p-4 glass-card" data-tour="categories-add-category">
      <h2 className="text-lg font-semibold mb-3">Добавить новую категорию</h2>
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Название категории"
          className="flex-1 glass-input"
        />
        <Button onClick={onSubmit}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
      </div>
    </div>
  );
}
