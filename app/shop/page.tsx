import type {Metadata} from 'next';
import Shop from '@/components/shop';
export const metadata:Metadata={title:'Shop Burgers — Ember & Bun',description:'Find your next obsession. Beef, crispy chicken and vegetarian burgers at Ember & Bun.'};
export default function ShopPage(){return <Shop/>;}
