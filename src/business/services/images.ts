import { supabase } from "@/lib/supabase";

export async function uploadImage(
  file: File,
  path: string
): Promise<string> {
  try {
    console.log('Uploading image to Supabase:', { fileName: file.name, fileType: file.type, path });
    
    // First, try to upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("catalogs-images")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.warn('Supabase storage upload failed, falling back to base64:', error.message);
      
      // Fallback: Convert to base64 data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Url = reader.result as string;
          console.log('Using base64 fallback for image');
          resolve(base64Url);
        };
        reader.onerror = () => {
          reject(new Error('Failed to convert image to base64'));
        };
        reader.readAsDataURL(file);
      });
    }
    
    console.log('Upload successful, data:', data);

    const { data: publicUrlData } = supabase.storage
      .from("catalogs-images")
      .getPublicUrl(path);
    
    console.log('Generated public URL:', publicUrlData.publicUrl);
    console.log('URL type:', typeof publicUrlData.publicUrl);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    
    // Final fallback: base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        console.log('Using base64 fallback after error');
        resolve(base64Url);
      };
      reader.onerror = () => {
        reject(new Error('Failed to process image'));
      };
      reader.readAsDataURL(file);
    });
  }
}
