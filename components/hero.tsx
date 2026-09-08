'use client';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowRight, Flame, Plus, Clock3 } from 'lucide-react';
export default function Hero() {
 const router=useRouter();
 const reduce=useReducedMotion();
 const mx=useMotionValue(0), my=useMotionValue(0);
 const x=useSpring(mx,{stiffness:65,damping:25}),y=useSpring(my,{stiffness:65,damping:25});
 function open(panel:string) { router.push(panel==='recipe' ? '/#recipe' : '/shop'); }
 return <div className="site-shell hero-shell">    <section id="hero" className="hero" aria-labelledby="hero-title" onPointerMove={e => { if (reduce || e.pointerType !== 'mouse') return; const r=e.currentTarget.getBoundingClientRect(); mx.set((e.clientX-r.left-r.width/2)*.017); my.set((e.clientY-r.top-r.height/2)*.017); }} onPointerLeave={() => { mx.set(0); my.set(0); }}>
      <motion.div className="hero-copy" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75, delay: .12 }}>
        <div className="eyebrow"><span/> GOOD FOOD. ZERO FILTER.</div>
        <h1 id="hero-title"><span>ALL SMASH.</span><span>NO <em>BRAKES.</em></span></h1>
        <p className="hero-description">Crispy edges. Melty cheese. A little attitude.<br className="desktop-break"/> Your new favourite burger has entered the chat.</p>
        <div className="hero-actions"><button className="cta cta-primary" onClick={() => open('order')}>Order a smash <ArrowUpRight/></button><button className="cta cta-secondary" onClick={() => open('menu')}>Meet the burger <ArrowUpRight/></button></div>
        <div className="hero-proof"><span className="proof-mark"><Flame size={23}/></span><div><strong>Big on flavour. Never on fuss.</strong><span>Double smashed · Fresh off the griddle</span></div></div>
      </motion.div>
      <div className="food-stage">
        <div className="orbit" aria-hidden="true"/>
        <span className="vertical-caption" aria-hidden="true">A LITTLE MESS IS PART OF THE MAGIC.</span>
        <motion.div className="burger-art" style={reduce ? undefined : { x, y }} initial={reduce ? false : { opacity: 0, rotate: 5, scale: .94 }} animate={{ opacity: 1, rotate: -7, scale: 1 }} transition={{ duration: .9, delay: .2 }}><img className="hero-burger" src="/smash-burger.png" alt="Double smash burger with crisp beef patties, melted cheese, pickles and house sauce in a sesame brioche bun" width={1254} height={1254} fetchPriority="high"/></motion.div>
        <motion.div className="fresh-card" initial={reduce ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .65, duration: .7 }}><span className="clock-icon"><Clock3 size={22}/></span><div><span>Off the griddle.</span><strong>Into your hands.</strong><small><span/> Always made to order</small></div></motion.div>
        <div className="seal" aria-label="100 percent smash, zero shortcuts"><span>ZERO SHORTCUTS</span><Flame fill="currentColor" size={26}/><strong>100% SMASH</strong></div>
        <motion.button className="product-card" onClick={() => open('menu')} initial={reduce ? false : { opacity: 0, y: 30, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: -5 }} whileHover={reduce ? undefined : { rotate: -2, y: -6 }} transition={{ duration: .5 }}><div className="product-image"><span className="card-tag">THE HOUSE FAVOURITE</span><img src="/smash-burger.png" alt="" width={180} height={180}/></div><div className="product-details"><span><strong>The Ember Double</strong><small>Two patties. One obsession.</small></span><span className="card-plus"><Plus size={23}/></span></div></motion.button>
        <div className="hand-note" aria-hidden="true">your hands will get messy.<svg viewBox="0 0 100 45" fill="none"><path d="M4 6 Q65 0 83 34 M65 29 L85 36 L91 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
      </div>
    </section>
    <div className="hero-bottom"><span>COME HUNGRY. LEAVE HAPPY.</span><span className="bottom-middle">SMALL BATCHES. <Flame size={15} fill="currentColor"/> BIG BURGER ENERGY.</span><button onClick={() => open('recipe')}>The good stuff, inside <ArrowRight size={17}/></button></div>
</div>;
}
