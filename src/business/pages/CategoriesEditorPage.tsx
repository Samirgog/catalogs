import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CategoriesEditorHeader } from '../components/CategoriesEditorHeader';
import { AddCategorySection } from '../components/AddCategorySection';
import { CategoryEditorDrawer } from '../components/CategoryEditorDrawer';
import { ItemEditorDrawer } from '../components/ItemEditorDrawer';
import { ItemActionsDrawer } from '../components/ItemActionsDrawer';
import { useCategories } from '../hooks/useCategories';
import { useImagePreview } from '../hooks/useImages';
import { CategoriesDataProvider } from './CategoriesEditorPage/CategoriesDataProvider';
import { CategoriesList } from './CategoriesEditorPage/components/CategoriesList';
import { CategoryHandlers, ItemHandlers } from './CategoriesEditorPage/handlers';
import { FormValidator, ErrorHandler, ValidationError } from './CategoriesEditorPage/utils';
import type { Category, Item, CategoryFormData, ItemFormData } from '@/types';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';

export function CategoriesEditorPage() {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();

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
  useAutoBackButton();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State management
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState<CategoryFormData>({ 
    title: '', 
    position: 0 
  });
  const [newItemForm, setNewItemForm] = useState<ItemFormData>({ 
    title: '', 
    description: '', 
    price: 0, 
    image_url: '', 
    is_available: true, 
    position: 0 
  });
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<{category: Category; item: Item} | null>(null);

  // Hooks
  const { generatePreview, clearPreview } = useImagePreview();

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

  const handleUpdateCategory = async (categoryId: string) => {
    try {
      FormValidator.validateCategoryForm(newCategoryForm);
      
      const categoryData: Partial<CategoryFormData> = {
        title: newCategoryForm.title.trim(),
        position: newCategoryForm.position
      };

      await categoryHandlers.update(categoryId, categoryData);
      setNewCategoryForm({ title: '', position: 0 });
      setEditingCategory(null);
      ErrorHandler.showSuccess('Category updated successfully');
    } catch (error) {
      if (error instanceof ValidationError) {
        ErrorHandler.showError(error, 'Invalid category data');
      } else {
        ErrorHandler.showError(error, 'Failed to update category');
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
  const handleCreateItem = async (categoryId: string) => {
    try {
      FormValidator.validateItemForm(newItemForm);
      
      await itemHandlers.create(categoryId, newItemForm, itemImageFile);
      
      resetItemForm();
      setEditingItem(null);
      setIsAddingNewItem(false);
      ErrorHandler.showSuccess('Item created successfully');
    } catch (error) {
      if (error instanceof ValidationError) {
        ErrorHandler.showError(error, 'Invalid item data');
      } else {
        ErrorHandler.showError(error, 'Failed to create item');
      }
    }
  };

  const handleUpdateItem = async (itemId: string, categoryId: string) => {
    try {
      FormValidator.validateItemForm(newItemForm);
      
      await itemHandlers.update(itemId, categoryId, newItemForm, itemImageFile);
      
      resetItemForm();
      setEditingItem(null);
      ErrorHandler.showSuccess('Item updated successfully');
    } catch (error) {
      if (error instanceof ValidationError) {
        ErrorHandler.showError(error, 'Invalid item data');
      } else {
        ErrorHandler.showError(error, 'Failed to update item');
      }
    }
  };

  const handleDeleteItem = async (itemId: string, categoryId: string) => {
    try {
      await itemHandlers.delete(itemId, categoryId);
      ErrorHandler.showSuccess('Item deleted successfully');
    } catch (error) {
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

  // Form helpers
  const resetItemForm = () => {
    setNewItemForm({ 
      title: '', 
      description: '', 
      price: 0, 
      image_url: '', 
      is_available: true, 
      position: 0 
    });
    setItemImageFile(null);
    setPreviewUrl(null);
    clearPreview();
  };

  const handleCategorySubmit = async () => {
    try {
      if (editingCategory) {
        await handleUpdateCategory(editingCategory.id);
      } else {
        await handleCreateCategory();
      }
    } catch (error) {
      console.error('Category operation failed:', error);
    }
  };

  const handleItemSubmit = async () => {
    if (!editingCategory) return;

    try {
      if (editingItem) {
        await handleUpdateItem(editingItem.id, editingCategory.id);
      } else {
        await handleCreateItem(editingCategory.id);
      }
    } catch (error) {
      console.error('Item operation failed:', error);
    }
  };

  // Event handlers
  const handleEditItem = (category: Category, item: Item) => {
    setEditingCategory(category);
    setEditingItem(item);
    setNewItemForm({
      title: item.title,
      description: item.description || '',
      price: item.price || 0,
      image_url: item.image_url || '',
      is_available: item.is_available ?? true,
      position: item.position || 0
    });
  };

  const handleBack = () => {
    navigate(`/catalogs/${catalogId}/edit`);
  };

  // Long press handlers
  const handleItemMouseDown = (category: Category, item: Item) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedItem({category, item});
    }, 500);
  };

  const handleItemMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleItemTouchStart = (category: Category, item: Item) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedItem({category, item});
    }, 500);
  };

  const handleItemTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleCloseItemActions = () => {
    setSelectedItem(null);
  };

  const handleItemCardClick = (category: Category, item: Item) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setSelectedItem({category, item});
  };

  return (
    <div className="min-h-screen bg-background">
      <CategoriesEditorHeader onBack={handleBack} />

      {/* Loading/Error states */}
      {(loading || !catalogId) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-lg">Загрузка...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed top-20 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <strong>Error:</strong> {error}
          <button 
            className="ml-4 text-red-800 hover:text-red-900"
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
            setEditingCategory(cat);
            setNewCategoryForm({
              title: cat.title,
              position: cat.position || 0
            });
          }}
          onDeleteCategory={handleDeleteCategory}
          onAddItem={(cat) => {
            setEditingCategory(cat);
            setEditingItem(null);
            setIsAddingNewItem(true);
            setNewItemForm({ 
              title: '', 
              description: '', 
              price: 0, 
              image_url: '', 
              is_available: true, 
              position: (cat.items?.length || 0) + 1 
            });
          }}
          onItemMouseDown={handleItemMouseDown}
          onItemMouseUp={handleItemMouseUp}
          onItemTouchStart={handleItemTouchStart}
          onItemTouchEnd={handleItemTouchEnd}
          onItemCardClick={handleItemCardClick}
        />
      </div>

      {/* Drawers */}
      <CategoryEditorDrawer
        isOpen={!!editingCategory && !editingItem && !isAddingNewItem}
        editingCategory={editingCategory}
        formData={{
          title: newCategoryForm.title,
          position: newCategoryForm.position ?? 0
        }}
        onFormChange={(data) => setNewCategoryForm(prev => ({ ...prev, ...data }))}
        onSubmit={handleCategorySubmit}
        onClose={() => {
          setEditingCategory(null);
          setNewCategoryForm({ title: '', position: 0 });
        }}
      />

      <ItemEditorDrawer
        isOpen={!!editingItem || isAddingNewItem}
        editingItem={editingItem}
        editingCategory={editingCategory}
        formData={newItemForm}
        previewUrl={previewUrl ?? null}
        onFormChange={setNewItemForm}
        onFileChange={setItemImageFile}
        onClearPreview={() => {
          clearPreview();
          setPreviewUrl(null);
        }}
        onSubmit={handleItemSubmit}
        onClose={() => {
          setEditingItem(null);
          setIsAddingNewItem(false);
          resetItemForm();
        }}
        onCategoryClear={() => {
          setEditingCategory(null);
        }}
        generatePreview={async (file) => {
          const url = await generatePreview(file);
          setPreviewUrl(url);
        }}
      />

      <ItemActionsDrawer
        isOpen={!!selectedItem}
        selectedItem={selectedItem}
        onEdit={handleEditItem}
        onDuplicate={() => selectedItem && handleDuplicateItem(selectedItem.item, selectedItem.category.id)}
        onDelete={(itemId) => selectedItem && handleDeleteItem(itemId, selectedItem.category.id)}
        onClose={handleCloseItemActions}
      />

      {/* Navigation Button */}
      <div className="fixed bottom-6 left-4 right-4 px-4">
        <Button 
          className="w-full h-14 text-lg" 
          onClick={() => navigate(`/catalogs/${catalogId}/edit`)}
        >
          Назад к редактированию каталога
        </Button>
      </div>
    </div>
  );
}