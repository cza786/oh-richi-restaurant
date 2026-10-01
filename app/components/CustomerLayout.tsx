'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from './CartContext';

type IconName = 'search' | 'bag' | 'home' | 'orders' | 'close' | 'pin' | 'plus' | 'minus' | 'menu' | 'grid' | 'back';

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bag: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
    orders: <><path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    back: <path d="m15 18-6-6 6-6" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    cart, updateQuantity, removeFromCart, cartCount, cartSubtotal, deliveryFee,
    deliveryAddress, setDeliveryAddress,
  } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationValue, setLocationValue] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => data?.logoUrl && setLogoUrl(data.logoUrl))
      .catch(() => undefined);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!cartOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setCartOpen(false);
    window.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', close);
    };
  }, [cartOpen]);

  const openLocation = () => {
    setLocationValue(deliveryAddress);
    setLocationOpen(true);
  };

  const saveLocation = (event: React.FormEvent) => {
    event.preventDefault();
    const value = locationValue.trim();
    if (!value) return;
    setDeliveryAddress(value);
    setLocationOpen(false);
  };

  const total = cartSubtotal + deliveryFee;
  const safePath = pathname || '';
  const focusedFlow = safePath === '/checkout' || safePath === '/order-success' || safePath.startsWith('/track-order');

  return (
    <div className={'customer-shell richi-customer-shell' + (focusedFlow ? ' richi-focused-flow' : '')}>
      <header className="richi-header">
        <div className="richi-nav-wrap">
          <button className="richi-mobile-menu-trigger" type="button" aria-label="Open navigation" onClick={() => setMobileMenuOpen((open) => !open)}><Icon name="menu" /></button>
          <Link href="/" className="richi-logo-wrap" aria-label="Door2Door home">
            {logoUrl ? <img src={logoUrl} alt="Restaurant logo" /> : <span className="d2d-header-brand"><img src="/door2door_logo.jpg" alt="Door2Door" /><span><strong>Door<span>2</span>Door</strong><small>Your Parcel · Our Priority</small></span></span>}
          </Link>
          <nav className="richi-desktop-nav" aria-label="Main navigation">
            <Link href="/" className={safePath === '/' ? 'active' : ''}>HOME</Link>
            <Link href="/stores" className={safePath.startsWith('/stores') || safePath.startsWith('/restaurants') ? 'active' : ''}>STORES</Link>
            <Link href="/track-order" className={safePath.startsWith('/track-order') ? 'active' : ''}>TRACK ORDER</Link>
            <button type="button" className={cartOpen ? 'active' : ''} onClick={() => setCartOpen(true)}>CART{cartCount > 0 ? ` (${cartCount})` : ''}</button>
          </nav>
          <div className="richi-nav-actions">
            <button className="richi-nav-icon richi-search-trigger" type="button" aria-label="Search menu" onClick={() => router.push('/stores')}><Icon name="search" /></button>
            <button className="richi-cart-trigger" type="button" aria-label={`Open cart with ${cartCount} items`} onClick={() => setCartOpen(true)}><Icon name="bag" /><span className="richi-cart-label">Cart</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && <nav className="richi-mobile-menu-panel" aria-label="Customer shortcuts"><Link href="/stores">Stores</Link><Link href="/track-order">Track Order</Link><Link href="/about">About Us</Link></nav>}
      <main className="richi-customer-main">{children}</main>

      <nav className="richi-mobile-tabs" aria-label="Mobile navigation">
        <Link href="/" className={safePath === '/' ? 'active' : ''}><Icon name="home" /><span>Home</span></Link>
        <Link href="/stores" className={safePath.startsWith('/stores') || safePath.startsWith('/restaurants') ? 'active' : ''}><Icon name="grid" /><span>Stores</span></Link>
        <button type="button" onClick={() => setCartOpen(true)}><span className="richi-mobile-bag"><Icon name="bag" />{cartCount > 0 && <b>{cartCount}</b>}</span><span>Cart</span></button>
        <Link href="/track-order" className={safePath.startsWith('/track-order') ? 'active' : ''}><Icon name="orders" /><span>Track</span></Link>
      </nav>

      {cartOpen && <>
        <button className="richi-cart-overlay" type="button" aria-label="Close cart" onClick={() => setCartOpen(false)} />
        <aside className="richi-cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <header className="richi-cart-head"><div><span>{cartCount} {cartCount === 1 ? 'item' : 'items'}</span><h2 id="cart-title">My Cart</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart"><Icon name="back" /></button></header>
          <div className="richi-delivery-card"><span><Icon name="pin" /></span><div><small>Deliver to</small><strong>{deliveryAddress || 'Add delivery address'}</strong></div><button type="button" onClick={openLocation}>Change</button></div>
          {cart.length === 0 ? <div className="richi-empty-cart"><span><Icon name="bag" /></span><h3>Your cart is empty</h3><p>Add a product from a store to begin.</p><button type="button" onClick={() => { setCartOpen(false); router.push('/stores'); }}>Browse stores</button></div> : <>
            <div className="richi-cart-items">{cart.map((item) => <article className="richi-cart-item" key={item.id}><div className="richi-cart-thumb"><img src={item.imageUrl || '/burger_hero.png'} alt="" onError={(event) => { event.currentTarget.src = '/burger_hero.png'; }} /></div><div className="richi-cart-item-copy"><div className="richi-cart-item-title"><div><h3>{item.name}</h3><p>{item.selectedOptions.length ? item.selectedOptions.map((option) => option.name).join(', ') : 'Standard item'}</p></div><button type="button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>×</button></div><div className="richi-cart-item-bottom"><div className="richi-cart-quantity"><button type="button" onClick={() => item.quantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, -1)}><Icon name="minus" /></button><span>{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.id, 1)}><Icon name="plus" /></button></div><strong>€{(item.unitPrice * item.quantity).toFixed(2)}</strong></div></div></article>)}</div>
            <footer className="richi-cart-summary"><div><span>Subtotal</span><strong>€{cartSubtotal.toFixed(2)}</strong></div><div><span>Delivery fee</span><strong>€{deliveryFee.toFixed(2)}</strong></div><div className="richi-total-row"><span>Total</span><strong>€{total.toFixed(2)}</strong></div><button type="button" className="richi-checkout-button" onClick={() => { setCartOpen(false); router.push('/checkout'); }}>Continue to checkout</button></footer>
          </>}
        </aside>
      </>}

      {locationOpen && <div className="richi-location-modal" role="dialog" aria-modal="true"><button className="richi-cart-overlay" type="button" aria-label="Close" onClick={() => setLocationOpen(false)} /><form onSubmit={saveLocation}><button type="button" aria-label="Close" onClick={() => setLocationOpen(false)}><Icon name="close" /></button><h2>Delivery address</h2><label>Address<input value={locationValue} onChange={(event) => setLocationValue(event.target.value)} required /></label><button type="submit">Save</button></form></div>}
    </div>
  );
}
