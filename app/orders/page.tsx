import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import OrderBoard from '@/components/order-board';
import { OrderAccessGate } from '@/components/order-access-gate';
import { STAFF_COOKIE, verifyStaffSession } from '@/lib/staff-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Board — Ember & Bun',
  description: 'Track live Ember & Bun orders and check recent order activity.'
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const isStaff = verifyStaffSession(cookieStore.get(STAFF_COOKIE)?.value);

  return isStaff ? <OrderBoard /> : <OrderAccessGate />;
}
