import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';

import {
  STAFF_COOKIE,
  verifyStaffSession
} from '@/lib/staff-auth';

import { getDb } from '@/lib/mongodb';

const menu = new Map([
  ['ember-double', { name: 'The Ember Double', price: 12.5 }],
  ['hot-honey', { name: 'Hot Honey Crunch', price: 11.5 }],
  ['shroom-service', { name: 'Shroom Service', price: 10.5 }]
]);

export async function GET() {
  const cookieStore = await cookies();

  if (!verifyStaffSession(cookieStore.get(STAFF_COOKIE)?.value)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Staff authentication required.'
      },
      {
        status: 401
      }
    );
  }

  try {
    const db = await getDb();

    const orders = await db
      .collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      ok: true,
      orders
    });
  } catch (error) {
    console.error('Orders fetch failed:', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'Unable to load orders.'
      },
      {
        status: 503
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      items = [],
      customer = {},
      delivery = {},
      payment = {}
    } = body;

    if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Order must contain at least one item.'
        },
        {
          status: 400
        }
      );
    }

    const deliveryMethod =
      delivery?.method === 'pickup' ? 'pickup' : 'delivery';

    if (
      !delivery ||
      (deliveryMethod === 'delivery' &&
        (typeof delivery.address !== 'string' ||
          !delivery.address.trim())) ||
      (typeof delivery.address === 'string' &&
        delivery.address.length > 500)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: 'A delivery address is required.'
        },
        {
          status: 400
        }
      );
    }

    const paymentMethod = ['card', 'cash'].includes(payment?.method)
      ? payment.method
      : 'card';

    const paymentLast4 =
      typeof payment?.last4 === 'string'
        ? payment.last4.replace(/\D/g, '').slice(-4)
        : '';

    const validatedItems = [];

    let subtotal = 0;

    for (const item of items) {
      const catalogItem = menu.get(item?.id);

      const quantity = Number(item?.quantity);

      if (
        !catalogItem ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
      ) {
        return NextResponse.json(
          {
            ok: false,
            message: 'Order contains an invalid item.'
          },
          {
            status: 400
          }
        );
      }

      validatedItems.push({
        id: item.id,
        name: catalogItem.name,
        quantity,
        price: catalogItem.price
      });

      subtotal += catalogItem.price * quantity;
    }

    const deliveryFee =
      deliveryMethod === 'pickup' ? 0 : 4.5;

    const serviceFee = 3.5;

    const tax = Number((subtotal * 0.0825).toFixed(2));

    const calculatedTotal = Number(
      (
        subtotal +
        deliveryFee +
        serviceFee +
        tax
      ).toFixed(2)
    );

    const order = {
      id: `EB-${randomUUID().slice(0, 8).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: 'confirmed',

      customer: {
        firstName:
          typeof customer.firstName === 'string'
            ? customer.firstName.trim().slice(0, 80)
            : 'Guest',

        lastName:
          typeof customer.lastName === 'string'
            ? customer.lastName.trim().slice(0, 80)
            : 'Customer',

        email:
          typeof customer.email === 'string'
            ? customer.email.trim().slice(0, 200)
            : '',

        phone:
          typeof customer.phone === 'string'
            ? customer.phone.trim().slice(0, 40)
            : ''
      },

      items: validatedItems,

      payment: {
        method: paymentMethod,
        last4:
          paymentMethod === 'card'
            ? paymentLast4
            : ''
      },

      delivery: {
        method: deliveryMethod,
        address:
          typeof delivery.address === 'string'
            ? delivery.address.trim()
            : '',
        eta: delivery.eta || '20–25 min'
      },

      subtotal,
      deliveryFee,
      serviceFee,
      tax,
      total: calculatedTotal
    };

    const db = await getDb();

    await db.collection('orders').insertOne(order);

    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        order
      },
      {
        status: 201
      }
    );
  } catch (error) {
    console.error('Create order failed:', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'Unable to create order.'
      },
      {
        status: 500
      }
    );
  }
}