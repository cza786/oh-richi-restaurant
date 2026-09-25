'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
    orderType,
    setOrderType,
    deliveryAddress,
    setDeliveryAddress,
    selectedBranch,
    appliedCoupon,
    appliedRedemption,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);

  // Form Fields matching Screen 5
  const [fullName, setFullName] = useState('John Doe');
  const [phone, setPhone] = useState('+1 234 567 8900');
  const [address, setAddressState] = useState(deliveryAddress || '123 Main Street, New York, NY 10001');
  const [city, setCity] = useState('New York');
  const [postalCode, setPostalCode] = useState('10001');
  const [orderNotes, setOrderNotes] = useState('');

  // Keep address synchronized with context
  const setAddress = (val: string) => {
    setAddressState(val);
    setDeliveryAddress(val);
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : (appliedRedemption ? appliedRedemption.reward.discountAmount : 0);
  const totalAmount = Math.max(0, cartSubtotal + deliveryFee - discountAmount);

  const handlePlaceOrder = async () => {
    if (!fullName || !phone) {
      alert('Please fill in your name and phone number.');
      return;
    }

    if (orderType === 'DELIVERY' && !address) {
      alert('Please provide a delivery address.');
      return;
    }

    setLoading(true);

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

    try {
      const orderBody = {
        restaurantId: restaurantId || cart[0]?.restaurantId || 'd3b07384-d113-4e4e-862d-0b32525164d1',
        customerName: fullName,
        customerPhone: phone,
        customerEmail: 'john@example.com',
        orderType,
        subtotal: cartSubtotal,
        taxAmount: 0.00,
        deliveryFee,
        discountAmount,
        totalAmount,
        deliveryAddress: `${address}, ${city} ${postalCode}`,
        specialInstructions: orderNotes || null,
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
      router.push(`/order-success?orderId=${data.shortId || data.id}`);
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>📍 Delivery Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
                        {item.quantity} x ${Number(item.basePrice).toFixed(2)}
                      </span>
                    </div>
                    <strong style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                      ${(Number(item.basePrice) * item.quantity).toFixed(2)}
                    </strong>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src="/burger_hero.png" alt="Classic Burger" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '14px' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#0f172a' }}>Classic Burger</h4>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>1 x $7.99</span>
                  </div>
                  <strong style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>$7.99</strong>
                </div>
              )}
            </div>

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>
                <span>Subtotal</span>
                <span>${(cartSubtotal || 10.98).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>
                <span>Delivery Fee</span>
                <span>${(deliveryFee || 2.00).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: '#0f172a', fontWeight: 900, paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <span>Total</span>
                <span style={{ color: '#F95700' }}>${(totalAmount || 12.98).toFixed(2)}</span>
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
              disabled={loading}
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
              <span>${(totalAmount || 12.98).toFixed(2)}</span>
            </button>
          </div>
        </div>

      </div>
    </CustomerLayout>
  );
}
