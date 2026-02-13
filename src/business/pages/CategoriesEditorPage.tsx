import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AddCategorySection } from '../components/AddCategorySection';
import { useCategories } from '../hooks/useCategories';
import { CategoriesDataProvider } from './CategoriesEditorPage/CategoriesDataProvider';
import { CategoriesList } from './CategoriesEditorPage/components/CategoriesList';
import { CategoryHandlers, ItemHandlers } from './CategoriesEditorPage/handlers';
import { FormValidator, ErrorHandler, ValidationError } from './CategoriesEditorPage/utils';
import type { Category, Item, CategoryFormData } from '@/types';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';

export function CategoriesEditorPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();

  useAutoBackButton(`/catalogs/${catalogId}/edit`);

  // Category operations hooks
  const { createCategory, updateCategory, deleteCategory } = useCategories(catalogId ?? '');

  // Validate catalogId
  useEffect(() => {
    if (!catalogId) {
      console.error('Missing catalogId parameter');
      navigate('/catalogs');
    }
  }, [catalogId, navigate]);

  // Early return if no catalogId
  if (!catalogId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <CategoriesDataProvider catalogId={catalogId}>
      {({ categoriesWithItems, categoriesLoading, categoriesError, refreshData, getItemOperations }) => {
        // Create handlers with proper context
        const itemHandlers = new ItemHandlers({
          getItemHook: getItemOperations
        });
        
        const categoryHandlers = new CategoryHandlers({
          catalogId,
          createCategory,
          updateCategory,
          deleteCategory
        });
        
        return (
          <CategoriesEditorView
            catalogId={catalogId}
            categories={categoriesWithItems}
            loading={categoriesLoading}
            error={categoriesError}
            onRefresh={refreshData}
            categoryHandlers={categoryHandlers}
            itemHandlers={itemHandlers}
          />
        );
      }}
    </CategoriesDataProvider>
  );
}

interface CategoriesEditorViewProps {
  catalogId: string;
  categories: (Category & { items: Item[] })[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  categoryHandlers: CategoryHandlers;
  itemHandlers: ItemHandlers;
}

function CategoriesEditorView({
  catalogId,
  categories,
  loading,
  error,
  onRefresh,
  categoryHandlers,
  itemHandlers
}: CategoriesEditorViewProps) {
  const navigate = useNavigate();
  
  // Refresh data when component mounts or comes back from editor
  useEffect(() => {
    onRefresh();
  }, [onRefresh]);


  // State management
  const [newCategoryForm, setNewCategoryForm] = useState<CategoryFormData>({ 
    title: '', 
    position: 0 
  });



  // Category operations
  const handleCreateCategory = async () => {
    try {
      FormValidator.validateCategoryForm(newCategoryForm);
      
      const categoryData: CategoryFormData = {
        title: newCategoryForm.title.trim(),
        position: newCategoryForm.position || categories.length + 1
      };

      await categoryHandlers.create(categoryData);
      setNewCategoryForm({ title: '', position: 0 });
      ErrorHandler.showSuccess('Category created successfully');
    } catch (error) {
      if (error instanceof ValidationError) {
        ErrorHandler.showError(error, 'Invalid category data');
      } else {
        ErrorHandler.showError(error, 'Failed to create category');
      }
    }
  };



  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryHandlers.delete(categoryId);
      ErrorHandler.showSuccess('Category deleted successfully');
    } catch (error) {
      ErrorHandler.showError(error, 'Failed to delete category');
    }
  };

  // Item operations
  const handleDeleteItem = async (itemId: string, categoryId: string) => {
    console.log('Attempting to delete item:', { itemId, categoryId });
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    try {
      console.log('Calling itemHandlers.delete...');
      await itemHandlers.delete(itemId, categoryId);
      console.log('Delete successful');
      ErrorHandler.showSuccess('Item deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      ErrorHandler.showError(error, 'Failed to delete item');
    }
  };

  const handleDuplicateItem = async (item: Item, categoryId: string) => {
    try {
      await itemHandlers.duplicate(item, categoryId, categories);
      ErrorHandler.showSuccess('Item duplicated successfully');
    } catch (error) {
      ErrorHandler.showError(error, 'Failed to duplicate item');
    }
  };

  const handleCategorySubmit = async () => {
    try {
      await handleCreateCategory();
    } catch (error) {
      console.error('Category operation failed:', error);
    }
  };



  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <h1 className="text-2xl font-bold">Редактор каталога</h1>
      </div>

      {/* Loading/Error states */}
      {(loading || !catalogId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-4 rounded-xl">
            <div className="text-lg">Загрузка...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed top-20 left-4 right-4 glass-card border-destructive/50 text-destructive p-4 rounded-xl z-50">
          <strong>Error:</strong> {error}
          <button 
            className="ml-4 text-sm underline"
            onClick={onRefresh}
          >
            Обновить
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 pb-32 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
        <AddCategorySection 
          title={newCategoryForm.title}
          onTitleChange={(title) => setNewCategoryForm(prev => ({ ...prev, title }))}
          onSubmit={handleCategorySubmit}
        />

        <CategoriesList
          categories={categories}
          onEditCategory={(cat) => {
            navigate(`/categories/${catalogId}/category-editor/${cat.id}`);
          }}
          onDeleteCategory={handleDeleteCategory}
          onAddItem={(cat) => {
            navigate(`/categories/${catalogId}/item-editor/${cat.id}`);
          }}
          onEditItem={(category, item) => {
            navigate(`/categories/${catalogId}/item-editor/${category.id}/${item.id}`);
          }}
          onDuplicateItem={(categoryId, item) => handleDuplicateItem(item, categoryId)}
          onDeleteItem={handleDeleteItem}
        />
      </div>

      {/* Navigation Button */}
      <div className="fixed bottom-6 left-4 right-4">
        <Button 
          className="w-full h-14 text-base"
          onClick={() => navigate(`/catalogs/${catalogId}/edit`)}
        >
          Назад к редактированию каталога
        </Button>
      </div>
    </div>
  );
}