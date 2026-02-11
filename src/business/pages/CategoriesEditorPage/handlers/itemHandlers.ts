import { uploadImage } from '../../../services/images';
import type { ItemFormData } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';

interface ItemHandlersProps {
  getItemHook: (categoryId: string) => {
    createItem: (data: ItemFormData) => Promise<any>;
    updateItem: (id: string, data: Partial<ItemFormData>) => Promise<any>;
    deleteItem: (id: string) => Promise<void>;
  };
}

export class ItemHandlers {
  private props: ItemHandlersProps;

  constructor(props: ItemHandlersProps) {
    this.props = props;
  }

  async create(categoryId: string, data: ItemFormData, imageFile?: File | null) {
    if (!data.title.trim()) {
      throw new Error('Item title is required');
    }

    try {
      let imageUrl = data.image_url || '';

      // Handle image upload if file is provided
      if (imageFile) {
        const timestamp = Date.now();
        const safeFileName = `${timestamp}-${uuidv4()}`;
        const uploadPath = `items/${categoryId}/${safeFileName}`;
        
        imageUrl = await uploadImage(imageFile, uploadPath);
      }

      const itemData: ItemFormData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        price: data.price ?? 0,
        image_url: imageUrl,
        is_available: data.is_available ?? true,
        position: data.position || 0
      };

      const itemHook = this.props.getItemHook(categoryId);
      if (!itemHook) {
        throw new Error(`No item hook found for category ${categoryId}`);
      }

      const result = await itemHook.createItem(itemData);
      return result;
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  }

  async update(itemId: string, categoryId: string, data: Partial<ItemFormData>, imageFile?: File | null) {
    if (data.title && !data.title.trim()) {
      throw new Error('Item title cannot be empty');
    }

    try {
      let imageUrl = data.image_url;

      // Handle image upload if file is provided
      if (imageFile) {
        const timestamp = Date.now();
        const safeFileName = `${timestamp}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const uploadPath = `items/${categoryId}/${safeFileName}`;
        
        imageUrl = await uploadImage(imageFile, uploadPath);
      }

      const itemData: Partial<ItemFormData> = {
        title: data.title?.trim(),
        description: data.description?.trim(),
        price: data.price,
        image_url: imageUrl,
        is_available: data.is_available,
        position: data.position
      };

      // Remove undefined values
      Object.keys(itemData).forEach(key => {
        if (itemData[key as keyof Partial<ItemFormData>] === undefined) {
          delete itemData[key as keyof Partial<ItemFormData>];
        }
      });

      const itemHook = this.props.getItemHook(categoryId);
      if (!itemHook) {
        throw new Error(`No item hook found for category ${categoryId}`);
      }

      const result = await itemHook.updateItem(itemId, itemData);
      return result;
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    }
  }

  async delete(itemId: string, categoryId: string) {
    try {
      const itemHook = this.props.getItemHook(categoryId);
      if (!itemHook) {
        throw new Error(`No item hook found for category ${categoryId}`);
      }

      await itemHook.deleteItem(itemId);
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  }

  async duplicate(originalItem: any, categoryId: string, allCategories: any[]) {
    try {
      const itemHook = this.props.getItemHook(categoryId);
      if (!itemHook) {
        throw new Error(`No item hook found for category ${categoryId}`);
      }

      const category = allCategories.find(cat => cat.id === categoryId);
      const newPosition = (category?.items?.length || 0) + 1;

      const duplicatedItem: ItemFormData = {
        title: `${originalItem.title} (Copy)`,
        description: originalItem.description || '',
        price: originalItem.price ?? 0,
        image_url: originalItem.image_url || '',
        is_available: originalItem.is_available ?? true,
        position: newPosition
      };

      const result = await itemHook.createItem(duplicatedItem);
      return result;
    } catch (error) {
      console.error('Failed to duplicate item:', error);
      throw error;
    }
  }
}