import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check } from 'lucide-react';
import { categoryService } from '../services/categories';
import { FormValidator, ErrorHandler, ValidationError } from './CategoriesEditorPage/utils';
import type { CategoryFormData } from '@/types';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';

export function CategoryEditorPage() {
  const { catalogId, categoryId } = useParams<{ 
    catalogId: string; 
    categoryId?: string;
  }>();
  const navigate = useNavigate();
  
  useAutoBackButton();

  // Validate required params
  useEffect(() => {
    if (!catalogId) {
      console.error('Missing catalogId parameter');
      navigate(-1);
    }
  }, [catalogId, navigate]);

  // Early return if missing params
  if (!catalogId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <CategoryEditorView 
      catalogId={catalogId} 
      categoryId={categoryId}
    />
  );
}

interface CategoryEditorViewProps {
  catalogId: string;
  categoryId?: string;
}

function CategoryEditorView({ catalogId, categoryId }: CategoryEditorViewProps) {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({ 
    title: '', 
    position: 0 
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load existing category data if editing
  useEffect(() => {
    if (categoryId) {
      const loadCategoryData = async () => {
        try {
          setIsLoading(true);
          const category = await categoryService.getById(categoryId);
          
          if (category) {
            setFormData({
              title: category.title,
              position: category.position || 0
            });
          }
        } catch (error) {
          ErrorHandler.showError(error, 'Failed to load category data');
          navigate(-1);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadCategoryData();
    } else {
      // For new categories, set default position
      setFormData(prev => ({
        ...prev,
        position: 1 // Will be adjusted when saving
      }));
    }
  }, [categoryId, navigate]);

  const handleSubmit = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      FormValidator.validateCategoryForm(formData);
      
      const categoryData: CategoryFormData = {
        title: formData.title.trim(),
        position: formData.position || 1
      };
      
      if (categoryId) {
        // Update existing category
        await categoryService.update(categoryId, categoryData);
        ErrorHandler.showSuccess('Category updated successfully');
      } else {
        // Create new category
        await categoryService.create(categoryData, catalogId);
        ErrorHandler.showSuccess('Category created successfully');
      }
      
      // Navigate back to categories editor
      navigate(`/categories/editor/${catalogId}`);
    } catch (error) {
      if (error instanceof ValidationError) {
        ErrorHandler.showError(error, 'Invalid category data');
      } else {
        ErrorHandler.showError(error, categoryId ? 'Failed to update category' : 'Failed to create category');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/categories/editor/${catalogId}`);
  };

  if (isLoading && categoryId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="flex items-center p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCancel}
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">
            {categoryId ? 'Редактировать категорию' : 'Создать категорию'}
          </h1>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8">
        <div className="space-y-6 max-w-md mx-auto">
          <div>
            <Label htmlFor="category-title" className="block mb-2 text-sm font-medium">
              Название
            </Label>
            <Input
              id="category-title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Введите название категории"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="category-position" className="block mb-2 text-sm font-medium">
              Позиция
            </Label>
            <Input
              id="category-position"
              type="number"
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: parseInt(e.target.value) || 0})}
              placeholder="Позиция в списке"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}