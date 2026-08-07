'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from './CartContext';

type IconName = 'search' | 'user' | 'bag' | 'home' | 'orders' | 'gift' | 'close' | 'pin' | 'plus' | 'minus' | 'menu' | 'grid' | 'back';

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    bag: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
    orders: <><path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    gift: <><path d="M3 10h18v11H3zM2 6h20v4H2zM12 6v15" /><path d="M12 6H8.5a2.5 2.5 0 1 1 0-5C11 1 12 6 12 6Zm0 0h3.5a2.5 2.5 0 1 0 0-5C13 1 12 6 12 6Z" /></>,
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
    orderType, setOrderType, appliedCoupon, appliedRedemption, removeCoupon,
    removeRedemption, applyCouponCode,
  } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('');
  const [user, setUser] = useState<any | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => active && setUser(data.user))
      .catch(() => active && setUser(null));
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash);
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  const logout = async () => {
    await fetch('/api/auth/me', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setProfileOpen(false);
    router.push('/');
    router.refresh();
  };

  const applyPromo = async (event: React.FormEvent) => {
    event.preventDefault();
    setPromoError('');
    if (!promoCode.trim()) return;
    const result = await applyCouponCode(promoCode.trim());
    if (result.success) setPromoCode('');
    else setPromoError(result.error || 'That promo code is not valid.');
  };

  const serviceFee = cartSubtotal > 0 ? 1.5 : 0;
  const discount = appliedCoupon?.discountAmount || appliedRedemption?.reward.discountAmount || 0;
  const total = Math.max(0, cartSubtotal + deliveryFee + serviceFee - discount);
  const itemPrice = (item: typeof cart[number]) => item.basePrice
    + (item.variation?.priceDifference || 0)
    + (item.spiceLevel?.priceDifference || 0)
    + item.addons.reduce((sum, addon) => sum + addon.price, 0);
  const focusedFlow = pathname === '/checkout'
    || pathname === '/order-success'
    || pathname.startsWith('/track-order');

  return (
    <div className={'customer-shell richi-customer-shell' + (focusedFlow ? ' richi-focused-flow' : '')}>
      <header className="richi-header">
        <div className="richi-nav-wrap">
          <button
            className="richi-mobile-menu-trigger"
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <Icon name="menu" />
          </button>
          <Link href="/" className="richi-logo" aria-label="Oh Richi home">
            Oh<span>Richi</span><i>.</i>
          </Link>

          <nav className="richi-desktop-nav" aria-label="Main navigation">
            <Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
            <Link href="/#menu">Menu</Link>
            <Link href="/coupons" className={pathname === '/coupons' ? 'active' : ''}>Deals</Link>
            <Link href="/rewards" className={pathname === '/rewards' ? 'active' : ''}>Rewards</Link>
            <Link href="/track-order" className={pathname.startsWith('/track-order') ? 'active' : ''}>Track order</Link>
          </nav>

          <div className="richi-nav-actions">
            <button
              className="richi-nav-icon richi-search-trigger"
              type="button"
              aria-label="Search menu"
              onClick={() => {
                router.push('/#menu');
                window.setTimeout(() => document.querySelector<HTMLInputElement>('.richi-search-box input')?.focus(), 400);
              }}
            ><Icon name="search" /></button>

            {user ? (
              <div className="richi-profile-wrap">
                <button className="richi-nav-icon" type="button" aria-label="Open account menu" aria-expanded={profileOpen} onClick={() => setProfileOpen(!profileOpen)}>
                  <span className="richi-user-initial">{user.firstName?.[0] || 'R'}</span>
                </button>
                {profileOpen && (
                  <>
                    <button className="richi-dropdown-shade" type="button" aria-label="Close account menu" onClick={() => setProfileOpen(false)} />
                    <div className="richi-profile-menu">
                      <div><strong>{user.firstName} {user.lastName}</strong><small>{user.email}</small></div>
                      <Link href="/account" onClick={() => setProfileOpen(false)}>My account</Link>
                      <Link href="/rewards" onClick={() => setProfileOpen(false)}>Rewards balance</Link>
                      <button type="button" onClick={logout}>Sign out</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/customer/login" className="richi-login-link">Log in</Link>
            )}

            <button className="richi-cart-trigger" type="button" aria-label={`Open cart with ${cartCount} items`} onClick={() => setCartOpen(true)}>
              <Icon name="bag" />
              <span className="richi-cart-label">Cart</span>
              {cartCount > 0 && <b>{cartCount}</b>}
            </button>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <nav className="richi-mobile-menu-panel" aria-label="Customer shortcuts">
          <Link href="/#menu">Browse menu</Link>
          <Link href="/coupons">Deals</Link>
          <Link href="/rewards">Rewards</Link>
          <Link href="/track-order">Track an order</Link>
        </nav>
      )}
      <main className="richi-customer-main">{children}</main>
      <nav className="richi-mobile-tabs" aria-label="Mobile navigation">
        <Link href="/" className={pathname === '/' && activeHash !== '#menu' ? 'active' : ''}><Icon name="home" /><span>Home</span></Link>
        <Link href="/#menu" className={pathname === '/' && activeHash === '#menu' ? 'active' : ''}><Icon name="grid" /><span>Menu</span></Link>
        <Link href="/track-order" className={pathname.startsWith('/track-order') ? 'active' : ''}><Icon name="orders" /><span>Orders</span></Link>
        <Link href={user ? '/account' : '/customer/login'} className={pathname === '/account' ? 'active' : ''}><Icon name="user" /><span>Profile</span></Link>
      </nav>
      {cartOpen && (
        <>
          <button className="richi-cart-overlay" type="button" aria-label="Close cart" onClick={() => setCartOpen(false)} />
          <aside className="richi-cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <header className="richi-cart-head">
              <div>
                <span>{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
                <h2 id="cart-title">My Cart</h2>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart"><Icon name="back" /></button>
            </header>

            <div className="richi-delivery-card">
              <span><Icon name="pin" /></span>
              <div><small>{orderType === 'DELIVERY' ? 'Deliver to' : 'Pickup from'}</small><strong>{orderType === 'DELIVERY' ? '221B Baker Street' : 'Oh Richi, Central'}</strong></div>
              <button type="button">Change</button>
            </div>

            {cart.length === 0 ? (
              <div className="richi-empty-cart">
                <span><Icon name="bag" /></span>
                <h3>Your cart is hungry</h3>
                <p>Add one of our freshly crafted favorites to get started.</p>
                <button type="button" onClick={() => { setCartOpen(false); router.push('/#menu'); }}>Explore the menu</button>
              </div>
            ) : (
              <>
                <div className="richi-cart-items">
                  {cart.map((item) => {
                    const price = itemPrice(item);
                    return (
                      <article className="richi-cart-item" key={item.id}>
                        <div className="richi-cart-thumb">
                          <img
                            src={item.imageUrl || '/burger_hero.png'}
                            alt=""
                            onError={(event) => { event.currentTarget.src = '/burger_hero.png'; }}
                          />
                        </div>
                        <div className="richi-cart-item-copy">
                          <div className="richi-cart-item-title">
                            <div>
                              <h3>{item.name}</h3>
                              <p>{[item.variation?.name, item.spiceLevel?.name, ...item.addons.map((addon) => addon.name)].filter(Boolean).join(' · ') || 'Classic recipe'}</p>
                            </div>
                            <button type="button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>×</button>
                          </div>
                          <div className="richi-cart-item-bottom">
                            <div className="richi-cart-quantity">
                              <button type="button" onClick={() => item.quantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, -1)} aria-label="Decrease quantity"><Icon name="minus" /></button>
                              <span>{item.quantity}</span>
                              <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label="Increase quantity"><Icon name="plus" /></button>
                            </div>
                            <strong>€{(price * item.quantity).toFixed(2)}</strong>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <footer className="richi-cart-summary">
                  <div className="richi-order-tabs" role="group" aria-label="Order type">
                    <button type="button" className={orderType === 'DELIVERY' ? 'active' : ''} onClick={() => setOrderType('DELIVERY')}>Delivery</button>
                    <button type="button" className={orderType === 'TAKEAWAY' ? 'active' : ''} onClick={() => setOrderType('TAKEAWAY')}>Takeaway</button>
                  </div>

                  {!appliedCoupon && !appliedRedemption && (
                    <form className="richi-promo-form" onSubmit={applyPromo}>
                      <label htmlFor="richi-promo">Add a promo code</label>
                      <div><input id="richi-promo" value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder="Try RICHI20" /><button type="submit">Apply</button></div>
                      {promoError && <p>{promoError}</p>}
                    </form>
                  )}

                  <div className="richi-totals">
                    <div><span>Subtotal</span><strong>€{cartSubtotal.toFixed(2)}</strong></div>
                    {orderType === 'DELIVERY' && <div><span>Delivery fee</span><strong>€{deliveryFee.toFixed(2)}</strong></div>}
                    <div><span>Taxes &amp; service</span><strong>€{serviceFee.toFixed(2)}</strong></div>
                    {appliedCoupon && (
                      <div className="richi-discount"><span>Promo: {appliedCoupon.code} <button type="button" onClick={removeCoupon}>Remove</button></span><strong>−€{appliedCoupon.discountAmount.toFixed(2)}</strong></div>
                    )}
                    {appliedRedemption && (
                      <div className="richi-discount"><span>{appliedRedemption.reward.name} <button type="button" onClick={removeRedemption}>Remove</button></span><strong>−€{appliedRedemption.reward.discountAmount.toFixed(2)}</strong></div>
                    )}
                    <div className="richi-total-row"><span>Total</span><strong>€{total.toFixed(2)}</strong></div>
                  </div>

                  <button className="richi-checkout-button" type="button" onClick={() => { setCartOpen(false); router.push('/checkout'); }}>
                    <span>Checkout</span><strong>€{total.toFixed(2)}</strong>
                  </button>
                  <p className="richi-secure-note">🔒 Secure checkout · Freshness guaranteed</p>
                </footer>
              </>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
