import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { 
  ArrowLeft, 
  Plus, 
  Image, 
  Trash2, 
  Pencil, 
  Copy, 
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Catalog, Category, Item, CategoryFormData, ItemFormData } from '../../types';

// Sample data for demonstration
const sampleCatalog: Catalog = {
  id: 'catalog-1',
  title: 'Main Menu',
  is_active: true,
  created_at: new Date().toISOString(),
  categories: [
    {
      id: 'cat-1',
      title: 'Coffee',
      position: 1,
      items: [
        {
          id: 'item-1',
          title: 'Espresso',
          description: 'Strong black coffee',
          price: 150,
          image_url: 'https://images.unsplash.com/photo-1521305916504-4a1121188589',
          is_available: true,
          position: 1
        },
        {
          id: 'item-2',
          title: 'Cappuccino',
          description: 'Espresso with steamed milk foam',
          price: 200,
          image_url: 'https://images.unsplash.com/photo-1521305916504-4a1121188589',
          is_available: true,
          position: 2
        }
      ]
    },
    {
      id: 'cat-2',
      title: 'Desserts',
      position: 2,
      items: [
        {
          id: 'item-3',
          title: 'Cheesecake',
          description: 'Creamy cheese dessert',
          price: 280,
          image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b',
          is_available: true,
          position: 1
        }
      ]
    }
  ]
};

