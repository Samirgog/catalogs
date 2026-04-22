import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { requireMarketingAccess } from '../_shared/marketingAuth.ts';
import {
  buildAutomationMessage,
  buildRecipientList,
  sendToRecipient,
  supabaseService,
} from '../_shared/marketing.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DAY_MS = 24 * 60 * 60 * 1000;

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    await requireMarketingAccess(body as Record<string, unknown>);

    const catalogId = String(body.catalogId || '');
    const automationQuery = supabaseService
      .from('marketing_automations')
      .select('*')
      .eq('is_enabled', true)
      .order('created_at', { ascending: true });

    const { data: automations, error } = catalogId
      ? await automationQuery.eq('catalog_id', catalogId)
      : await automationQuery;

    if (error) {
      throw error;
    }

    let processed = 0;
    let sent = 0;
    let skipped = 0;

    for (const automationRow of automations || []) {
      const automation = automationRow as Record<string, unknown>;
      const targetCatalogId = String(automation.catalog_id || '');
      if (!targetCatalogId) continue;

      const recipients = await buildRecipientList(
        targetCatalogId,
        String(automation.audience_segment || 'all') as never
      );
      const { text, replyMarkup } = await buildAutomationMessage(
        automation as never,
        targetCatalogId
      );
      processed += 1;

      for (const recipient of recipients) {
        const customerId = String(recipient.customer_id || '');
        const chatId = Number(recipient.chat_id || 0);
        if (!chatId) continue;

        const now = new Date();
        let runKey = `${automation.id}:${customerId}`;
        switch (String(automation.trigger_key || '')) {
          case 'after_first_order':
            runKey = `${automation.id}:${customerId}:first_order`;
            break;
          case 'no_order_7_days':
            runKey = `${automation.id}:${customerId}:no_order_7:${getDateKey(now)}`;
            if (
              !recipient.last_order_at ||
              now.getTime() - new Date(recipient.last_order_at).getTime() < 7 * DAY_MS
            ) {
              skipped += 1;
              continue;
            }
            break;
          case 'no_order_30_days':
            runKey = `${automation.id}:${customerId}:no_order_30:${getMonthKey(now)}`;
            if (
              !recipient.last_order_at ||
              now.getTime() - new Date(recipient.last_order_at).getTime() < 30 * DAY_MS
            ) {
              skipped += 1;
              continue;
            }
            break;
          case 'abandoned_cart':
            runKey = `${automation.id}:${customerId}:abandoned:${getDateKey(now)}`;
            if (!recipient.has_abandoned_cart) {
              skipped += 1;
              continue;
            }
            break;
          case 'birthday':
            runKey = `${automation.id}:${customerId}:birthday:${now.getFullYear()}`;
            if (!recipient.birthday_at) {
              skipped += 1;
              continue;
            }
            {
              const birthday = new Date(recipient.birthday_at);
              if (
                birthday.getMonth() !== now.getMonth() ||
                birthday.getDate() !== now.getDate()
              ) {
                skipped += 1;
                continue;
              }
            }
            break;
          case 'burger_lovers':
            runKey = `${automation.id}:${customerId}:burger:${getMonthKey(now)}`;
            if (!recipient.has_burger_order) {
              skipped += 1;
              continue;
            }
            break;
          case 'vip_offer':
            runKey = `${automation.id}:${customerId}:vip:${getMonthKey(now)}`;
            if (!(recipient.tags.includes('vip') || recipient.orders_count >= 5 || recipient.average_check >= 5000)) {
              skipped += 1;
              continue;
            }
            break;
          default:
            break;
        }

        const { data: existingRun } = await supabaseService
          .from('marketing_automation_runs')
          .select('*')
          .eq('run_key', runKey)
          .maybeSingle();

        if (existingRun?.sent_at) {
          skipped += 1;
          continue;
        }

        await supabaseService.from('marketing_automation_runs').upsert(
          {
            automation_id: automation.id,
            customer_id: customerId,
            event_id: null,
            order_id: null,
            run_key: runKey,
            status: 'pending',
            sent_at: null,
            error: null,
          },
          { onConflict: 'run_key' }
        );

        try {
          await sendToRecipient(chatId, text, replyMarkup);
          await supabaseService
            .from('marketing_automation_runs')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              error: null,
            })
            .eq('run_key', runKey);
          sent += 1;
        } catch (error) {
          await supabaseService
            .from('marketing_automation_runs')
            .update({
              status: 'failed',
              error: error instanceof Error ? error.message : 'Failed to send',
            })
            .eq('run_key', runKey);
        }
      }
    }

    return Response.json(
      { processed, sent, skipped },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('marketing-automation-runner error', error);
    return new Response(
      error instanceof Error ? error.message : 'Failed to run automations',
      { status: 500, headers: corsHeaders }
    );
  }
});
