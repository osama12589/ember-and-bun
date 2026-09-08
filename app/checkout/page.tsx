import type { Metadata } from 'next';
import Checkout from '@/components/checkout';

export const metadata: Metadata = {
  title: 'Checkout — Ember & Bun',
  description: 'Review your bag, choose delivery details, and complete your Ember & Bun order.'
};

export default function CheckoutPage() {
  return <Checkout />;
}