export function CategoriesEditorPage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<Catalog>(sampleCatalog);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<{category: Category, item: Item} | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newItemForm, setNewItemForm] = useState<ItemFormData>({
    title: '',
    description: '',
    price: 0,
    image_url: '',
    is_available: true,
    position: 0
  });
  const [newCategoryForm, setNewCategoryForm] = useState<CategoryFormData>({
    title: '',
    position: 0
  });

  const handleBack = () => {
    navigate(-1);
  };

  const handleItemSubmit = () => {
    if (editingItem && editingCategory) {
      // Update existing item
      const updatedCategories = catalog.categories?.map(cat => {
        if (cat.id === editingCategory.id) {
          const updatedItems = cat.items?.map(item => 
            item.id === editingItem.id ? { ...editingItem, ...newItemForm } : item
          ) || [];
          
          return {
            ...cat,
            items: updatedItems
          };
        }
        return cat;
      }) || [];
      
      setCatalog({
        ...catalog,
        categories: updatedCategories
      });
    } else if (editingCategory) {
      // Add new item to category
      const newItem: Item = {
        id: `item-${Date.now()}`,
        ...newItemForm
      };
      
      const updatedCategories = catalog.categories?.map(cat => {
        if (cat.id === editingCategory.id) {
          return {
            ...cat,
            items: [...(cat.items || []), newItem]
          };
        }
        return cat;
      }) || [];
      
      setCatalog({
        ...catalog,
        categories: updatedCategories
      });
    }
    
    setEditingItem(null);
    setNewItemForm({ title: '', description: '', price: 0, image_url: '', is_available: true, position: 0 });
  };

  const handleCategorySubmit = () => {
    if (editingCategory) {
      // Update existing category
      const updatedCategories = catalog.categories?.map(cat => 
        cat.id === editingCategory.id ? { ...cat, ...newCategoryForm } : cat
      ) || [];
      
      setCatalog({
        ...catalog,
        categories: updatedCategories
      });
    } else {
      // Add new category
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        ...newCategoryForm,
        items: []
      };
      
      setCatalog({
        ...catalog,
        categories: [...(catalog.categories || []), newCategory]
      });
    }
    
    setEditingCategory(null);
    setNewCategoryForm({ title: '', position: 0 });
  };

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

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    const updatedCategories = catalog.categories?.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items?.filter(item => item.id !== itemId)
        };
      }
      return cat;
    }) || [];
    
    setCatalog({
      ...catalog,
      categories: updatedCategories
    });
  };

  const handleDuplicateItem = (categoryId: string, item: Item) => {
    const updatedCategories = catalog.categories?.map(cat => {
      if (cat.id === categoryId) {
        const duplicatedItem: Item = {
          ...item,
          id: `item-${Date.now()}`,
          title: `${item.title} (копия)`
        };
        return {
          ...cat,
          items: [...(cat.items || []), duplicatedItem]
        };
      }
      return cat;
    }) || [];
    
    setCatalog({
      ...catalog,
      categories: updatedCategories
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updatedCategories = catalog.categories?.filter(cat => cat.id !== categoryId) || [];
    
    setCatalog({
      ...catalog,
      categories: updatedCategories
    });
  };

  const handleItemMouseDown = (category: Category, item: Item) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedItem({category, item});
    }, 500); // 500ms long press
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
    // Clear any pending long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Open item actions drawer
    setSelectedItem({category, item});
  };

  // Render item card similar to the final catalog
  const renderItemCard = (category: Category, item: Item) => {
    return (
      <div 
        key={item.id}
        className="relative"
        onMouseDown={() => handleItemMouseDown(category, item)}
        onMouseUp={handleItemMouseUp}
        onMouseLeave={handleItemMouseUp}
        onTouchStart={() => handleItemTouchStart(category, item)}
        onTouchEnd={handleItemTouchEnd}
        onClick={() => handleItemCardClick(category, item)}
      >
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex gap-4 p-3">
            {item.image_url ? (
              <img
                src={item.image_url}
                className="h-20 w-20 rounded-md object-cover"
                alt={item.title}
              />
            ) : (
              <div className="h-20 w-20 rounded-md bg-gray-200 flex items-center justify-center">
                <Image className="h-6 w-6 text-gray-400" />
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
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-background sticky top-0 z-20">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2 flex-1">Редактор каталога</h1>
        </div>
      </div>

      {/* Main Content - Live Preview */}
      <div className="p-4 pb-32 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Add Category Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Добавить новую категорию</h2>
          <div className="flex gap-2">
            <Input
              value={newCategoryForm.title}
              onChange={(e) => setNewCategoryForm({...newCategoryForm, title: e.target.value})}
              placeholder="Название категории"
              className="flex-1"
            />
            <Button onClick={handleCategorySubmit}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>
        </div>

        {/* Live Preview of Categories and Items */}
        <div className="space-y-8">
          {catalog.categories?.map((category) => (
            <section key={category.id} className="scroll-mt-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{category.title}</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setEditingCategory(category);
                      setNewCategoryForm({
                        title: category.title,
                        position: category.position || 0
                      });
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Редактировать
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
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
                  onClick={() => {
                    setEditingCategory(category);
                    setEditingItem(null);
                    setNewItemForm({ 
                      title: '', 
                      description: '', 
                      price: 0, 
                      image_url: '', 
                      is_available: true, 
                      position: (category.items?.length || 0) + 1 
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить товар
                </Button>
              </div>
              
              {/* Items Grid */}
              <div className="grid gap-3">
                {(category.items || []).map((item) => renderItemCard(category, item))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Category Editor Drawer */}
      <Drawer open={!!editingCategory && !editingItem} onClose={() => setEditingCategory(null)}>
        <DrawerContent className="p-4">
          <DrawerHeader>
            <DrawerTitle>
              {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category-title">Название</Label>
              <Input
                id="category-title"
                value={newCategoryForm.title}
                onChange={(e) => setNewCategoryForm({...newCategoryForm, title: e.target.value})}
                placeholder="Введите название категории"
              />
            </div>
            <div>
              <Label htmlFor="category-position">Позиция</Label>
              <Input
                id="category-position"
                type="number"
                value={newCategoryForm.position}
                onChange={(e) => setNewCategoryForm({...newCategoryForm, position: parseInt(e.target.value) || 0})}
                placeholder="Позиция в списке"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={handleCategorySubmit}
            >
              Сохранить
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setEditingCategory(null)}
            >
              Отмена
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Item Editor Drawer */}
      <Drawer open={!!editingItem} onClose={() => setEditingItem(null)}>
        <DrawerContent className="p-4">
          <DrawerHeader>
            <DrawerTitle>
              {editingItem ? 'Редактировать товар' : 'Создать товар'}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="item-title">Название</Label>
              <Input
                id="item-title"
                value={newItemForm.title}
                onChange={(e) => setNewItemForm({...newItemForm, title: e.target.value})}
                placeholder="Введите название товара"
              />
            </div>
            <div>
              <Label htmlFor="item-description">Описание</Label>
              <Textarea
                id="item-description"
                value={newItemForm.description}
                onChange={(e) => setNewItemForm({...newItemForm, description: e.target.value})}
                placeholder="Введите описание товара"
              />
            </div>
            <div>
              <Label htmlFor="item-price">Цена</Label>
              <Input
                id="item-price"
                type="number"
                value={newItemForm.price}
                onChange={(e) => setNewItemForm({...newItemForm, price: parseFloat(e.target.value) || 0})}
                placeholder="Цена товара"
              />
            </div>
            <div>
              <Label htmlFor="item-image">URL изображения</Label>
              <div className="flex gap-2">
                <Input
                  id="item-image"
                  value={newItemForm.image_url}
                  onChange={(e) => setNewItemForm({...newItemForm, image_url: e.target.value})}
                  placeholder="URL изображения товара"
                />
                <Button type="button" variant="outline">
                  <Image className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="item-available">Доступен</Label>
              <Switch
                id="item-available"
                checked={newItemForm.is_available}
                onCheckedChange={(checked) => setNewItemForm({...newItemForm, is_available: checked})}
              />
            </div>
            <div>
              <Label htmlFor="item-position">Позиция</Label>
              <Input
                id="item-position"
                type="number"
                value={newItemForm.position}
                onChange={(e) => setNewItemForm({...newItemForm, position: parseInt(e.target.value) || 0})}
                placeholder="Позиция в списке"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={handleItemSubmit}
            >
              Сохранить
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setEditingItem(null)}
            >
              Отмена
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Item Actions Drawer */}
      <Drawer open={!!selectedItem} onClose={handleCloseItemActions}>
        <DrawerContent className="p-4">
          <DrawerHeader>
            <DrawerTitle>Действия с товаром</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="py-4">
            <div className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start py-3 text-left"
                onClick={() => {
                  if (selectedItem) {
                    handleEditItem(selectedItem.category, selectedItem.item);
                    handleCloseItemActions();
                  }
                }}
              >
                <Pencil className="h-5 w-5 mr-3" />
                Редактировать
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start py-3 text-left"
                onClick={() => {
                  if (selectedItem) {
                    handleDuplicateItem(selectedItem.category.id, selectedItem.item);
                    handleCloseItemActions();
                  }
                }}
              >
                <Copy className="h-5 w-5 mr-3" />
                Дублировать
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start py-3 text-left text-red-500 hover:text-red-700"
                onClick={() => {
                  if (selectedItem) {
                    handleDeleteItem(selectedItem.category.id, selectedItem.item.id);
                    handleCloseItemActions();
                  }
                }}
              >
                <Trash2 className="h-5 w-5 mr-3" />
                Удалить
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Save Button */}
      <div className="fixed bottom-6 left-4 right-4 px-4">
        <Button 
          className="w-full h-14 text-lg" 
          onClick={() => navigate('/catalogs')}
        >
          Сохранить изменения
        </Button>
      </div>
    </div>
  );
}