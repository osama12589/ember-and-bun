'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {Minus,Plus,ShoppingBag,Trash2,ArrowUpRight} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {burgers,money} from '@/lib/menu';
type Bag=Record<string,number>;
type Store={bag:Bag;count:number;add:(id:string)=>void;change:(id:string,delta:number)=>void;remove:(id:string)=>void;clear:()=>void;showBag:()=>void};
const Context=createContext<Store|null>(null);
export function useBag(){const value=useContext(Context);if(!value)throw new Error('Bag provider is missing');return value;}
export default function StoreProvider({children}:{children:ReactNode}){
 const [bag,setBag]=useState<Bag>({});const [ready,setReady]=useState(false);const [open,setOpen]=useState(false);
 useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem('ember-bag-v1')||'{}');const clean:Bag={};for(const item of burgers){const n=stored?.[item.id];if(Number.isInteger(n)&&n>0)clean[item.id]=Math.min(n,20);}setBag(clean);}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem('ember-bag-v1',JSON.stringify(bag));}catch{}},[bag,ready]);
 const count=Object.values(bag).reduce((sum,n)=>sum+n,0);
 function add(id:string){const item=burgers.find(b=>b.id===id);if(!item)return;setBag(old=>({...old,[id]:Math.min((old[id]||0)+1,20)}));}
 function change(id:string,delta:number){setBag(old=>{const next={...old};const n=Math.min(20,(next[id]||0)+delta);if(n<=0)delete next[id];else next[id]=n;return next;});}
 function remove(id:string){setBag(old=>{const next={...old};delete next[id];return next;});}
 function clear(){setBag({});}
 const subtotal=burgers.reduce((sum,item)=>sum+item.price*(bag[item.id]||0),0);
 return <Context.Provider value={{bag,count,add,change,remove,clear,showBag:()=>setOpen(true)}}>{children}
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="burger-dialog bag-dialog"><span className="dialog-kicker">GOOD DECISIONS, RIGHT HERE</span><DialogTitle className="dialog-title">YOUR BAG<span className="orange-text">.</span></DialogTitle><DialogDescription className="dialog-description">{count?`${count} ${count===1?'burger':'burgers'}. A very good start.`:'A little empty. A lot of potential.'}</DialogDescription>
 {count===0?<div className="empty-bag"><ShoppingBag size={52}/><p>Your next favourite burger is waiting.</p><Link href="/shop" onClick={()=>setOpen(false)} className="cta cta-primary">Find your smash <ArrowUpRight/></Link></div>:<><div className="bag-items">{burgers.filter(item=>bag[item.id]).map(item=><article className="bag-item" key={item.id}><img src={item.image} alt="" width={100} height={100}/><div className="bag-item-copy"><strong>{item.name}</strong><span>{money(item.price)}</span><div className="quantity"><button aria-label={`Decrease ${item.name}`} onClick={()=>change(item.id,-1)}><Minus size={15}/></button><output aria-label={`${item.name} quantity`}>{bag[item.id]}</output><button aria-label={`Increase ${item.name}`} disabled={bag[item.id]>=20} onClick={()=>change(item.id,1)}><Plus size={15}/></button></div></div><button className="remove-item" aria-label={`Remove ${item.name}`} onClick={()=>remove(item.id)}><Trash2 size={18}/></button></article>)}</div><div className="bag-total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p className="checkout-note">Sample menu & prices. Review your order and continue to the secured checkout form.</p><Link href="/checkout" onClick={()=>setOpen(false)} className="cta cta-primary checkout-link">Proceed to checkout <ArrowUpRight/></Link><button className="continue-shopping" onClick={()=>setOpen(false)}>Keep browsing <ArrowUpRight size={17}/></button></>}
 </DialogContent></Dialog></Context.Provider>;
}
