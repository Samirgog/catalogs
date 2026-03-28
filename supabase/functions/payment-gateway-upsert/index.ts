import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { encryptSecret, maskShopId } from '../_shared/crypto.ts';
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
    const { catalogId, initData, gatewayData } = await req.json();
    if (!catalogId || !initData || !gatewayData) {
      return new Response('catalogId, initData and gatewayData are required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const user = await requireCatalogAccess(String(catalogId), String(initData));
    const shopId = String(gatewayData.shop_id || '').trim();
    const secretKey = String(gatewayData.secret_key || '').trim();
    if (!shopId || !secretKey) {
      return new Response('shop_id and secret_key are required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const encryptedShopId = await encryptSecret(shopId);
    const encryptedSecretKey = await encryptSecret(secretKey);

    const { data, error } = await supabaseService
      .from('catalog_payment_gateways')
      .upsert(
        {
          catalog_id: catalogId,
          provider: 'yookassa',
          is_enabled: gatewayData.is_enabled ?? true,
          shop_id_encrypted: encryptedShopId,
          secret_key_encrypted: encryptedSecretKey,
          shop_id_masked: maskShopId(shopId),
          success_return_url: gatewayData.success_return_url ?? null,
          fail_return_url: gatewayData.fail_return_url ?? null,
          created_by: user.id,
        },
        { onConflict: 'catalog_id,provider' }
      )
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
    return new Response(error instanceof Error ? error.message : 'Failed to save gateway', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
