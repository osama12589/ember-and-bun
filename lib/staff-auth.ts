import { createHmac, timingSafeEqual } from 'node:crypto';

export const STAFF_COOKIE = 'emberbun_staff';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function secret() {
  const value = process.env.STAFF_SESSION_SECRET;
  if (!value) throw new Error('STAFF_SESSION_SECRET is not configured.');
  return value;
}

export function createStaffSession(username: string) {
  const payload = Buffer.from(JSON.stringify({ username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString('base64url');
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyStaffSession(value: string | undefined) {
  if (!value) return false;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;

  const expected = createHmac('sha256', secret()).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof parsed.exp === 'number' && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const staffSessionMaxAge = SESSION_TTL_SECONDS;
