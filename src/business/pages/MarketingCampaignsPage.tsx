import { useEffect, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useAutoBackButton } from '@/hooks/useTelegramNavigation';
import { CatalogItemPickerDrawer } from '../components/CatalogItemPickerDrawer';
import {
  campaignKindOptions,
  marketingService,
  segmentOptions,
} from '../services/marketing';
import type { MarketingCampaign, MarketingCampaignStatus, MarketingAudienceSegment, MarketingMessageKind } from '@/types';
import { toast } from 'sonner';

const statusLabel: Record<MarketingCampaignStatus, string> = {
  draft: 'Черновик',
  queued: 'В очереди',
  sending: 'Отправляется',
  sent: 'Отправлено',
  failed: 'Ошибка',
};

const buildDefaultCampaign = (catalogId: string) => ({
  catalog_id: catalogId,
  title: '',
  audience_segment: 'all' as MarketingAudienceSegment,
  message_kind: 'text' as MarketingMessageKind,
  message_title: '',
  message_text: '',
  cta_label: 'Открыть каталог',
  cta_url: '',
  promo_code: '',
  product_ids: [] as string[],
  scheduled_at: null,
  sent_at: null,
  status: 'draft' as MarketingCampaignStatus,
  created_by: null,
});

export function MarketingCampaignsPage() {
  const { catalogId = '' } = useParams<{ catalogId: string }>();
  useAutoBackButton(`/catalogs/${catalogId}/growth`);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [form, setForm] = useState(buildDefaultCampaign(catalogId));

  const load = async () => {
    setLoading(true);
    try {
      const data = await marketingService.listCampaigns(catalogId);
      setCampaigns(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить кампании');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [catalogId]);

  const handleSave = async (sendNow: boolean) => {
    if (!form.title.trim() || !form.message_text.trim()) {
      toast.error('Заполните заголовок и текст кампании');
      return;
    }

    try {
      setSaving(true);
      const campaign = await marketingService.createCampaign({
        ...form,
        catalog_id: catalogId,
        product_ids: form.product_ids,
        status: sendNow ? 'queued' : 'draft',
      });
      setForm(buildDefaultCampaign(catalogId));
      await load();

      if (sendNow) {
        setSendingId(campaign.id);
        await marketingService.sendCampaign(campaign.id);
        toast.success('Кампания отправлена');
      } else {
        toast.success('Кампания сохранена');
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить кампанию');
    } finally {
      setSaving(false);
      setSendingId(null);
    }
  };

  const totalRecipients = campaigns.reduce((sum, campaign) => sum + campaign.recipient_count, 0);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Рассылки</h1>
            <p className="text-sm text-muted-foreground">
              Сегменты, промо и повторные продажи через клиентского бота
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-xs text-muted-foreground">Кампаний</div>
              <div className="text-xl font-bold">{campaigns.length}</div>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-3">
              <div className="text-xs text-muted-foreground">Получателей</div>
              <div className="text-xl font-bold">{totalRecipients}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Новая рассылка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Название кампании"
            />
            <Select
              value={form.audience_segment}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, audience_segment: value as MarketingAudienceSegment }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Сегмент аудитории" />
              </SelectTrigger>
              <SelectContent>
                {segmentOptions.map((segment) => (
                  <SelectItem key={segment.value} value={segment.value}>
                    {segment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={form.message_kind}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, message_kind: value as MarketingMessageKind }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Тип сообщения" />
              </SelectTrigger>
              <SelectContent>
                {campaignKindOptions.map((kind) => (
                  <SelectItem key={kind.value} value={kind.value}>
                    {kind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={form.message_title || ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, message_title: event.target.value }))
              }
              placeholder="Заголовок сообщения"
            />
            <Textarea
              value={form.message_text}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, message_text: event.target.value }))
              }
              placeholder="Текст сообщения"
              rows={5}
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
              title="Выберите товары для подборки"
              buttonLabel={form.product_ids.length ? 'Изменить подборку товаров' : 'Выбрать товары для подборки'}
              selectedIds={form.product_ids}
              onChange={(ids) => setForm((prev) => ({ ...prev, product_ids: ids }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => void handleSave(false)} disabled={saving}>
                {saving && !sendingId ? 'Сохранение...' : 'Сохранить черновик'}
              </Button>
              <Button onClick={() => void handleSave(true)} disabled={saving}>
                <Send className="h-4 w-4 mr-2" />
                {sendingId ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>История кампаний</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && (
              <div className="flex justify-center py-8">
                <Spinner className="h-7 w-7" />
              </div>
            )}

            {!loading && campaigns.length === 0 && (
              <p className="text-sm text-muted-foreground">Пока кампаний нет.</p>
            )}

            {!loading &&
              campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-2xl border border-border/60 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{campaign.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {campaign.audience_segment} • {campaign.message_kind}
                      </div>
                    </div>
                    <div className="text-xs font-medium">{statusLabel[campaign.status]}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-secondary/50 p-2">
                      <div className="text-muted-foreground">Получатели</div>
                      <div className="font-semibold">{campaign.recipient_count}</div>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-2">
                      <div className="text-muted-foreground">Успешно</div>
                      <div className="font-semibold">{campaign.success_count}</div>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-2">
                      <div className="text-muted-foreground">Ошибки</div>
                      <div className="font-semibold">{campaign.failed_count}</div>
                    </div>
                  </div>
                  {campaign.message_text && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.message_text}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {campaign.status !== 'sent' && (
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await marketingService.sendCampaign(campaign.id);
                            await load();
                            toast.success('Кампания отправлена');
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : 'Не удалось отправить кампанию'
                            );
                          }
                        }}
                      >
                        Отправить сейчас
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
