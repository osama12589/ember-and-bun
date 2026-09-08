import { NextResponse } from 'next/server';
import { createStaffSession, STAFF_COOKIE, staffSessionMaxAge } from '@/lib/staff-auth';

const backendApiUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:4000';

export function GET(request: Request) {
  return NextResponse.redirect(new URL('/orders', request.url));
}

export async function POST(request: Request) {
 const body = await request.json().catch(() => ({ username: '', password: '' }));
 const username = typeof body?.username === 'string' ? body.username.trim() : '';
 const password = typeof body?.password === 'string' ? body.password : '';

  if (!username || !password) {
    return NextResponse.json({ ok: false, message: 'Incorrect username or password.' }, { status: 401 });
  }

  try {
    const backendResponse = await fetch(`${backendApiUrl}/api/staff-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store'
    });
    const data = await backendResponse.json().catch(() => ({ ok: false, message: 'Unable to verify staff access.' }));

    if (!backendResponse.ok || !data.ok) {
      return NextResponse.json(
        { ok: false, message: data.message || 'Incorrect username or password.' },
        { status: backendResponse.status }
      );
    }
  } catch (error) {
    console.error('Staff login backend request failed:', error);
    return NextResponse.json({ ok: false, message: 'Unable to verify staff access right now.' }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: STAFF_COOKIE,
    value: createStaffSession(username),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: staffSessionMaxAge
  });

  return response;
}
