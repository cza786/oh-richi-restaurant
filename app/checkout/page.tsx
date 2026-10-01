'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '../components/CustomerLayout';
import { useCart } from '../components/CartContext';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    restaurantId,
    cartSubtotal,
    deliveryFee,
    deliveryAddress,
    setDeliveryAddress,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddressState] = useState(deliveryAddress || '');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');

  // Keep address synchronized with context
  const setAddress = (val: string) => {
    setAddressState(val);
    setDeliveryAddress(val);
  };

  const totalAmount = cartSubtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    const resolvedRestaurantId = restaurantId || cart[0]?.restaurantId;
    if (cart.length === 0 || !resolvedRestaurantId) {
      alert('Your cart is empty.');
      return;
    }

    if (!fullName || !phone) {
      alert('Please fill in your name and phone number.');
      return;
    }

    if (!address) {
      alert('Please provide a delivery address.');
      return;
    }

    setLoading(true);

    const orderItemsPayload = cart.map((item) => ({
      productId: item.itemId,
      quantity: item.quantity,
      optionItemIds: item.selectedOptions.map((option) => option.optionItemId),
    }));

    try {
      const orderBody = {
        restaurantId: resolvedRestaurantId,
        customer: {
          name: fullName,
          phone,
          whatsapp: whatsapp || null,
          address: [address, city, postalCode].filter(Boolean).join(', '),
        },
        paymentMethod,
        customerNote: orderNotes || null,
        orderItems: orderItemsPayload,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const data = await response.json();
      clearCart();
      router.push(`/order-success?orderId=${encodeURIComponent(data.orderNumber || data.shortId)}&total=${encodeURIComponent(data.totalAmount)}`);
    } catch (err: any) {
      alert(err.message || 'An error occurred while placing your order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '120px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <Link
            href="/stores"
            style={{
              fontSize: '1.2rem',
              fontWeight: 900,
              color: '#0f172a',
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            ←
          </Link>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Checkout</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* DELIVERY INFORMATION CARD (MATCHING SCREEN 5) */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 18px 0' }}>
              Delivery Information
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>👤 Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>📞 Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>WhatsApp (Optional)</label>
              <input className="form-input" type="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>📍 Delivery Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>🏙️ City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>📮 Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>📝 Order Notes (Optional)</label>
              <input
                type="text"
                placeholder="Any special instructions..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Payment method</label>
              <select className="form-input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as 'cod' | 'online')}>
                <option value="cod">Cash on delivery</option>
                <option value="online">Online payment</option>
              </select>
              {paymentMethod === 'online' && <small style={{ color: '#64748b' }}>Payment remains pending until a payment provider confirms it.</small>}
            </div>
          </section>

          {/* ORDER SUMMARY CARD (MATCHING SCREEN 5) */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Order Summary
              </h2>
              <Link href="/stores" style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F95700', textDecoration: 'none' }}>
                Edit
              </Link>
            </div>

            {/* Item Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={item.imageUrl || '/burger_hero.png'}
                      alt={item.name}
                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '14px' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/burger_hero.png'; }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#0f172a' }}>{item.name}</h4>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                        {item.quantity} x ${Number(item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                    <strong style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                      ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </strong>
                  </div>
                ))
              ) : <p style={{ margin: 0, color: '#64748b' }}>Your cart is empty.</p>}
            </div>

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>
                <span>Subtotal</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: '#0f172a', fontWeight: 900, paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <span>Total</span>
                <span style={{ color: '#F95700' }}>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </section>

        </div>

        {/* BOTTOM FIXED PLACE ORDER ACTION BUTTON */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '14px 24px',
            zIndex: 100,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={loading || cart.length === 0}
              style={{
                width: '100%',
                backgroundColor: '#F95700',
                color: '#ffffff',
                border: 'none',
                borderRadius: '20px',
                padding: '16px',
                fontWeight: 900,
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(249, 87, 0, 0.3)',
              }}
            >
              <span>🛍️ Place Order</span>
              <span>•</span>
              <span>${totalAmount.toFixed(2)}</span>
            </button>
          </div>
        </div>

      </div>
    </CustomerLayout>
  );
}
