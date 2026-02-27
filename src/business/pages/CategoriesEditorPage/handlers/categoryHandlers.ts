import type { Category, CategoryFormData } from '../../../../types';

interface CategoryHandlersProps {
  createCategory: (data: CategoryFormData) => Promise<Category>;
  updateCategory: (id: string, data: Partial<CategoryFormData>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

export class CategoryHandlers {
  private props: CategoryHandlersProps;

  constructor(props: CategoryHandlersProps) {
    this.props = props;
  }

  async create(data: CategoryFormData) {
    if (!data.title.trim()) {
      throw new Error('Category title is required');
    }

    try {
      const categoryData: CategoryFormData = {
        title: data.title.trim(),
        position: data.position || 0
      };

      const result = await this.props.createCategory(categoryData);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async update(categoryId: string, data: Partial<CategoryFormData>) {
    if (data.title && !data.title.trim()) {
      throw new Error('Category title cannot be empty');
    }

    try {
      const categoryData: Partial<CategoryFormData> = {
        title: data.title?.trim(),
        position: data.position
      };

      // Remove undefined values
      Object.keys(categoryData).forEach(key => {
        if (categoryData[key as keyof Partial<CategoryFormData>] === undefined) {
          delete categoryData[key as keyof Partial<CategoryFormData>];
        }
      });

      const result = await this.props.updateCategory(categoryId, categoryData);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async delete(categoryId: string) {
    try {
      await this.props.deleteCategory(categoryId);
    } catch (error) {
      throw error;
    }
  }
}
