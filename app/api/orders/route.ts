import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STAFF_COOKIE, verifyStaffSession } from '@/lib/staff-auth';

const backendApiUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:4000';

export async function GET() {
  const cookieStore = await cookies();
  if (!verifyStaffSession(cookieStore.get(STAFF_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, message: 'Staff authentication required.' }, { status: 401 });
  }

  const response = await fetch(`${backendApiUrl}/api/orders`, {
    headers: { 'x-internal-api-secret': process.env.INTERNAL_API_SECRET || '' },
    cache: 'no-store'
  });
  const data = await response.json().catch(() => ({ ok: false, message: 'Unable to load orders.' }));
  return NextResponse.json(data, { status: response.status });
}
