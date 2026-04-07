import { create } from 'zustand';
import { useCategories } from '../hooks/useCategories';
import { useItems } from '../hooks/useItems';
import { useImageUpload } from '../hooks/useImages';
import type { Catalog, Category, Item, CategoryFormData, ItemFormData } from '../../types';

interface CategoriesEditorState {
  // State
  catalog: Catalog | null;
  categories: Category[];
  loading: boolean;
  error: string | null;
  
  // Editing states
  editingCategory: Category | null;
  editingItem: Item | null;
  selectedItem: { category: Category; item: Item } | null;
  
  // Forms
  newCategoryForm: CategoryFormData;
  newItemForm: ItemFormData;
  itemImageFile: File | null;
  
  // Preview
  previewUrl: string | null;
  
  // Actions
  initializeStore: (catalog: Catalog) => void;
  
  // Category operations
  createCategory: (formData: CategoryFormData, catalogId: string) => Promise<Category>;
  updateCategory: (id: string, formData: Partial<CategoryFormData>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Item operations
  createItem: (categoryId: string, formData: ItemFormData, imageFile?: File | null) => Promise<Item>;
  updateItem: (id: string, formData: Partial<ItemFormData>, imageFile?: File | null) => Promise<Item>;
  deleteItem: (categoryId: string, itemId: string) => Promise<void>;
  duplicateItem: (categoryId: string, item: Item) => Promise<Item>;
  
  // State management
  setEditingCategory: (category: Category | null) => void;
  setEditingItem: (item: Item | null) => void;
  setSelectedItem: (selection: { category: Category; item: Item } | null) => void;
  
  // Form management
  updateNewCategoryForm: (formData: Partial<CategoryFormData>) => void;
  updateNewItemForm: (formData: Partial<ItemFormData>) => void;
  setItemImageFile: (file: File | null) => void;
  
  // Preview management (functions passed from component)
  setPreviewUrl: (url: string | null) => void;
  
  // Reset
  resetForms: () => void;
  resetStore: () => void;
}

export const useCategoriesEditorStore = create<CategoriesEditorState>((set, get) => ({
  // Initial state
  catalog: null,
  categories: [],
  loading: false,
  error: null,
  
  editingCategory: null,
  editingItem: null,
  selectedItem: null,
  
  newCategoryForm: {
    title: '',
    position: 0
  },
  newItemForm: {
    title: '',
    description: '',
    price: 0,
    image_url: '',
    is_available: true,
    position: 0
  },
  itemImageFile: null,
  previewUrl: null,
  
  // Initialize store with catalog data
  initializeStore: (catalog: Catalog) => {
    set({
      catalog,
      categories: catalog.categories || [],
      error: null
    });
  },
  
  // Category operations
  createCategory: async (formData: CategoryFormData, catalogId: string) => {
    set({ loading: true, error: null });
    
    try {
      const { createCategory: createCategoryHook } = useCategories(catalogId);
      const newCategory = await createCategoryHook(formData);
      
      set(state => ({
        categories: [...state.categories, newCategory],
        loading: false,
        error: null
      }));
      
      return newCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  updateCategory: async (id: string, formData: Partial<CategoryFormData>) => {
    set({ loading: true, error: null });
    
    try {
      const { updateCategory: updateCategoryHook } = useCategories(id);
      const updatedCategory = await updateCategoryHook(id, formData);
      
      set(state => ({
        categories: state.categories.map(cat => 
          cat.id === id ? { ...cat, ...updatedCategory } : cat
        ),
        loading: false,
        error: null
      }));
      
      return updatedCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  deleteCategory: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const { deleteCategory: deleteCategoryHook } = useCategories(id);
      await deleteCategoryHook(id);
      
      set(state => ({
        categories: state.categories.filter(cat => cat.id !== id),
        loading: false,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  // Item operations
  createItem: async (categoryId: string, formData: ItemFormData, imageFile?: File | null) => {
    set({ loading: true, error: null });
    
    try {
      // Upload image if provided
      let imageUrl = formData.image_url;
      if (imageFile) {
        const { uploadImage } = useImageUpload();
        const timestamp = Date.now();
        const safeFileName = `${timestamp}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const uploadPath = `items/${categoryId}/${safeFileName}`;
        imageUrl = await uploadImage(imageFile, uploadPath);
      }
      
      const itemData = {
        ...formData,
        image_url: imageUrl || ''
      };
      
      const { createItem: createItemHook } = useItems(categoryId);
      const newItem = await createItemHook(itemData);
      
      set(state => ({
        categories: state.categories.map(cat => 
          cat.id === categoryId 
            ? { 
                ...cat, 
                items: [...(cat.items || []), newItem] 
              } 
            : cat
        ),
        loading: false,
        error: null
      }));
      
      return newItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  updateItem: async (id: string, formData: Partial<ItemFormData>, imageFile?: File | null) => {
    set({ loading: true, error: null });
    
    try {
      // Upload image if provided
      let imageUrl = formData.image_url;
      if (imageFile) {
        const { uploadImage } = useImageUpload();
        // Find the item to get category ID for path
        const state = get();
        const category = state.categories.find(cat => 
          cat.items?.some(item => item.id === id)
        );
        if (category) {
          const timestamp = Date.now();
          const safeFileName = `${timestamp}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const uploadPath = `items/${category.id}/${safeFileName}`;
          imageUrl = await uploadImage(imageFile, uploadPath);
        }
      }
      
      const itemData = {
        ...formData,
        ...(imageUrl && { image_url: imageUrl })
      };
      
      const { updateItem: updateItemHook } = useItems(id);
      const updatedItem = await updateItemHook(id, itemData);
      
      set(state => ({
        categories: state.categories.map(cat => ({
          ...cat,
          items: cat.items?.map(item => 
            item.id === id ? { ...item, ...updatedItem } : item
          ) || []
        })),
        loading: false,
        error: null
      }));
      
      return updatedItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  deleteItem: async (categoryId: string, itemId: string) => {
    set({ loading: true, error: null });
    
    try {
      const { deleteItem: deleteItemHook } = useItems(categoryId);
      await deleteItemHook(itemId);
      
      set(state => ({
        categories: state.categories.map(cat => 
          cat.id === categoryId 
            ? { 
                ...cat, 
                items: (cat.items || []).filter(item => item.id !== itemId) 
              } 
            : cat
        ),
        loading: false,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  duplicateItem: async (categoryId: string, item: Item) => {
    set({ loading: true, error: null });
    
    try {
      const duplicatedItemData: ItemFormData = {
        title: `${item.title} (копия)`,
        description: item.description || '',
        detailed_description: item.detailed_description || '',
        price: item.price || 0,
        image_url: item.image_url || '',
        is_available: item.is_available ?? true,
        position: (item.position || 0) + 1
      };
      
      const { createItem: createItemHook } = useItems(categoryId);
      const duplicatedItem = await createItemHook(duplicatedItemData);
      
      set(state => ({
        categories: state.categories.map(cat => 
          cat.id === categoryId 
            ? { 
                ...cat, 
                items: [...(cat.items || []), duplicatedItem] 
              } 
            : cat
        ),
        loading: false,
        error: null
      }));
      
      return duplicatedItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate item';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  // State management
  setEditingCategory: (category) => set({ editingCategory: category }),
  setEditingItem: (item) => set({ editingItem: item }),
  setSelectedItem: (selection) => set({ selectedItem: selection }),
  
  // Form management
  updateNewCategoryForm: (formData) => set(state => ({
    newCategoryForm: { ...state.newCategoryForm, ...formData }
  })),
  updateNewItemForm: (formData) => set(state => ({
    newItemForm: { ...state.newItemForm, ...formData }
  })),
  setItemImageFile: (file) => set({ itemImageFile: file }),
  
  // Preview management
  setPreviewUrl: (url) => set({ previewUrl: url }),
  
  // Reset
  resetForms: () => set({
    newCategoryForm: { title: '', position: 0 },
    newItemForm: { 
      title: '', 
      description: '', 
      price: 0, 
      image_url: '', 
      is_available: true, 
      position: 0 
    },
    itemImageFile: null,
    previewUrl: null
  }),
  
  resetStore: () => set({
    catalog: null,
    categories: [],
    loading: false,
    error: null,
    editingCategory: null,
    editingItem: null,
    selectedItem: null,
    newCategoryForm: { title: '', position: 0 },
    newItemForm: { 
      title: '', 
      description: '', 
      price: 0, 
      image_url: '', 
      is_available: true, 
      position: 0 
    },
    itemImageFile: null,
    previewUrl: null
  })
}));
