import { requireTelegramUser } from './telegramAuth.ts';

export async function requirePlatformAdmin(initData: string) {
  const user = await requireTelegramUser(initData);

  const platformAdminTelegramId = Number(
    Deno.env.get('PLATFORM_ADMIN_TELEGRAM_ID') ||
      Deno.env.get('VITE_PLATFORM_ADMIN_TELEGRAM_ID') ||
      0
  );

  if (!platformAdminTelegramId) {
    throw new Error('Missing PLATFORM_ADMIN_TELEGRAM_ID');
  }

  if (Number(user.telegram_id || 0) !== platformAdminTelegramId) {
    throw new Error('Access denied');
  }

  return user;
}
