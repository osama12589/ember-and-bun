'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';

export function OrderAccessGate() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json().catch(() => ({ ok: false, message: 'Unable to verify staff access.' }));

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Incorrect username or password.');
      }

      window.location.href = '/orders';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify staff access.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="orders-page access-page">
      <section className="orders-shell access-shell">
        <div className="access-card">
          <span className="section-kicker">STAFF ACCESS</span>
          <h1>Restricted</h1>
          <p>This is the Ember &amp; Bun back-of-house board. Customers are redirected away from order tracking.</p>

          <form onSubmit={handleSubmit} className="staff-login-form">
            <label className="staff-field">
              <span>Staff username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter staff username"
                autoComplete="username"
              />
            </label>

            <label className="staff-field">
              <span>Staff password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter staff password"
                autoComplete="current-password"
              />
            </label>

            {error ? <p className="checkout-error">{error}</p> : null}

            <div className="access-actions">
              <button type="submit" className="cta cta-primary" disabled={submitting || !username.trim() || !password.trim()}>
                <LockKeyhole size={18} /> {submitting ? 'Checking...' : 'Enter staff pass'}
              </button>
              <Link href="/" className="cta cta-secondary">Back to storefront</Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
