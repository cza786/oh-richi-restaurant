'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from './CartContext';
import MyDetailModal from './MyDetailModal';

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
    orderType, setOrderType, deliveryAddress, setDeliveryAddress,
    selectedBranch, setSelectedBranch, appliedCoupon,
    appliedRedemption, removeCoupon, removeRedemption, applyCouponCode,
  } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('');
  const [user, setUser] = useState<any | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  // Location Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'DELIVERY' | 'TAKEAWAY'>('DELIVERY');
  const [tempAddress, setTempAddress] = useState('');
  const [tempBranch, setTempBranch] = useState('');

  const openLocationModal = () => {
    setModalTab(orderType);
    setTempAddress(deliveryAddress || '221B Baker Street, London');
    setTempBranch(selectedBranch || 'Oh Richi Central, Via Nazionale 45');
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderType(modalTab);
    if (modalTab === 'DELIVERY') {
      if (tempAddress.trim()) setDeliveryAddress(tempAddress.trim());
    } else if (modalTab === 'TAKEAWAY') {
      if (tempBranch.trim()) setSelectedBranch(tempBranch.trim());
    }
    setIsLocationModalOpen(false);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const safePath = mounted ? (pathname || '') : '';
  const focusedFlow = safePath === '/checkout'
    || safePath === '/order-success'
    || safePath.startsWith('/track-order');

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

          <nav className="richi-desktop-nav" aria-label="Main navigation" suppressHydrationWarning>
            <Link href="/menu" className={mounted && safePath.startsWith('/menu') ? 'active' : ''}>MENU</Link>
            <Link href="/promotions" className={mounted && safePath === '/promotions' ? 'active' : ''}>PROMOTIONS</Link>
            <Link href="/rewards" className={mounted && safePath === '/rewards' ? 'active' : ''}>REWARDS</Link>
            <Link href="/track-order" className={mounted && safePath.startsWith('/track-order') ? 'active' : ''}>TRACK ORDER</Link>
            <Link href="/about" className={mounted && safePath === '/about' ? 'active' : ''}>ABOUT US</Link>
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
              <div className="richi-profile-wrap" style={{ position: 'relative' }}>
                <button
                  type="button"
                  aria-label="Open account menu"
                  aria-expanded={profileOpen}
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    padding: 0,
                    border: '2px solid #ff9500',
                    backgroundColor: '#121218',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(255, 149, 0, 0.4)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <img
                    src={user.avatarUrl || user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || 'User')}+${encodeURIComponent(user.lastName || '')}&background=ff9500&color=fff&bold=true`}
                    alt={user.firstName || 'Profile'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </button>
                {profileOpen && (
                  <>
                    <button className="richi-dropdown-shade" type="button" aria-label="Close account menu" onClick={() => setProfileOpen(false)} />
                    <div className="richi-profile-menu" style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      backgroundColor: '#121218',
                      border: '1px solid #282838',
                      borderRadius: '16px',
                      padding: '16px',
                      minWidth: '220px',
                      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7)',
                      zIndex: 9999,
                    }}>
                      <div style={{ paddingBottom: '12px', borderBottom: '1px solid #282838', marginBottom: '10px' }}>
                        <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.9rem' }}>{user.firstName} {user.lastName}</strong>
                        <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{user.email}</small>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setProfileOpen(false); setIsDetailModalOpen(true); }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          color: '#ff9500',
                          padding: '8px 0',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        👤 My Detail Profile
                      </button>
                      <Link href="/account" onClick={() => setProfileOpen(false)} style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', padding: '8px 0', fontSize: '0.88rem', fontWeight: 600 }}>My account</Link>
                      <Link href="/rewards" onClick={() => setProfileOpen(false)} style={{ display: 'block', color: '#cbd5e1', textDecoration: 'none', padding: '8px 0', fontSize: '0.88rem', fontWeight: 600 }}>Rewards balance</Link>
                      <button
                        type="button"
                        onClick={logout}
                        style={{
                          width: '100%',
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#1c1c28',
                          border: '1px solid #3a3a4c',
                          color: '#ff3b30',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/customer/login" className="richi-login-link">Log in</Link>
            )}

            <button
              className="richi-cart-trigger"
              type="button"
              aria-label={`Open cart with ${cartCount} items`}
              onClick={() => setCartOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 16px',
                height: '40px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(255, 140, 0, 0.4)',
              }}
            >
              <Icon name="bag" />
              <span className="richi-cart-label" style={{ color: '#ffffff', fontWeight: 800 }}>Cart</span>
              {cartCount > 0 && <b style={{ backgroundColor: '#ffffff', color: '#ff7000', borderRadius: '10px', padding: '2px 7px', fontSize: '0.75rem', fontWeight: 900 }}>{cartCount}</b>}
            </button>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <nav className="richi-mobile-menu-panel" aria-label="Customer shortcuts">
          <Link href="/menu">Menu</Link>
          <Link href="/promotions">Promotions</Link>
          <Link href="/rewards">Rewards</Link>
          <Link href="/track-order">Track Order</Link>
          <Link href="/about">About Us</Link>
        </nav>
      )}
      <main className="richi-customer-main">{children}</main>
      <nav className="richi-mobile-tabs" aria-label="Mobile navigation" suppressHydrationWarning>
        <Link href="/" className={mounted && safePath === '/' ? 'active' : ''}><Icon name="home" /><span>Home</span></Link>
        <Link href="/menu" className={mounted && safePath.startsWith('/menu') ? 'active' : ''}><Icon name="grid" /><span>Menu</span></Link>
        <Link href="/promotions" className={mounted && safePath === '/promotions' ? 'active' : ''}><Icon name="gift" /><span>Deals</span></Link>
        <Link href="/track-order" className={mounted && safePath.startsWith('/track-order') ? 'active' : ''}><Icon name="orders" /><span>Orders</span></Link>
        <Link href={user ? '/account' : '/customer/login'} className={mounted && safePath === '/account' ? 'active' : ''}><Icon name="user" /><span>Profile</span></Link>
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
              <div>
                <small>
                  {orderType === 'DELIVERY' ? 'Deliver to' : 'Pickup from'}
                </small>
                <strong>
                  {orderType === 'DELIVERY' ? (deliveryAddress || '221B Baker Street, London') : (selectedBranch || 'Oh Richi Central')}
                </strong>
              </div>
              <button type="button" onClick={openLocationModal}>Change</button>
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

      {/* Location Selector Modal */}
      {isLocationModalOpen && (
        <>
          <div 
            onClick={() => setIsLocationModalOpen(false)} 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 99998,
            }}
          />
          <div 
            role="dialog" 
            aria-modal="true" 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '480px',
              backgroundColor: '#16161e',
              border: '1px solid var(--border-color, #2a2a3c)',
              borderRadius: '16px',
              padding: '24px',
              zIndex: 99999,
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Select Location & Service</h3>
              <button 
                type="button" 
                onClick={() => setIsLocationModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', background: '#0d0d12', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
              {(['DELIVERY', 'TAKEAWAY'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setModalTab(tab)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: modalTab === tab ? '#ff9500' : 'transparent',
                    color: modalTab === tab ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab === 'DELIVERY' ? 'Delivery' : 'Takeaway'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveLocation}>
              {modalTab === 'DELIVERY' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    required
                    value={tempAddress}
                    onChange={(e) => setTempAddress(e.target.value)}
                    placeholder="Enter street, house number, city"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0d0d12',
                      border: '1px solid #2a2a3c',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      marginBottom: '16px',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <small style={{ color: '#94a3b8', width: '100%', marginBottom: '4px' }}>Quick Select:</small>
                    {[
                      '221B Baker Street, London',
                      'Via Nazionale 45, Rome',
                      'Piazza Navona 8, Rome',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTempAddress(preset)}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          backgroundColor: '#1e1e2d',
                          border: tempAddress === preset ? '1px solid #ff9500' : '1px solid #2a2a3c',
                          color: tempAddress === preset ? '#ff9500' : '#cbd5e1',
                          cursor: 'pointer',
                        }}
                      >
                        {preset.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modalTab === 'TAKEAWAY' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Select Pickup Branch
                  </label>
                  <select
                    value={tempBranch}
                    onChange={(e) => setTempBranch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#0d0d12',
                      border: '1px solid #2a2a3c',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      marginBottom: '20px',
                    }}
                  >
                    <option value="Oh Richi Central, Via Nazionale 45">Oh Richi Central — Via Nazionale 45</option>
                    <option value="Oh Richi North, Corso Italia 12">Oh Richi North — Corso Italia 12</option>
                    <option value="Oh Richi Airport, Fiumicino T3">Oh Richi Airport — Fiumicino T3</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
                }}
              >
                Save Location
              </button>
            </form>
          </div>
        </>
      )}

      {/* "My Detail" Profile Popup Modal */}
      <MyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={user}
        onSaveUser={(updatedUser) => {
          setUser((prev: any) => ({ ...prev, ...updatedUser }));
        }}
      />
    </div>
  );
}
