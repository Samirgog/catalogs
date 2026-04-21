import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { supabaseService } from '../_shared/telegramAuth.ts';
import { requirePlatformAdmin } from '../_shared/requirePlatformAdmin.ts';

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
    const { initData } = await req.json();
    if (!initData) {
      return new Response('initData is required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    await requirePlatformAdmin(String(initData));

    const { data: users, error: usersError } = await supabaseService
      .from('users')
      .select('id, first_name, last_name, username, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      throw usersError;
    }

    const { data: catalogs, error: catalogsError } = await supabaseService
      .from('catalogs')
      .select('id, title, created_at, owner_id')
      .not('owner_id', 'is', null)
      .order('created_at', { ascending: false });

    if (catalogsError) {
      throw catalogsError;
    }

    const catalogsByOwner = new Map<
      string,
      Array<{ id: string; title: string; created_at: string }>
    >();

    for (const catalog of catalogs || []) {
      const ownerId = String(catalog.owner_id || '');
      if (!ownerId) continue;

      const currentCatalogs = catalogsByOwner.get(ownerId) || [];
      currentCatalogs.push({
        id: catalog.id,
        title: catalog.title,
        created_at: catalog.created_at,
      });
      catalogsByOwner.set(ownerId, currentCatalogs);
    }

    return Response.json(
      (users || []).map((user) => ({
        ...user,
        catalogs: catalogsByOwner.get(user.id) || [],
      })),
      { headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : 'Failed to load platform users',
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
