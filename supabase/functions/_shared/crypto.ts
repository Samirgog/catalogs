const MASTER_KEY = Deno.env.get('PAYMENT_CONFIG_MASTER_KEY') || '';

function assertKey() {
  if (!MASTER_KEY) {
    throw new Error('Missing PAYMENT_CONFIG_MASTER_KEY');
  }
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

async function getAesKey() {
  assertKey();
  const raw = base64ToBytes(MASTER_KEY);
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getAesKey();
  const encoded = new TextEncoder().encode(value);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(cipher))}`;
}

export async function decryptSecret(payload: string) {
  const [ivPart, cipherPart] = payload.split(':');
  if (!ivPart || !cipherPart) {
    throw new Error('Invalid encrypted payload');
  }
  const key = await getAesKey();
  const iv = base64ToBytes(ivPart);
  const cipher = base64ToBytes(cipherPart);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new TextDecoder().decode(plain);
}

export function maskShopId(shopId: string) {
  if (shopId.length <= 4) {
    return '*'.repeat(Math.max(shopId.length, 1));
  }
  return `${'*'.repeat(Math.max(shopId.length - 4, 1))}${shopId.slice(-4)}`;
}
