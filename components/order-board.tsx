'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Flame, ShoppingBag, Truck, Wallet } from 'lucide-react';
import { money } from '@/lib/menu';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  createdAt: string;
  status: string;
  customer: {
   firstName: string;
   lastName: string;
   email: string;
   phone: string;
  };
  items: OrderItem[];
  payment: {
   method: string;
   last4: string;
  };
  delivery: {
   method: string;
   address: string;
   eta: string;
  };
  total: number;
};

export default function OrderBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
   let active = true;

   async function loadOrders() {
     try {
       setLoading(true);
       const response = await fetch('/api/orders', { cache: 'no-store' });

       if (!response.ok) {
         throw new Error('Unable to load orders.');
       }

       const data = await response.json();

       if (active) {
         setOrders(Array.isArray(data.orders) ? data.orders : []);
         setError('');
       }
     } catch (err) {
       if (active) {
         setError(err instanceof Error ? err.message : 'Unable to load orders.');
       }
     } finally {
       if (active) {
         setLoading(false);
       }
     }
   }

   void loadOrders();

   return () => {
     active = false;
   };
  }, []);

  const stats = useMemo(() => {
   const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
   const avgTicket = orders.length ? totalRevenue / orders.length : 0;

   return {
     totalRevenue,
     avgTicket,
     totalOrders: orders.length
   };
  }, [orders]);

  return (
   <main id="main-content" className="orders-page">
     <section className="orders-shell">
       <div className="orders-topbar">
         <Link href="/checkout" className="back-link"><ArrowLeft size={18} /> Back to checkout</Link>
         <div className="topbar-kicker"><Flame size={14} fill="currentColor" /> Live order board</div>
       </div>

       <div className="orders-header-wrap">
         <div>
           <span className="section-kicker">BACK OF HOUSE</span>
           <h1>HOT <em>ORDERS.</em></h1>
         </div>
         <Link href="/shop" className="cta cta-primary small-cta">Build another bag <ArrowUpRight /></Link>
       </div>

       <div className="orders-stats">
         <article className="stat-card">
           <span className="stat-label">Total orders</span>
           <strong>{stats.totalOrders}</strong>
         </article>
         <article className="stat-card accent">
           <span className="stat-label">Revenue</span>
           <strong>{money(stats.totalRevenue)}</strong>
         </article>
         <article className="stat-card">
           <span className="stat-label">Avg. ticket</span>
           <strong>{money(stats.avgTicket)}</strong>
         </article>
       </div>

       {loading ? (
         <div className="orders-panel empty-panel">
           <p>Loading recent orders…</p>
         </div>
       ) : error ? (
         <div className="orders-panel empty-panel error-panel">
           <p>{error}</p>
         </div>
       ) : orders.length === 0 ? (
         <div className="orders-panel empty-panel">
           <ShoppingBag size={42} />
           <p>No orders yet. The line is quiet — for now.</p>
         </div>
       ) : (
         <div className="orders-grid">
           {orders.map((order) => (
             <article className="order-card" key={order.id}>
               <div className="order-card-header">
                 <div>
                   <span className="order-id">#{order.id}</span>
                   <h2>{order.customer.firstName} {order.customer.lastName}</h2>
                 </div>
                 <span className="status-pill">{order.status}</span>
               </div>

               <div className="order-meta">
                 <span><Truck size={15} /> {order.delivery.eta}</span>
                 <span><Wallet size={15} /> {order.payment.method} •••• {order.payment.last4}</span>
               </div>

               <div className="order-items">
                 {order.items.map((item) => (
                   <div className="order-line" key={`${order.id}-${item.id}`}>
                     <span>{item.quantity}x {item.name}</span>
                     <strong>{money(item.quantity * item.price)}</strong>
                   </div>
                 ))}
               </div>

               <div className="order-summary">
                 <div>
                   <span>Delivery</span>
                   <strong>{order.delivery.address}</strong>
                 </div>
                 <div>
                   <span>Order total</span>
                   <strong>{money(order.total)}</strong>
                 </div>
               </div>

               <div className="order-footer">
                 <span>{new Date(order.createdAt).toLocaleString()}</span>
                 <span>{order.customer.email}</span>
               </div>
             </article>
           ))}
         </div>
       )}
     </section>
   </main>
  );
}
