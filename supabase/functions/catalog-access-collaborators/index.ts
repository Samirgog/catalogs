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

    const { data: accessRows, error: accessError } = await supabase
      .from('catalog_user_access')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('created_at', { ascending: true });

    if (accessError) {
      throw accessError;
    }

    const userIds = (accessRows || []).map((row) => row.user_id);
    const { data: users, error: usersError } = userIds.length
      ? await supabase
          .from('users')
          .select('id, first_name, last_name, username')
          .in('id', userIds)
      : { data: [], error: null };

    if (usersError) {
      throw usersError;
    }

    const usersById = new Map((users || []).map((user) => [user.id, user]));
    const result = (accessRows || []).map((row) => ({
      ...row,
      user: usersById.get(row.user_id) ?? null,
    }));

    return Response.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('catalog-access-collaborators error', error);
    return new Response(
      error instanceof Error ? error.message : 'Failed to load collaborators',
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
