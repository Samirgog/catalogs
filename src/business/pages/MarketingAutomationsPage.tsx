import { useEffect, useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { CatalogItemPickerDrawer } from '../components/CatalogItemPickerDrawer';
import {
  automationTriggerOptions,
  marketingService,
  segmentOptions,
} from '../services/marketing';
import type { MarketingAutomation, MarketingAutomationTrigger, MarketingAudienceSegment } from '@/types';
import { toast } from 'sonner';

const buildDefaultAutomation = (catalogId: string) => ({
  catalog_id: catalogId,
  title: '',
  trigger_key: 'after_first_order' as MarketingAutomationTrigger,
  is_enabled: true,
  cooldown_hours: 24,
  delay_minutes: 0,
  audience_segment: 'all' as MarketingAudienceSegment,
  message_title: '',
  message_text: '',
  cta_label: 'Открыть каталог',
  cta_url: '',
  promo_code: '',
  product_ids: [] as string[],
  settings: {},
  created_by: null,
});

export function MarketingAutomationsPage() {
  const { catalogId = '' } = useParams<{ catalogId: string }>();
  useAutoBackButton(`/catalogs/${catalogId}/growth`);
  const [automations, setAutomations] = useState<MarketingAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [form, setForm] = useState(buildDefaultAutomation(catalogId));

  const load = async () => {
    setLoading(true);
    try {
      const data = await marketingService.listAutomations(catalogId);
      setAutomations(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить автоматизации');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [catalogId]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.message_text.trim()) {
      toast.error('Заполните название и текст сценария');
      return;
    }

    try {
      setSaving(true);
      await marketingService.createAutomation({
        ...form,
        catalog_id: catalogId,
      });
      setForm(buildDefaultAutomation(catalogId));
      await load();
      toast.success('Автоматизация создана');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить сценарий');
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    try {
      setRunning(true);
      const result = await marketingService.runAutomations(catalogId);
      toast.success(`Проверка завершена: ${result.sent} отправлено, ${result.skipped} пропущено`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось запустить проверку');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Автоматизации</h1>
            <p className="text-sm text-muted-foreground">
              Напоминания, возврат клиентов, VIP и допродажи по событиям
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Запустить проверку сейчас</div>
              <div className="text-sm text-muted-foreground">
                Просканировать активные сценарии и отправить подходящие сообщения
              </div>
            </div>
            <Button onClick={() => void handleRunNow()} disabled={running}>
              {running ? 'Проверяем...' : 'Запустить'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Новый сценарий</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Название сценария"
            />
            <Select
              value={form.trigger_key}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, trigger_key: value as MarketingAutomationTrigger }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Триггер" />
              </SelectTrigger>
              <SelectContent>
                {automationTriggerOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={form.audience_segment}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, audience_segment: value as MarketingAudienceSegment }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Сегмент" />
              </SelectTrigger>
              <SelectContent>
                {segmentOptions.map((segment) => (
                  <SelectItem key={segment.value} value={segment.value}>
                    {segment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                value={String(form.cooldown_hours)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cooldown_hours: Number(event.target.value || 0) }))
                }
                placeholder="Cooldown, часов"
              />
              <Input
                type="number"
                value={String(form.delay_minutes)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, delay_minutes: Number(event.target.value || 0) }))
                }
                placeholder="Задержка, минут"
              />
            </div>
            <Input
              value={form.message_title || ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, message_title: event.target.value }))
              }
              placeholder="Заголовок"
            />
            <Textarea
              value={form.message_text}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, message_text: event.target.value }))
              }
              rows={5}
              placeholder="Текст сценария"
            />
            <Input
              value={form.cta_label || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, cta_label: event.target.value }))}
              placeholder="Текст кнопки"
            />
            <Input
              value={form.cta_url || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, cta_url: event.target.value }))}
              placeholder="Ссылка кнопки"
            />
            <Input
              value={form.promo_code || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, promo_code: event.target.value }))}
              placeholder="Промокод"
            />
            <CatalogItemPickerDrawer
              catalogId={catalogId}
              title="Выберите товары для сценария"
              buttonLabel={form.product_ids.length ? 'Изменить товары сценария' : 'Выбрать товары для сценария'}
              selectedIds={form.product_ids}
              onChange={(ids) => setForm((prev) => ({ ...prev, product_ids: ids }))}
            />
            <Button className="w-full" onClick={() => void handleCreate()} disabled={saving}>
              <Sparkles className="h-4 w-4 mr-2" />
              {saving ? 'Сохранение...' : 'Создать сценарий'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Активные сценарии</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && (
              <div className="flex justify-center py-8">
                <Spinner className="h-7 w-7" />
              </div>
            )}

            {!loading && automations.length === 0 && (
              <p className="text-sm text-muted-foreground">Пока сценариев нет.</p>
            )}

            {!loading &&
              automations.map((automation) => (
                <div key={automation.id} className="rounded-2xl border border-border/60 p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{automation.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {automation.trigger_key} • {automation.audience_segment}
                      </div>
                    </div>
                    <Switch
                      checked={automation.is_enabled}
                      onCheckedChange={async (value) => {
                        try {
                          await marketingService.toggleAutomation(automation.id, value);
                          await load();
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : 'Не удалось обновить сценарий'
                          );
                        }
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {automation.message_text}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-secondary/50 p-2">
                      <div className="text-muted-foreground">Cooldown</div>
                      <div className="font-semibold">{automation.cooldown_hours} ч.</div>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-2">
                      <div className="text-muted-foreground">Задержка</div>
                      <div className="font-semibold">{automation.delay_minutes} мин.</div>
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
