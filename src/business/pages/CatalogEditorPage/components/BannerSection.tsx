import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';

type Props = {
  bannerUrl: string;
  previewUrl: string | null;
  onRemove: () => void;
  onTriggerUpload: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

export function BannerSection({
  bannerUrl,
  previewUrl,
  onRemove,
  onTriggerUpload,
  onFileChange,
  fileInputRef,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Баннер каталога</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bannerUrl || previewUrl ? (
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={bannerUrl || previewUrl || ''}
                alt="Предпросмотр баннера"
                className="w-full h-48 object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-3 right-3 h-9 w-9 backdrop-blur-sm"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer bg-secondary/30"
              onClick={onTriggerUpload}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-foreground">Нажмите для загрузки баннера</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF до 5MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />

          {(bannerUrl || previewUrl) && (
            <Button type="button" variant="outline" className="w-full" onClick={onTriggerUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Заменить изображение
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
