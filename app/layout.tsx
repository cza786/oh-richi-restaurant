import type { Metadata } from 'next';
import './globals.css';
import './customer.css';
import { CartProvider } from './components/CartContext';

export const metadata: Metadata = {
  title: 'Oh Richi | Crafted Fresh Burgers',
  description: 'Order flame-grilled burgers, fresh sides and drinks from Oh Richi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
