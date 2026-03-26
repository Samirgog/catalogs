import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const assertNoError = (error: { message?: string } | null, context: string) => {
  if (error) {
    throw new Error(`${context}: ${error.message || 'unknown error'}`);
  }
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
    const { catalogId } = await req.json();
    if (!catalogId || typeof catalogId !== 'string') {
      return new Response('catalogId is required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
      .eq('catalog_id', catalogId);
    assertNoError(categoriesError, 'Ошибка загрузки категорий');

    const categoryIds = (categories ?? []).map((row) => row.id);
    if (categoryIds.length > 0) {
      const { error: itemsDeleteError } = await supabase
        .from('items')
        .delete()
        .in('category_id', categoryIds);
      assertNoError(itemsDeleteError, 'Ошибка удаления товаров');

      const { error: categoriesDeleteError } = await supabase
        .from('categories')
        .delete()
        .in('id', categoryIds);
      assertNoError(categoriesDeleteError, 'Ошибка удаления категорий');
    }

    const deletions = await Promise.all([
      supabase.from('actions').delete().eq('catalog_id', catalogId),
      supabase.from('catalog_fulfillment_methods').delete().eq('catalog_id', catalogId),
      supabase.from('qr_links').delete().eq('target_type', 'catalog').eq('target_id', catalogId),
      supabase.from('place_catalogs').delete().eq('catalog_id', catalogId),
      supabase.from('catalog_staff_members').delete().eq('catalog_id', catalogId),
      supabase.from('catalog_staff_codes').delete().eq('catalog_id', catalogId),
      supabase.from('catalog_user_access').delete().eq('catalog_id', catalogId),
      supabase.from('catalog_access_invites').delete().eq('catalog_id', catalogId),
      supabase.from('catalog_payment_gateways').delete().eq('catalog_id', catalogId),
      supabase.from('order_notifications').delete().eq('catalog_id', catalogId),
      supabase.from('client_order_notifications').delete().eq('catalog_id', catalogId),
      supabase.from('orders').delete().eq('catalog_id', catalogId),
    ]);

    const contexts = [
      'Ошибка удаления способов оплаты',
      'Ошибка удаления способов получения',
      'Ошибка удаления QR-ссылок',
      'Ошибка удаления связей с местами',
      'Ошибка удаления сотрудников',
      'Ошибка удаления кодов сотрудников',
      'Ошибка удаления доступов к каталогу',
      'Ошибка удаления инвайтов каталога',
      'Ошибка удаления платежных настроек',
      'Ошибка удаления уведомлений сотрудников',
      'Ошибка удаления уведомлений клиентов',
      'Ошибка удаления заказов',
    ];

    deletions.forEach((result, index) => assertNoError(result.error, contexts[index]));

    const { error: deleteCatalogError } = await supabase
      .from('catalogs')
      .delete()
      .eq('id', catalogId);
    assertNoError(deleteCatalogError, 'Ошибка удаления каталога');

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('catalog-delete error', error);
    return new Response(
      error instanceof Error ? error.message : 'Не удалось удалить каталог',
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
