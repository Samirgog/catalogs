import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.224.0/node/crypto.ts';

const BOT_TOKENS = [
  Deno.env.get('TELEGRAM_BOT_TOKEN_ENTRY'),
  Deno.env.get('TELEGRAM_BOT_TOKEN_CLIENT'),
  Deno.env.get('TELEGRAM_BOT_TOKEN'),
].filter((value): value is string => Boolean(value && value.trim()));

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!BOT_TOKENS.length) {
  throw new Error(
    'Missing bot token env. Set TELEGRAM_BOT_TOKEN_ENTRY and/or TELEGRAM_BOT_TOKEN_CLIENT.'
  );
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
};

type Entry =
  | { type: 'admin' }
  | { type: 'catalog'; catalogId: string }
  | { type: 'place'; placeId: string };

const buildDataCheckString = (initData: string) => {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  if (!hash) {
    throw new Error('Missing hash in initData');
  }

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  return { hash, dataCheckString, urlParams };
};

const calcHash = (botToken: string, dataCheckString: string) => {
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  return createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
};

const parseEntry = (startParamRaw: string | null): Entry => {
  const startParam = (startParamRaw || '').trim();
  if (!startParam) return { type: 'admin' };

  if (startParam.startsWith('catalog_')) {
    return {
      type: 'catalog',
      catalogId: startParam.replace('catalog_', ''),
    };
  }

  if (startParam.startsWith('place_')) {
    return {
      type: 'place',
      placeId: startParam.replace('place_', ''),
    };
  }

  return { type: 'admin' };
};

function validateTelegramInitData(initData: string): { user: TelegramUser; entry: Entry } {
  const { hash, dataCheckString, urlParams } = buildDataCheckString(initData);

  const isValid = BOT_TOKENS.some((token) => calcHash(token, dataCheckString) === hash);
  if (!isValid) {
    throw new Error('Invalid hash - initData validation failed');
  }

  const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
  const currentTime = Math.floor(Date.now() / 1000);
  if (!authDate || currentTime - authDate > 86400) {
    throw new Error('initData is too old');
  }

  const userParam = urlParams.get('user');
  if (!userParam) {
    throw new Error('Missing user data in initData');
  }
  const user = JSON.parse(userParam) as TelegramUser;
  const entry = parseEntry(urlParams.get('start_param'));

  return { user, entry };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();

    let initData = '';
    try {
      const json = JSON.parse(bodyText);
      initData = String(json.initData || '');
    } catch {
      initData = bodyText;
    }

    if (!initData) {
      return new Response('initData required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { user, entry } = validateTelegramInitData(initData);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user.id)
      .maybeSingle();

    if (existingUser) {
      return new Response(JSON.stringify({ user: existingUser, entry }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        telegram_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name || null,
        username: user.username || null,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ user: newUser, entry }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
