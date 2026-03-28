import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { requireCatalogAccess, supabaseService } from '../_shared/telegramAuth.ts';

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
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { catalogId, initData, isEnabled } = await req.json();
    if (!catalogId || !initData || typeof isEnabled !== 'boolean') {
      return new Response('catalogId, initData and isEnabled are required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    await requireCatalogAccess(String(catalogId), String(initData));

    const { data, error } = await supabaseService
      .from('catalog_payment_gateways')
      .update({ is_enabled: isEnabled })
      .eq('catalog_id', catalogId)
      .eq('provider', 'yookassa')
      .select(
        'id, catalog_id, provider, is_enabled, shop_id_masked, success_return_url, fail_return_url, created_at, updated_at'
      )
      .single();

    if (error) throw error;

    return Response.json(
      {
        ...data,
        is_configured: true,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Failed to toggle gateway', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
