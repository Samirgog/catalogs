import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AddCategorySection } from '../components/AddCategorySection';
import { useCategories } from '../hooks/useCategories';
import { CategoriesDataProvider } from './CategoriesEditorPage/CategoriesDataProvider';
import { CategoriesList } from './CategoriesEditorPage/components/CategoriesList';
import { CategoryHandlers, ItemHandlers } from './CategoriesEditorPage/handlers';
import { FormValidator, ErrorHandler, ValidationError } from './CategoriesEditorPage/utils';
import type { Category, Item, CategoryFormData } from '@/types';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { EmptyLottie } from '@/components/empty-lottie';
import { TourOverlay } from '../tutorial/TourOverlay';
import { useSectionTutorial } from '../tutorial/useSectionTutorial';
import type { TutorialStep } from '../tutorial/types';
import { isTutorialSeen } from '../tutorial/storage';
import { useCurrentUser } from '@/useTelegramAuth';
import { BusinessTutorialLauncher } from '../tutorial/BusinessTutorialLauncher';

const categoriesTutorialSteps: TutorialStep[] = [
  {
    id: 'add-category',
    target: '[data-tour="categories-add-category"]',
    title: 'Добавление категории',
    description: 'Создайте раздел каталога: например, «Напитки» или «Популярное».',
  },
  {
    id: 'categories-list',
    target: '[data-tour="categories-list"]',
    title: 'Список категорий и позиций',
    description: 'Здесь отображаются все категории и товары/услуги внутри них.',
  },
  {
    id: 'add-item',
    target: '[data-tour="categories-add-item"]',
    title: 'Добавление товара или услуги',
    description: 'Кнопка открывает редактор новой позиции внутри выбранной категории.',
  },
];

const firstItemTutorialStep: TutorialStep[] = [
  {
    id: 'first-item',
    target: '[data-tour="categories-first-item-card"]',
    title: 'Карточка товара/услуги',
    description: 'После создания позиция появляется здесь. Нажмите на меню карточки для редактирования.',
  },
];

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
      return;
    }
    localStorage.setItem('business-current-catalog-id', catalogId);
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

type PendingLocationState = {
  pendingCategoryId?: string;
  pendingMode?: 'create';
  pendingUntil?: number;
} | null;

const getPendingCategoryIdFromState = (
  state: PendingLocationState
): string | undefined => {
  if (!state) return undefined;
  if (state.pendingMode !== 'create') return undefined;
  if (!state.pendingUntil || state.pendingUntil <= Date.now()) return undefined;
  return state.pendingCategoryId;
};

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
  const location = useLocation();
  const { user } = useCurrentUser();
  const userKey = String(user?.id || user?.telegram_id || 'anonymous');
  const hasAnyItems = categories.some((category) => category.items.length > 0);
  const isMainTutorialSeen = isTutorialSeen(userKey, 'categories_editor');
  const mainTutorial = useSectionTutorial('categories_editor', categoriesTutorialSteps, {
    enabled: !loading,
  });
  const firstItemTutorial = useSectionTutorial(
    'categories_first_item_hint',
    firstItemTutorialStep,
    { enabled: !loading && hasAnyItems && isMainTutorialSeen }
  );
  const pendingCategoryId = getPendingCategoryIdFromState(
    (location.state as PendingLocationState) ?? null
  );
  
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
      ErrorHandler.showSuccess('Категория создана');
    } catch (error) {
      if (error instanceof ValidationError) {
        ErrorHandler.showError(error, 'Некорректные данные категории');
      } else {
        ErrorHandler.showError(error, 'Не удалось создать категорию');
      }
    }
  };



  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить категорию?')) return;

    try {
      await categoryHandlers.delete(categoryId);
      ErrorHandler.showSuccess('Категория удалена');
    } catch (error) {
      ErrorHandler.showError(error, 'Не удалось удалить категорию');
    }
  };

  // Item operations
  const handleDeleteItem = async (itemId: string, categoryId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    try {
      await itemHandlers.delete(itemId, categoryId);
      ErrorHandler.showSuccess('Товар удален');
    } catch (error) {
      ErrorHandler.showError(error, 'Не удалось удалить товар');
    }
  };

  const handleDuplicateItem = async (item: Item, categoryId: string) => {
    try {
      await itemHandlers.duplicate(item, categoryId, categories);
      ErrorHandler.showSuccess('Товар продублирован');
    } catch (error) {
      ErrorHandler.showError(error, 'Не удалось продублировать товар');
    }
  };

  const handleCategorySubmit = async () => {
    try {
      await handleCreateCategory();
    } catch {}
  };



  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Редактор каталога</h1>
          <BusinessTutorialLauncher />
        </div>
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
          pendingCategoryId={pendingCategoryId}
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

        {categories.length === 0 && (
          <div className="mt-8 glass-card rounded-xl p-6 text-center space-y-2">
            <div className="flex justify-center">
              <EmptyLottie src={`${import.meta.env.BASE_URL}empty_ghost.lottie`} className="w-40 h-40" />
            </div>
            <p className="font-medium">Категорий пока нет</p>
            <p className="text-sm text-muted-foreground">
              Добавьте первую категорию, чтобы заполнить каталог.
            </p>
          </div>
        )}
      </div>

      {/* Navigation Button */}
      <div className="fixed bottom-6 left-4 right-4">
        <Button 
          data-tour="categories-back"
          className="w-full h-14 text-base"
          onClick={() => navigate(`/catalogs/${catalogId}/edit`)}
        >
          Назад к редактированию каталога
        </Button>
      </div>
      <TourOverlay
        open={mainTutorial.open}
        steps={categoriesTutorialSteps}
        sectionTitle="Категории и товары"
        onClose={mainTutorial.closeAndMarkSeen}
        onComplete={mainTutorial.complete}
      />
      <TourOverlay
        open={firstItemTutorial.open}
        steps={firstItemTutorialStep}
        sectionTitle="Карточка позиции"
        onClose={firstItemTutorial.closeAndMarkSeen}
        onComplete={firstItemTutorial.complete}
      />
    </div>
  );
}
