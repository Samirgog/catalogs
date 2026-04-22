import { businessSupabase } from '@/lib/supabase';
import { fetchWithRetry } from '@/lib/http';
import { getTelegramWebApp } from '@/lib/telegram';
import type {
  MarketingAutomation,
  MarketingAutomationTrigger,
  MarketingAudienceSegment,
  MarketingCampaign,
  MarketingCampaignStatus,
  MarketingMessageKind,
} from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const getFunctionUrl = (name: string) => {
  if (!SUPABASE_URL) {
    throw new Error('Не настроен VITE_SUPABASE_URL');
  }
  return `${SUPABASE_URL}/functions/v1/${name}`;
};

const getInitData = () => {
  const initData = getTelegramWebApp()?.initData || '';
  if (!initData) {
    throw new Error('Не найден Telegram initData');
  }
  return initData;
};

const getCurrentTelegramId = () => {
  const user = getTelegramWebApp()?.initDataUnsafe?.user;
  return user?.id ? String(user.id) : null;
};

export const segmentOptions: Array<{
  value: MarketingAudienceSegment;
  label: string;
  description: string;
}> = [
  { value: 'all', label: 'Все клиенты', description: 'Полная база покупателей' },
  { value: 'new_today', label: 'Новые сегодня', description: 'Первый визит сегодня' },
  { value: 'new_week', label: 'Новые за неделю', description: 'Недавние клиенты' },
  { value: 'vip', label: 'VIP', description: 'Клиенты с высоким чеком или тегом VIP' },
  { value: 'lost_7_days', label: 'Без заказа 7 дней', description: 'Нужно мягко вернуть' },
  { value: 'lost_30_days', label: 'Без заказа 30 дней', description: 'Давно не покупали' },
  { value: 'abandoned_cart', label: 'Брошенная корзина', description: 'Оставили товары и ушли' },
  { value: 'one_order', label: 'Один заказ', description: 'Первая покупка' },
  { value: 'many_orders', label: 'Много заказов', description: 'Постоянные покупатели' },
  { value: 'high_avg_check', label: 'Высокий средний чек', description: 'Покупают на крупные суммы' },
  { value: 'source_qr_code', label: 'Пришли по QR', description: 'Трафик из QR-кода' },
  { value: 'source_direct_link', label: 'Прямая ссылка', description: 'Переход по ссылке' },
  { value: 'source_repeat_visit', label: 'Повторный заход', description: 'Вернулись в каталог' },
  { value: 'source_instagram', label: 'Instagram', description: 'Источник instagram' },
  { value: 'source_ads', label: 'Реклама', description: 'Платный трафик' },
  { value: 'burger_lovers', label: 'Любят бургеры', description: 'Покупали товары с бургером' },
];

export const automationTriggerOptions: Array<{
  value: MarketingAutomationTrigger;
  label: string;
  description: string;
}> = [
  { value: 'after_first_order', label: 'После первого заказа', description: 'Спасибо и скидка на повтор' },
  { value: 'no_order_7_days', label: 'Нет заказа 7 дней', description: 'Напомнить о себе' },
  { value: 'no_order_30_days', label: 'Нет заказа 30 дней', description: 'Вернуть клиента' },
  { value: 'abandoned_cart', label: 'Брошенная корзина', description: 'Вернуть к оформлению' },
  { value: 'birthday', label: 'День рождения', description: 'Подарок и поздравление' },
  { value: 'burger_lovers', label: 'Покупал бургер', description: 'Предложить напиток' },
  { value: 'vip_offer', label: 'Частый клиент', description: 'VIP-предложение' },
];

export const campaignKindOptions: Array<{
  value: MarketingMessageKind;
  label: string;
}> = [
  { value: 'text', label: 'Текст' },
  { value: 'button_to_catalog', label: 'Кнопка в каталог' },
  { value: 'promo_code', label: 'Промокод' },
  { value: 'offer', label: 'Акция' },
  { value: 'product_selection', label: 'Подборка товаров' },
];

const toCampaignStatus = (value?: string | null): MarketingCampaignStatus =>
  value === 'queued' || value === 'sending' || value === 'sent' || value === 'failed'
    ? value
    : 'draft';

export const marketingService = {
  async listCampaigns(catalogId: string): Promise<MarketingCampaign[]> {
    const { data, error } = await businessSupabase
      .from('marketing_campaigns')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data || []) as MarketingCampaign[]).map((campaign) => ({
      ...campaign,
      status: toCampaignStatus(campaign.status),
    }));
  },

  async createCampaign(
    input: Omit<
      MarketingCampaign,
      'id' | 'recipient_count' | 'success_count' | 'failed_count' | 'created_at' | 'updated_at'
    > & {
      status?: MarketingCampaignStatus;
    }
  ) {
    const { data, error } = await businessSupabase
      .from('marketing_campaigns')
      .insert({
        ...input,
        product_ids: input.product_ids || [],
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as MarketingCampaign;
  },

  async updateCampaign(id: string, patch: Partial<MarketingCampaign>) {
    const { data, error } = await businessSupabase
      .from('marketing_campaigns')
      .update({
        ...patch,
        product_ids: patch.product_ids || undefined,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as MarketingCampaign;
  },

  async sendCampaign(campaignId: string) {
    const response = await fetchWithRetry(getFunctionUrl('marketing-campaign-dispatch'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        initData: getInitData(),
      }),
      timeoutMs: 30000,
      retries: 1,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (await response.json()) as { success: true; recipient_count: number };
  },

  async listAutomations(catalogId: string): Promise<MarketingAutomation[]> {
    const { data, error } = await businessSupabase
      .from('marketing_automations')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as MarketingAutomation[];
  },

  async createAutomation(
    input: Omit<MarketingAutomation, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await businessSupabase
      .from('marketing_automations')
      .insert({
        ...input,
        product_ids: input.product_ids || [],
        settings: input.settings || {},
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as MarketingAutomation;
  },

  async updateAutomation(id: string, patch: Partial<MarketingAutomation>) {
    const { data, error } = await businessSupabase
      .from('marketing_automations')
      .update({
        ...patch,
        product_ids: patch.product_ids || undefined,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as MarketingAutomation;
  },

  async toggleAutomation(id: string, isEnabled: boolean) {
    const { data, error } = await businessSupabase
      .from('marketing_automations')
      .update({ is_enabled: isEnabled })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as MarketingAutomation;
  },

  async runAutomations(catalogId: string) {
    const response = await fetchWithRetry(getFunctionUrl('marketing-automation-runner'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogId,
        initData: getInitData(),
      }),
      timeoutMs: 30000,
      retries: 1,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (await response.json()) as {
      processed: number;
      sent: number;
      skipped: number;
    };
  },

  getCurrentTelegramId,
};
