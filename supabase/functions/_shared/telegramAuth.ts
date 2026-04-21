import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKENS = [
  Deno.env.get('TELEGRAM_BOT_TOKEN_ENTRY'),
  Deno.env.get('TELEGRAM_BOT_TOKEN_CLIENT'),
  Deno.env.get('TELEGRAM_BOT_TOKEN'),
].filter((value): value is string => Boolean(value && value.trim()));

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!BOT_TOKENS.length) {
  throw new Error('Missing Telegram bot token env vars');
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type TelegramUser = {
  id: number;
};

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

const bytesToHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const hmacSha256 = async (key: Uint8Array, message: string) => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(message)
  );
};

const calcHash = async (botToken: string, dataCheckString: string) => {
  const firstPass = await hmacSha256(
    new TextEncoder().encode('WebAppData'),
    botToken
  );
  const secondPass = await hmacSha256(new Uint8Array(firstPass), dataCheckString);
  return bytesToHex(secondPass);
};

export async function requireTelegramUser(initData: string) {
  if (!initData.trim()) {
    throw new Error('initData required');
  }

  const { hash, dataCheckString, urlParams } = buildDataCheckString(initData);
  const hashes = await Promise.all(BOT_TOKENS.map((token) => calcHash(token, dataCheckString)));
  const isValid = hashes.some((value) => value === hash);
  if (!isValid) {
    throw new Error('Invalid initData');
  }

  const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
  const currentTime = Math.floor(Date.now() / 1000);
  if (!authDate || currentTime - authDate > 86400) {
    throw new Error('initData is too old');
  }

  const userRaw = urlParams.get('user');
  if (!userRaw) {
    throw new Error('Missing user in initData');
  }

  const tgUser = JSON.parse(userRaw) as TelegramUser;
  const { data: user, error } = await supabaseService
    .from('users')
    .select('*')
    .eq('telegram_id', tgUser.id)
    .maybeSingle();

  if (error || !user) {
    throw new Error('User not found');
  }

  return user;
}

export async function requireCatalogAccess(catalogId: string, initData: string) {
  const user = await requireTelegramUser(initData);

  const { data: catalog, error: catalogError } = await supabaseService
    .from('catalogs')
    .select('id, owner_id')
    .eq('id', catalogId)
    .maybeSingle();

  if (catalogError || !catalog) {
    throw new Error('Catalog not found');
  }

  if (catalog.owner_id === user.id) {
    return user;
  }

  const { data: access, error: accessError } = await supabaseService
    .from('catalog_user_access')
    .select('id')
    .eq('catalog_id', catalogId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (accessError) {
    throw accessError;
  }

  if (!access) {
    throw new Error('Access denied');
  }

  return user;
}
