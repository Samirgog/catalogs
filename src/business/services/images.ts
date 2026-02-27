import { supabase } from "@/lib/supabase";

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to process image'));
    reader.readAsDataURL(file);
  });

export async function uploadImage(
  file: File,
  path: string
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from("catalogs-images")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      return fileToDataUrl(file);
    }
    void data;

    const { data: publicUrlData } = supabase.storage
      .from("catalogs-images")
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch {
    return fileToDataUrl(file);
  }
}
