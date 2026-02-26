export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FormValidator {
  static validateRequired(value: string, fieldName: string): void {
    if (!value || !value.trim()) {
      throw new ValidationError(`Поле «${fieldName}» обязательно`);
    }
  }

  static validateMinLength(value: string, minLength: number, fieldName: string): void {
    if (value.trim().length < minLength) {
      throw new ValidationError(`Поле «${fieldName}» должно быть не короче ${minLength} символов`);
    }
  }

  static validatePrice(price: number): void {
    if (price < 0) {
      throw new ValidationError('Цена не может быть отрицательной');
    }
    if (!Number.isFinite(price)) {
      throw new ValidationError('Цена должна быть числом');
    }
  }

  static validateCategoryForm(data: { title: string; position?: number }): void {
    this.validateRequired(data.title, 'Название категории');
    this.validateMinLength(data.title, 1, 'Название категории');
  }

  static validateItemForm(data: { 
    title: string; 
    price?: number; 
    description?: string;
    position?: number;
  }): void {
    this.validateRequired(data.title, 'Название товара');
    this.validateMinLength(data.title, 1, 'Название товара');
    if (data.price !== undefined) {
      this.validatePrice(data.price);
    }
  }
}
