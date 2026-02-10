import { uploadImage } from '../../../services/images';

export class ImageHandlers {
  static async upload(file: File, categoryId: string, itemId?: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const safeFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const basePath = itemId ? `items/${categoryId}/${itemId}` : `items/${categoryId}`;
      const uploadPath = `${basePath}/${safeFileName}`;
      
      const imageUrl = await uploadImage(file, uploadPath);
      return imageUrl;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  static validateFile(file: File): { isValid: boolean; error?: string } {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Please select an image file' };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { isValid: false, error: 'File size should not exceed 5MB' };
    }

    return { isValid: true };
  }

  static sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}