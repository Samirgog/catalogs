import { requirePlatformAdmin } from './requirePlatformAdmin.ts';

const MARKETING_JOB_SECRET = Deno.env.get('MARKETING_JOB_SECRET') || '';

export async function requireMarketingAccess(body: Record<string, unknown>) {
  const initData = String(body.initData || '');
  if (initData) {
    return requirePlatformAdmin(initData);
  }

  const jobSecret = String(body.jobSecret || '');
  if (MARKETING_JOB_SECRET && jobSecret === MARKETING_JOB_SECRET) {
    return null;
  }

  throw new Error('Access denied');
}
