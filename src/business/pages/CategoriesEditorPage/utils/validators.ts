export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FormValidator {
  static validateRequired(value: string, fieldName: string): void {
    if (!value || !value.trim()) {
      throw new ValidationError(`${fieldName} is required`);
    }
  }

  static validateMinLength(value: string, minLength: number, fieldName: string): void {
    if (value.trim().length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters`);
    }
  }

  static validatePrice(price: number): void {
    if (price < 0) {
      throw new ValidationError('Price cannot be negative');
    }
    if (!Number.isFinite(price)) {
      throw new ValidationError('Price must be a valid number');
    }
  }

  static validateCategoryForm(data: { title: string; position?: number }): void {
    this.validateRequired(data.title, 'Category title');
    this.validateMinLength(data.title, 1, 'Category title');
  }

  static validateItemForm(data: { 
    title: string; 
    price?: number; 
    description?: string;
    position?: number;
  }): void {
    this.validateRequired(data.title, 'Item title');
    this.validateMinLength(data.title, 1, 'Item title');
    if (data.price !== undefined) {
      this.validatePrice(data.price);
    }
  }
}