import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { requireMarketingAccess } from '../_shared/marketingAuth.ts';
import {
  buildCampaignMessage,
  buildRecipientList,
  sendToRecipient,
  supabaseService,
} from '../_shared/marketing.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

    const campaignId = String(body.campaignId || '');
    const manualCampaign =
      campaignId.length > 0
        ? await supabaseService
            .from('marketing_campaigns')
            .select('*')
            .eq('id', campaignId)
            .maybeSingle()
        : { data: null, error: null };

    if (campaignId && manualCampaign.error) {
      throw manualCampaign.error;
    }

    const queuedCampaigns = campaignId
      ? manualCampaign.data
        ? [manualCampaign.data]
        : []
      : (
          await supabaseService
            .from('marketing_campaigns')
            .select('*')
            .eq('status', 'queued')
            .order('created_at', { ascending: true })
        ).data || [];

    const pendingCampaigns = campaignId
      ? queuedCampaigns
      : queuedCampaigns.filter((campaign) => {
          const scheduledAt = String((campaign as Record<string, unknown>).scheduled_at || '');
          return !scheduledAt || new Date(scheduledAt).getTime() <= Date.now();
        });

    let processed = 0;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const campaignRow of pendingCampaigns) {
      const campaign = campaignRow as Record<string, unknown>;
      const catalogId = String(campaign.catalog_id || '');
      if (!catalogId) continue;

      processed += 1;
      await supabaseService
        .from('marketing_campaigns')
        .update({ status: 'sending' })
        .eq('id', campaign.id);

      try {
        const recipients = await buildRecipientList(
          catalogId,
          String(campaign.audience_segment || 'all') as never
        );
        const { text, replyMarkup } = await buildCampaignMessage(
          campaign as never,
          catalogId
        );

        let successCount = 0;
        let failedCount = 0;
        for (const recipient of recipients) {
          const customerId = String(recipient.customer_id || '');
          const chatId = Number(recipient.chat_id || 0);
          if (!chatId) {
            failedCount += 1;
            continue;
          }

          const { data: existingRun } = await supabaseService
            .from('marketing_campaign_runs')
            .select('*')
            .eq('campaign_id', campaign.id)
            .eq('customer_id', customerId)
            .maybeSingle();

          if (existingRun?.sent_at) {
            skipped += 1;
            continue;
          }

          try {
            await sendToRecipient(chatId, text, replyMarkup);
            await supabaseService.from('marketing_campaign_runs').upsert({
              campaign_id: campaign.id,
              customer_id: customerId,
              chat_id: chatId,
              status: 'sent',
              sent_at: new Date().toISOString(),
              error: null,
            }, { onConflict: 'campaign_id,customer_id' });
            successCount += 1;
          } catch (error) {
            await supabaseService.from('marketing_campaign_runs').upsert({
              campaign_id: campaign.id,
              customer_id: customerId,
              chat_id: chatId,
              status: 'failed',
              sent_at: null,
              error: error instanceof Error ? error.message : 'Failed to send',
            }, { onConflict: 'campaign_id,customer_id' });
            failedCount += 1;
          }
        }

        await supabaseService
          .from('marketing_campaigns')
          .update({
            status: successCount > 0 ? 'sent' : 'failed',
            sent_at: new Date().toISOString(),
            recipient_count: recipients.length,
            success_count: successCount,
            failed_count: failedCount,
          })
          .eq('id', campaign.id);

        sent += successCount;
        failed += failedCount;
      } catch (error) {
        await supabaseService
          .from('marketing_campaigns')
          .update({
            status: 'failed',
            failed_count: 1,
          })
          .eq('id', campaign.id);
        failed += 1;
        console.error('marketing-campaign-dispatch error', error);
      }
    }

    return Response.json(
      { processed, sent, failed, skipped },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('marketing-campaign-dispatch error', error);
    return new Response(
      error instanceof Error ? error.message : 'Failed to dispatch campaigns',
      { status: 500, headers: corsHeaders }
    );
  }
});
