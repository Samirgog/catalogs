import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Edit, QrCode, Save, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { placesService } from '../services/places';
import { qrService } from '../services/qr';
import type { Place } from '@/types';
import { toast } from 'sonner';

let qrCodeModulePromise: Promise<typeof import('qrcode')> | null = null;

const loadQrCodeModule = () => {
  if (!qrCodeModulePromise) {
    qrCodeModulePromise = import('qrcode');
  }
  return qrCodeModulePromise;
};

type FormState = {
  name: string;
  address: string;
  type: 'foodcourt';
};

const initialForm: FormState = {
  name: '',
  address: '',
  type: 'foodcourt',
};

export function PlacesPage() {
  const navigate = useNavigate();
  useAutoBackButton('/catalogs');

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const clientBotUsername = (
    import.meta.env.VITE_CLIENT_BOT_USERNAME || 'v_click_bot'
  ).replace('@', '');
  const clientBotAppShortName =
    import.meta.env.VITE_CLIENT_BOT_APP_SHORT_NAME || 'vclickapp';

  const buildPlaceLink = (placeId: string) => {
    const payload = `place_${placeId}`;
    if (clientBotAppShortName) {
      return `https://t.me/${clientBotUsername}/${clientBotAppShortName}?startapp=${encodeURIComponent(payload)}`;
    }
    return `https://t.me/${clientBotUsername}?startapp=${encodeURIComponent(payload)}`;
  };

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const data = await placesService.listAll();
      setPlaces(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить пространства');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlaces();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingPlaceId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      toast.error('Заполните название и адрес');
      return;
    }

    try {
      setSaving(true);
      if (editingPlaceId) {
        const updated = await placesService.update(editingPlaceId, {
          name: form.name.trim(),
          address: form.address.trim(),
          type: form.type,
        });
        setPlaces((prev) => prev.map((place) => (place.id === updated.id ? updated : place)));
        toast.success('Пространство обновлено');
      } else {
        const created = await placesService.create({
          name: form.name.trim(),
          address: form.address.trim(),
          type: form.type,
        });
        setPlaces((prev) => [created, ...prev]);
        toast.success('Пространство создано');
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить пространство');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (place: Place) => {
    setEditingPlaceId(place.id);
    setForm({
      name: place.name,
      address: place.address || '',
      type: place.type === 'foodcourt' ? 'foodcourt' : 'foodcourt',
    });
  };

  const ensurePlaceQrLink = async (placeId: string) => {
    const existing = await qrService.getByPlaceId(placeId);
    const persisted = existing.find((link) => link.slug === `place_${placeId}`) || existing[0];
    if (persisted) return persisted;
    return qrService.generateForPlace(placeId, `place_${placeId}`);
  };

  const handleCopyLink = async (placeId: string) => {
    try {
      const link = buildPlaceLink(placeId);
      await navigator.clipboard.writeText(link);
      toast.success('Ссылка скопирована');
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const handleShare = async (placeId: string, placeName: string) => {
    const link = buildPlaceLink(placeId);
    try {
      if (navigator.share) {
        await navigator.share({
          title: placeName,
          text: `Открыть пространство «${placeName}»`,
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
      }
      toast.success('Ссылка готова');
    } catch {
      toast.error('Не удалось поделиться ссылкой');
    }
  };

  const handleDownloadQr = async (place: Place) => {
    try {
      await ensurePlaceQrLink(place.id);
      const qrCode = await loadQrCodeModule();
      const dataUrl = await qrCode.toDataURL(buildPlaceLink(place.id), {
        width: 512,
        margin: 2,
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `place-${place.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      toast.success('QR-код скачан');
    } catch {
      toast.error('Не удалось подготовить QR-код');
    }
  };

  const title = useMemo(
    () => (editingPlaceId ? 'Редактирование пространства' : 'Новое пространство'),
    [editingPlaceId]
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Пространства</h1>
            <p className="text-sm text-muted-foreground">
              Управление фудкортами и ссылками на них
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="place-name">Название</Label>
              <Input
                id="place-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Например, Фудкорт Центральный"
              />
            </div>
            <div>
              <Label htmlFor="place-address">Адрес</Label>
              <Input
                id="place-address"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Город, улица, дом"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Сохраняем...' : editingPlaceId ? 'Сохранить' : 'Создать'}
              </Button>
              {editingPlaceId && (
                <Button variant="outline" onClick={resetForm}>
                  Отмена
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="glass-card p-4 flex items-center justify-center gap-2">
            <Spinner />
            <span>Загрузка...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {places.map((place) => (
              <Card key={place.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{place.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {place.address || 'Адрес не указан'}
                      </p>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(place)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="glass-card rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">Ссылка</p>
                    <p className="text-sm break-all mt-1">{buildPlaceLink(place.id)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" onClick={() => handleCopyLink(place.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Скопировать
                    </Button>
                    <Button variant="outline" onClick={() => handleShare(place.id, place.name)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Поделиться
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadQr(place)}>
                      <QrCode className="w-4 h-4 mr-2" />
                      QR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-4 right-4">
        <Button className="w-full h-12" onClick={() => navigate('/catalogs')}>
          Назад к каталогам
        </Button>
      </div>
    </div>
  );
}
