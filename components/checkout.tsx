'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, CreditCard, Flame, MapPin, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useBag } from '@/components/store-provider';
import { burgers, money } from '@/lib/menu';

const API_URL = '/api/orders';
type Fulfillment = 'asap' | 'tonight' | 'pickup';
type PaymentMethod = 'card' | 'cash';

const fulfillmentOptions: Array<{ value: Fulfillment; label: string; eta: string }> = [
  { value: 'asap', label: 'ASAP · 20 min', eta: '20–25 min' },
  { value: 'tonight', label: 'Tonight · 7:45 PM', eta: 'Tonight · 7:45 PM' },
  { value: 'pickup', label: 'Pickup · 15 min', eta: '15 min' }
];

export default function Checkout() {
  const { bag, count, change, remove, clear } = useBag();
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('asap');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 2714');
  const [customer, setCustomer] = useState({
    firstName: 'Avery',
    lastName: 'Morgan',
    email: 'avery@emberbun.com',
    phone: '(415) 555-0142'
  });
  const [address, setAddress] = useState('');

  const items = useMemo(() => burgers.filter((item) => bag[item.id]), [bag]);

  if (count === 0 && !submitted) {
    return (
      <main id="main-content" className="checkout-page checkout-empty">
        <section className="checkout-shell empty-shell">
          <div className="empty-checkout-card">
            <span className="empty-icon"><ShoppingBag /></span>
            <span className="section-kicker">YOUR BAG IS EMPTY</span>
            <h1>HUNGRY FOR A <em>SMASH</em>?</h1>
            <p>Pick a burger from the menu and we’ll get it ready for you.</p>
            <Link href="/shop" className="cta cta-primary">Browse the menu <ArrowRight /></Link>
          </div>
        </section>
      </main>
    );
  }

  if (submitted) {
    return (
      <main id="main-content" className="checkout-page checkout-success-page">
        <section className="checkout-shell success-shell">
          <div className="success-card">
            <span className="success-badge"><Check size={18} /> Order placed</span>
            <h1>YOUR <em>SMASH</em> IS ON THE WAY.</h1>
            <p>Thanks for ordering with Ember & Bun. Your confirmation is <strong>#{orderId || 'EB-ORDER'}</strong> and the kitchen is firing up.</p>
            <div className="success-meta">
              <span><Truck size={16} /> 20–25 min delivery</span>
              <span><ShieldCheck size={16} /> Secure payment approved</span>
            </div>
            <div className="success-actions">
              <Link href="/shop" className="cta cta-primary">Order again <ArrowRight /></Link>
              <Link href="/" className="cta cta-secondary">Back home</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * (bag[item.id] || 0), 0);
  const isPickup = fulfillment === 'pickup';
  const delivery = isPickup ? 0 : 4.5;
  const service = 3.5;
  const tax = subtotal * 0.0825;
  const total = subtotal + delivery + service + tax;
  const selectedFulfillment = fulfillmentOptions.find((option) => option.value === fulfillment) || fulfillmentOptions[0];

  return (
    <main id="main-content" className="checkout-page">
      <section className="checkout-shell">
        <div className="checkout-topbar">
          <Link href="/shop" className="back-link"><ArrowLeft size={18} /> Back to menu</Link>
          <div className="topbar-kicker"><Flame size={14} fill="currentColor" /> Ready to order</div>
        </div>

        <div className="checkout-header-wrap">
          <div>
            <span className="section-kicker">CHECKOUT</span>
            <h1>ONE LAST <em>STEP.</em></h1>
          </div>
          <div className="checkout-trust-pill"><ShieldCheck size={16} /> Secure checkout</div>
        </div>

        <div className="checkout-grid">
          <form
            className="checkout-form"
            onSubmit={async (event) => {
              event.preventDefault();

              if (submitting) {
                return;
              }

              setSubmitting(true);
              setError('');

              try {
                const response = await fetch(API_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    items: items.map((item) => ({
                      id: item.id,
                      name: item.name,
                      quantity: bag[item.id],
                      price: item.price
                    })),
                    customer,
                    delivery: {
                      method: isPickup ? 'pickup' : 'delivery',
                      address,
                      eta: selectedFulfillment.eta
                    },
                    payment: {
                      method: paymentMethod,
                      last4: cardNumber.replace(/\D/g, '').slice(-4)
                    },
                    subtotal,
                    service,
                    tax,
                    total
                  })
                });

                const data = await response.json();

                if (!response.ok || !data.ok) {
                  throw new Error(data.message || 'Checkout failed. Please try again.');
                }

                setOrderId(data.orderId || data.order?.id || '');
                setSubmitted(true);
                clear();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Something went wrong while placing the order.');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="checkout-panel">
              <div className="panel-head">
                <span className="panel-icon"><MapPin size={17} /></span>
                <div>
                  <span className="panel-label">Delivery details</span>
                  <strong>{address || 'Add your delivery address'}</strong>
                </div>
              </div>

              <label className="field">
                <span>Delivery address</span>
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Enter your delivery address"
                  aria-label="Delivery address"
                  required={!isPickup}
                />
              </label>

              <div className="field-grid two-up">
                <label className="field">
                  <span>First name</span>
                  <input
                    value={customer.firstName}
                    onChange={(event) => setCustomer({ ...customer, firstName: event.target.value })}
                    aria-label="First name"
                  />
                </label>
                <label className="field">
                  <span>Last name</span>
                  <input
                    value={customer.lastName}
                    onChange={(event) => setCustomer({ ...customer, lastName: event.target.value })}
                    aria-label="Last name"
                  />
                </label>
              </div>

              <div className="field-grid two-up">
                <label className="field">
                  <span>Phone</span>
                  <input
                    value={customer.phone}
                    onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                    aria-label="Phone number"
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    value={customer.email}
                    onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
                    aria-label="Email address"
                    type="email"
                  />
                </label>
              </div>
            </div>

            <div className="checkout-panel">
              <div className="panel-head">
                <span className="panel-icon"><Clock3 size={17} /></span>
                <div>
                  <span className="panel-label">When do you want it?</span>
                  <strong>{selectedFulfillment.label}</strong>
                </div>
              </div>

              <div className="option-row">
                {fulfillmentOptions.map((option) => (
                  <button
                    type="button"
                    className={`option-chip${fulfillment === option.value ? ' active' : ''}`}
                    key={option.value}
                    aria-pressed={fulfillment === option.value}
                    onClick={() => setFulfillment(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="checkout-panel payment-panel">
              <div className="panel-head">
                <span className="panel-icon"><CreditCard size={17} /></span>
                <div>
                  <span className="panel-label">Payment</span>
                  <strong>{paymentMethod === 'card' ? `Visa ending in ${cardNumber.replace(/\D/g, '').slice(-4) || '----'}` : 'Cash on delivery'}</strong>
                </div>
              </div>

              <div className="option-row">
                {([
                  ['card', 'Card'],
                  ['cash', 'Cash']
                ] as const).map(([value, label]) => (
                  <button
                    type="button"
                    className={`option-chip${paymentMethod === value ? ' active' : ''}`}
                    key={value}
                    aria-pressed={paymentMethod === value}
                    onClick={() => setPaymentMethod(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' ? (
                <>
                  <div className="field-grid">
                    <label className="field">
                      <span>Card number</span>
                      <input
                        value={cardNumber}
                        onChange={(event) => setCardNumber(event.target.value)}
                        inputMode="numeric"
                        aria-label="Card number"
                      />
                    </label>
                  </div>

                  <div className="field-grid two-up compact-grid">
                    <label className="field">
                      <span>Expiry</span>
                      <input defaultValue="07/29" aria-label="Expiry date" />
                    </label>
                    <label className="field">
                      <span>CVV</span>
                      <input defaultValue="348" aria-label="CVV" />
                    </label>
                  </div>
                </>
              ) : null}
            </div>

            {error ? <p className="checkout-error" role="alert">{error}</p> : null}

            <div className="checkout-actions">
              <button type="submit" className="cta cta-primary" disabled={submitting}>
                {submitting ? 'Placing order…' : 'Place order'}
                {!submitting ? <ArrowRight /> : null}
              </button>
              <Link href="/shop" className="cta cta-secondary">Keep shopping</Link>
            </div>
          </form>

          <aside className="checkout-summary" aria-label="Order summary">
            <div className="summary-head">
              <div>
                <span className="section-kicker">ORDER SUMMARY</span>
                <h2>{count} {count === 1 ? 'burger' : 'burgers'}</h2>
              </div>
              <span className="summary-pill">{items.length} items</span>
            </div>

            <div className="summary-items">
              {items.map((item) => (
                <article className="summary-item" key={item.id}>
                  <img src={item.image} alt={item.name} width={120} height={120} />
                  <div className="summary-info">
                    <strong>{item.name}</strong>
                    <span>{money(item.price)} each</span>
                    <div className="quantity-row">
                      <button type="button" aria-label={`Decrease ${item.name}`} onClick={() => change(item.id, -1)}><Minus size={15} /></button>
                      <output aria-live="polite">{bag[item.id]}</output>
                      <button type="button" aria-label={`Increase ${item.name}`} onClick={() => change(item.id, 1)}><Plus size={15} /></button>
                    </div>
                  </div>
                  <button type="button" className="remove-row" aria-label={`Remove ${item.name}`} onClick={() => remove(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>

            <div className="totals-block">
              <div>
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <div>
                <span>Delivery</span>
                <strong>{money(delivery)}</strong>
              </div>
              <div>
                <span>Service</span>
                <strong>{money(service)}</strong>
              </div>
              <div>
                <span>Tax</span>
                <strong>{money(tax)}</strong>
              </div>
              <div className="totals-total">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            <div className="checkout-footer-note">
              <span>{isPickup ? <MapPin size={16} /> : <Truck size={16} />} {isPickup ? 'Pickup in 15 min' : `Delivery to ${address || 'your address'}`}</span>
              <span><Check size={15} /> {paymentMethod === 'cash' ? 'Pay with cash' : 'Payment secured'}</span>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
