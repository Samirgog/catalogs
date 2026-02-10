import useSWR from 'swr';
import { useState, useCallback, useEffect } from 'react';
import { uploadImage } from '../services/images';

// SWR fetcher for image operations
const imageFetcher = async (file: File, path: string): Promise<string> => {
  return await uploadImage(file, path);
};

/**
 * Hook for managing image uploads with SWR
 */
export const useImageUpload = () => {
  const { data: uploadedImageUrl, error, isValidating, mutate } = useSWR<string | null>(
    null, // No automatic fetching, only manual triggers
    null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const uploadImageMutation = async (file: File, customPath?: string): Promise<string> => {
    try {
      // Generate path if not provided
      const path = customPath || `${Date.now()}-${file.name}`;
      
      // Trigger upload via SWR mutate
      const imageUrl = await mutate(
        () => imageFetcher(file, path),
        {
          optimisticData: null,
          populateCache: true,
          revalidate: false,
        }
      );
      
      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }
      
      return imageUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Image upload failed';
      throw new Error(errorMessage);
    }
  };

  return {
    // State
    uploadedImageUrl,
    isLoading: isValidating,
    error: error ? (error instanceof Error ? error.message : 'Upload failed') : null,
    
    // Methods
    uploadImage: uploadImageMutation,
    
    // Utils
    clearUpload: () => mutate(null, { revalidate: false })
  };
};

/**
 * Hook for handling image previews from File objects
 */
export const useImagePreview = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = useCallback((file: File): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        const errorMsg = 'Please select an image file';
        setError(errorMsg);
        setIsLoading(false);
        reject(new Error(errorMsg));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        const errorMsg = 'File size should not exceed 5MB';
        setError(errorMsg);
        setIsLoading(false);
        reject(new Error(errorMsg));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        setIsLoading(false);
        resolve(result);
      };
      reader.onerror = () => {
        const errorMsg = 'Failed to read image file';
        setError(errorMsg);
        setIsLoading(false);
        reject(new Error(errorMsg));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      // Revoke object URL if it's a blob URL
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
    setError(null);
  }, [previewUrl]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    // State
    previewUrl,
    isLoading,
    error,
    
    // Methods
    generatePreview,
    clearPreview
  };
};