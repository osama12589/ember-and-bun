import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Ember & Bun — All Smash. No Brakes.', description: 'Crispy edges. Melty cheese. A little attitude. Meet the Ember Double, our signature gourmet smash burger.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body className="antialiased">{children}</body></html>; }
