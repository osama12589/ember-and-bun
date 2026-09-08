import { NextResponse } from 'next/server';
import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import {
  createStaffSession,
  STAFF_COOKIE,
  staffSessionMaxAge
} from '@/lib/staff-auth';

import { getDb } from '@/lib/mongodb';

const scryptAsync = promisify(scrypt);

export function GET(request: Request) {
  return NextResponse.redirect(new URL('/orders', request.url));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({
    username: '',
    password: ''
  }));

  const username =
    typeof body?.username === 'string' ? body.username.trim() : '';

  const password =
    typeof body?.password === 'string' ? body.password : '';

  if (!username || !password) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Incorrect username or password.'
      },
      {
        status: 401
      }
    );
  }

  try {
    const db = await getDb();

    const staffUser = await db.collection('staff_users').findOne(
      {
        username
      },
      {
        projection: {
          _id: 1,
          passwordHash: 1
        }
      }
    );

    let validPassword = false;

    if (staffUser?.passwordHash) {
      const [salt, storedKey] = staffUser.passwordHash.split('$');

      if (salt && storedKey) {
        const derivedKey = (await scryptAsync(
          password,
          salt,
          64
        )) as Buffer;

        const expectedKey = Buffer.from(storedKey, 'hex');

        validPassword =
          expectedKey.length === derivedKey.length &&
          timingSafeEqual(expectedKey, derivedKey);
      }
    }

    if (!staffUser || !validPassword) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Incorrect username or password.'
        },
        {
          status: 401
        }
      );
    }

    const response = NextResponse.json({
      ok: true
    });

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
  } catch (error) {
    console.error('Staff login failed:', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'Unable to verify staff access right now.'
      },
      {
        status: 503
      }
    );
  }
}