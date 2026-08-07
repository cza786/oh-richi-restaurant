'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '../components/CustomerLayout';
import { useCart } from '../components/CartContext';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartSubtotal,
    deliveryFee,
    orderType,
    setOrderType,
    appliedCoupon,
    appliedRedemption,
    applyCouponCode,
    removeCoupon,
    removeRedemption,
    clearCart,
  } = useCart();

  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('ASAP');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  // Card mock inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Check login session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then((data) => {
        setUser(data.user);
        setFullName(`${data.user.firstName} ${data.user.lastName}`);
        setEmail(data.user.email);
        if (data.user.phone) setPhone(data.user.phone);
        setSessionLoading(false);
      })
      .catch(() => {
        setSessionLoading(false);
      });
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (!sessionLoading && cart.length === 0) {
      router.push('/');
    }
  }, [cart, sessionLoading, router]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (!promoInput.trim()) return;

    const result = await applyCouponCode(promoInput);
    if (!result.success) {
      setPromoError(result.error || 'Invalid code');
    } else {
      setPromoInput('');
    }
  };

  const handlePlaceOrder = async () => {
    if (!fullName || !phone || !email) {
      alert('Please fill in your name, phone number, and email.');
      return;
    }

    if (orderType === 'DELIVERY' && !address) {
      alert('Please provide a delivery address.');
      return;
    }

    if (paymentMethod === 'CARD' && (!cardNumber || !cardExpiry || !cardCvc)) {
      alert('Please fill in your card details.');
      return;
    }

    setLoading(true);

    // Format items for POST payload
    const orderItemsPayload = cart.map((item) => ({
      itemId: item.itemId,
      variationId: item.variation?.id || null,
      spiceLevelId: item.spiceLevel?.id || null,
      quantity: item.quantity,
      unitPrice: item.basePrice + (item.variation?.priceDifference || 0) + (item.spiceLevel?.priceDifference || 0),
      subtotal: (item.basePrice + (item.variation?.priceDifference || 0) + (item.spiceLevel?.priceDifference || 0)) * item.quantity,
      notes: item.notes || null,
      addons: item.addons.map((a) => ({
        addonId: a.id,
        price: a.price,
      })),
    }));

    const calculatedSubtotal = cartSubtotal;
    const serviceFee = 1.50;
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : (appliedRedemption ? appliedRedemption.reward.discountAmount : 0);
    const totalAmount = Math.max(0, calculatedSubtotal + deliveryFee + serviceFee - discountAmount);

    try {
      const orderBody = {
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email,
        orderType,
        subtotal: calculatedSubtotal,
        taxAmount: 0.00,
        deliveryFee,
        discountAmount,
        totalAmount,
        deliveryAddress: orderType === 'DELIVERY' ? address : null,
        specialInstructions: `Time selected: ${deliveryTime}`,
        orderItems: orderItemsPayload,
        couponCode: appliedCoupon?.code || null,
        redemptionCode: appliedRedemption?.redemptionCode || null,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to place order.');
        setLoading(false);
        return;
      }

      // Success! Clear cart and redirect
      const pointsEarned = Math.floor(Math.max(0, calculatedSubtotal - discountAmount));
      clearCart();
      router.push(`/order-success?shortId=${data.shortId}&total=${totalAmount.toFixed(2)}&points=${pointsEarned}&payment=${paymentMethod}`);
    } catch (err) {
      console.error(err);
      alert('An error occurred during order submission.');
      setLoading(false);
    }
  };

  const serviceFee = cartSubtotal > 0 ? 1.50 : 0.00;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : (appliedRedemption ? appliedRedemption.reward.discountAmount : 0);
  const cartTotal = Math.max(0, cartSubtotal + deliveryFee + serviceFee - discount);
  const potentialPoints = Math.floor(Math.max(0, cartSubtotal - discount));

  if (sessionLoading) {
    return (
      <CustomerLayout>
        <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading checkout session...
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="richi-checkout-mobile">
        <header className="richi-flow-header">
          <button type="button" onClick={() => router.back()} aria-label="Go back">&larr;</button>
          <h1>Checkout</h1>
          <span aria-hidden="true" />
        </header>

        <div className="richi-checkout-mobile-body">
          <section className="richi-mobile-checkout-section">
            <h2>Delivery Address</h2>
            {orderType === 'DELIVERY' ? (
              <label className="richi-mobile-address-card">
                <span aria-hidden="true">&#9906;</span>
                <input
                  type="text"
                  placeholder="Enter your delivery address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  aria-label="Delivery address"
                />
              </label>
            ) : (
              <div className="richi-mobile-address-card">
                <span aria-hidden="true">&#9906;</span>
                <div><strong>Oh Richi Restaurant</strong><small>Pickup from our main location</small></div>
              </div>
            )}
          </section>

          <section className="richi-mobile-checkout-section">
            <h2>Contact Details</h2>
            {!user && <p className="richi-mobile-signin-note"><Link href="/customer/login">Sign in</Link> to earn rewards on this order.</p>}
            <div className="richi-mobile-contact-grid">
              <input type="text" placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              <input type="tel" placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <input type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </section>

          <section className="richi-mobile-checkout-section">
            <h2>Delivery Type</h2>
            <div className="richi-mobile-choice-pair">
              <button type="button" className={orderType === 'DELIVERY' ? 'active' : ''} onClick={() => setOrderType('DELIVERY')}>
                <span aria-hidden="true">&#128757;</span>
                <div><strong>Delivery</strong><small>20-30 min</small></div>
              </button>
              <button type="button" className={orderType === 'TAKEAWAY' ? 'active' : ''} onClick={() => setOrderType('TAKEAWAY')}>
                <span aria-hidden="true">&#128717;</span>
                <div><strong>Pickup</strong><small>10-15 min</small></div>
              </button>
            </div>
            <div className="richi-mobile-time-row">
              <button type="button" className={deliveryTime === 'ASAP' ? 'active' : ''} onClick={() => setDeliveryTime('ASAP')}>ASAP</button>
              <button type="button" className={deliveryTime === 'SCHEDULE' ? 'active' : ''} onClick={() => setDeliveryTime('SCHEDULE')}>Schedule</button>
              {deliveryTime === 'SCHEDULE' && <input type="time" defaultValue="18:30" aria-label="Scheduled order time" />}
            </div>
          </section>

          <section className="richi-mobile-checkout-section">
            <h2>Payment Method</h2>
            <div className="richi-mobile-choice-pair">
              <button type="button" className={paymentMethod === 'CARD' ? 'active' : ''} onClick={() => setPaymentMethod('CARD')}>
                <span aria-hidden="true">&#9635;</span>
                <div><strong>Card</strong><small>{cardNumber ? 'Saved card' : 'Credit or debit'}</small></div>
              </button>
              <button type="button" className={paymentMethod === 'CASH' ? 'active' : ''} onClick={() => setPaymentMethod('CASH')}>
                <span aria-hidden="true">&#9633;</span>
                <div><strong>Cash</strong><small>On delivery</small></div>
              </button>
            </div>
            {paymentMethod === 'CARD' && (
              <div className="richi-mobile-card-fields">
                <input type="text" placeholder="Card number" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} maxLength={19} />
                <input type="text" placeholder="MM/YY" value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value)} maxLength={5} />
                <input type="password" placeholder="CVC" value={cardCvc} onChange={(event) => setCardCvc(event.target.value)} maxLength={3} />
              </div>
            )}
          </section>

          <section className="richi-mobile-checkout-section richi-mobile-order-review">
            <h2>Your Order</h2>
            <div className="richi-mobile-review-items">
              {cart.map((item) => {
                const unitPrice = item.basePrice
                  + (item.variation?.priceDifference || 0)
                  + (item.spiceLevel?.priceDifference || 0)
                  + item.addons.reduce((sum, addon) => sum + addon.price, 0);
                return (
                  <article key={item.id}>
                    <img src={item.imageUrl || '/burger_hero.png'} alt="" />
                    <div><strong>{item.quantity}x {item.name}</strong><small>{item.variation?.name || 'Classic recipe'}</small></div>
                    <span>{'\u20ac'}{(unitPrice * item.quantity).toFixed(2)}</span>
                  </article>
                );
              })}
            </div>
            <div className="richi-mobile-checkout-total">
              <div><span>Subtotal</span><strong>{'\u20ac'}{cartSubtotal.toFixed(2)}</strong></div>
              {orderType === 'DELIVERY' && <div><span>Delivery Fee</span><strong>{'\u20ac'}{deliveryFee.toFixed(2)}</strong></div>}
              {serviceFee > 0 && <div><span>Service Fee</span><strong>{'\u20ac'}{serviceFee.toFixed(2)}</strong></div>}
              {discount > 0 && <div className="discount"><span>Discount</span><strong>-{'\u20ac'}{discount.toFixed(2)}</strong></div>}
              <div className="total"><span>Total</span><strong>{'\u20ac'}{cartTotal.toFixed(2)}</strong></div>
            </div>
          </section>
        </div>

        <footer className="richi-mobile-place-order">
          <button type="button" onClick={handlePlaceOrder} disabled={loading}>
            {loading ? 'Placing Order...' : 'Place Order'} <strong>{'\u20ac'}{cartTotal.toFixed(2)}</strong>
          </button>
        </footer>
      </div>

      <div className="richi-checkout-desktop" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.5rem', marginBottom: '24px' }}>Checkout</h1>

        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: FORM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. Order Type Toggles */}
            <div className="auth-card" style={{ maxWidth: '100%', padding: '24px' }}>
              <h3 className="heading-bebas" style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--accent-gold)' }}>1. Order Type</h3>
              <div className="order-type-tabs" style={{ display: 'flex', gap: '8px', padding: '4px' }}>
                <button className={`order-type-tab ${orderType === 'DELIVERY' ? 'active' : ''}`} onClick={() => setOrderType('DELIVERY')}>
                  Delivery
                </button>
                <button className={`order-type-tab ${orderType === 'TAKEAWAY' ? 'active' : ''}`} onClick={() => setOrderType('TAKEAWAY')}>
                  Takeaway
                </button>
              </div>

              {/* Time selection */}
              <div style={{ marginTop: '20px' }}>
                <label className="form-label">Delivery / Pick-up Time</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button className={`spice-btn ${deliveryTime === 'ASAP' ? 'active' : ''}`} onClick={() => setDeliveryTime('ASAP')} style={{ flex: 1, padding: '12px' }}>
                    ⚡ ASAP (30-45 min)
                  </button>
                  <button className={`spice-btn ${deliveryTime === 'SCHEDULE' ? 'active' : ''}`} onClick={() => setDeliveryTime('SCHEDULE')} style={{ flex: 1, padding: '12px' }}>
                    📅 Schedule Order
                  </button>
                </div>
                {deliveryTime === 'SCHEDULE' && (
                  <input
                    type="time"
                    className="form-input"
                    defaultValue="18:30"
                    style={{ marginTop: '12px' }}
                  />
                )}
              </div>
            </div>

            {/* 2. Customer Details */}
            <div className="auth-card" style={{ maxWidth: '100%', padding: '24px' }}>
              <h3 className="heading-bebas" style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--accent-gold)' }}>2. Contact Details</h3>
              {!user && (
                <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'rgba(214, 168, 79, 0.05)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(214, 168, 79, 0.15)' }}>
                  Tip: <Link href="/customer/login" style={{ color: 'var(--accent-gold)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link> to checkout automatically and earn loyalty rewards!
                </div>
              )}
              <div className="form-group">
                <label className="form-label" htmlFor="full-name">Full Name</label>
                <input
                  id="full-name"
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +1 555-123-4567"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="e.g. alex@gmail.com"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {orderType === 'DELIVERY' && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label" htmlFor="address">Delivery Address</label>
                  <input
                    id="address"
                    type="text"
                    placeholder="e.g. 123 Foodie Street, Apt 4B, Rome"
                    className="form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="auth-card" style={{ maxWidth: '100%', padding: '24px' }}>
              <h3 className="heading-bebas" style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--accent-gold)' }}>3. Payment Method</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <button className={`spice-btn ${paymentMethod === 'CARD' ? 'active' : ''}`} onClick={() => setPaymentMethod('CARD')} style={{ padding: '12px' }}>
                  💳 Credit/Debit Card
                </button>
                <button className={`spice-btn ${paymentMethod === 'APPLE_PAY' ? 'active' : ''}`} onClick={() => setPaymentMethod('APPLE_PAY')} style={{ padding: '12px' }}>
                  🍎 Apple Pay
                </button>
                <button className={`spice-btn ${paymentMethod === 'PAYPAL' ? 'active' : ''}`} onClick={() => setPaymentMethod('PAYPAL')} style={{ padding: '12px' }}>
                  🅿️ PayPal
                </button>
                <button className={`spice-btn ${paymentMethod === 'GOOGLE_PAY' ? 'active' : ''}`} onClick={() => setPaymentMethod('GOOGLE_PAY')} style={{ padding: '12px' }}>
                  🤖 Google Pay
                </button>
              </div>

              {paymentMethod === 'CARD' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      className="form-input"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="form-input"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength={5}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVC</label>
                      <input
                        type="password"
                        placeholder="123"
                        className="form-input"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod !== 'CARD' && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                  Checkout redirect will be initialized mockingly upon placing order.
                </p>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="auth-card" style={{ maxWidth: '100%', padding: '28px', position: 'sticky', top: '96px' }}>
            <h3 className="heading-bebas" style={{ fontSize: '1.3rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Your Order</h3>
            
            {/* Item list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '280px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
              {cart.map((item) => {
                const itemSinglePrice = item.basePrice + (item.variation?.priceDifference || 0) + (item.spiceLevel?.priceDifference || 0) + item.addons.reduce((s, a) => s + a.price, 0);
                return (
                  <div key={item.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.quantity}x</span> {item.name}
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                        {item.variation && `${item.variation.name}`}
                        {item.spiceLevel && ` • Spice: ${item.spiceLevel.name}`}
                      </p>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      €{(itemSinglePrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '20px' }}>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>€{cartSubtotal.toFixed(2)}</span>
              </div>
              {orderType === 'DELIVERY' && (
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>€{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Service Fee</span>
                <span>€{serviceFee.toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <div className="summary-row discount-row" style={{ color: 'var(--success)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Coupon ({appliedCoupon.code})
                    <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                  </span>
                  <span>- €{appliedCoupon.discountAmount.toFixed(2)}</span>
                </div>
              )}

              {appliedRedemption && (
                <div className="summary-row discount-row" style={{ color: 'var(--success)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Reward ({appliedRedemption.reward.name})
                    <button onClick={removeRedemption} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
                  </span>
                  <span>- €{appliedRedemption.reward.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="summary-row total-row" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                <span>Total</span>
                <span>€{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Promo code field */}
            <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Promo code"
                className="form-input"
                style={{ height: '38px', fontSize: '0.85rem' }}
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '0.85rem' }}>
                Apply
              </button>
            </form>
            {promoError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '-12px', marginBottom: '16px' }}>{promoError}</p>}

            {/* Loyalty points info */}
            {user && (
              <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', border: '1px dashed rgba(34, 197, 94, 0.2)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <span style={{ fontSize: '1.4rem' }}>🎉</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  You will earn <strong>{potentialPoints} points</strong> with this order!
                </span>
              </div>
            )}

            <button
              className="btn btn-primary pulse-glow"
              onClick={handlePlaceOrder}
              disabled={loading}
              style={{ height: '48px', fontSize: '1rem', fontWeight: 600 }}
            >
              {loading ? 'Processing...' : `Place Order • €${cartTotal.toFixed(2)}`}
            </button>
          </div>

        </div>
      </div>
    </CustomerLayout>
  );
}
