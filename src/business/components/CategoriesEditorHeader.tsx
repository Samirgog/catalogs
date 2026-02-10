import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface CategoriesEditorHeaderProps {
  onBack: () => void;
}

export function CategoriesEditorHeader({ onBack }: CategoriesEditorHeaderProps) {
  return (
    <div className="p-4 border-b bg-background sticky top-0 z-20">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2 flex-1">Редактор каталога</h1>
      </div>
    </div>
  );
}