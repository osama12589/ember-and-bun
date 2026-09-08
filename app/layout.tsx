import type { Metadata } from 'next';
import StoreProvider from '@/components/store-provider';
import {Header,Footer} from '@/components/brand-site';
import './globals.css';
export const metadata: Metadata = { title: 'Ember & Bun — All Smash. No Brakes.', description: 'Crispy edges. Melty cheese. A little attitude. Find your next favourite burger at Ember & Bun.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body id="top" className="antialiased"><StoreProvider><Header/>{children}<Footer/></StoreProvider></body></html>; }
