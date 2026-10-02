'use client';

import React, { useEffect, useState } from 'react';
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
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [quotedDeliveryFee, setQuotedDeliveryFee] = useState(deliveryFee);
  const [requiresLocation, setRequiresLocation] = useState(false);
  const [deliveryBlocked, setDeliveryBlocked] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [locating, setLocating] = useState(false);

  // Keep address synchronized with context
  const setAddress = (val: string) => {
    setAddressState(val);
    setDeliveryAddress(val);
  };

  const resolvedRestaurantId = restaurantId || cart[0]?.restaurantId;
  const totalAmount = cartSubtotal + quotedDeliveryFee;

  useEffect(() => { setQuotedDeliveryFee(deliveryFee); }, [deliveryFee]);

  useEffect(() => {
    if (!resolvedRestaurantId) return;
    const hasCoordinates = latitude !== '' && longitude !== '';
    const controller = new AbortController();
    fetch('/api/delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: resolvedRestaurantId,
        ...(hasCoordinates ? { latitude: Number(latitude), longitude: Number(longitude) } : {}),
      }),
      signal: controller.signal,
    }).then(async (response) => {
      const data = await response.json();
      if (response.ok) {
        setQuotedDeliveryFee(Number(data.deliveryFee));
        setRequiresLocation(false);
        setDeliveryBlocked(false);
        setDeliveryMessage(data.zone ? `Delivery zone: ${data.zone.name}` : 'Standard restaurant delivery');
      } else if (data.requiresCoordinates) {
        setRequiresLocation(true);
        setDeliveryBlocked(true);
        setDeliveryMessage('Share your location to verify that this address is deliverable.');
      } else if (hasCoordinates) {
        setRequiresLocation(true);
        setDeliveryBlocked(true);
        setDeliveryMessage(data.error || 'This location is outside the delivery area.');
      }
    }).catch((error) => {
      if (error?.name !== 'AbortError') setDeliveryMessage('Unable to verify delivery right now.');
    });
    return () => controller.abort();
  }, [resolvedRestaurantId, latitude, longitude]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return setDeliveryMessage('Location is not supported by this browser.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setLocating(false);
      },
      () => {
        setDeliveryMessage('Location permission was denied. You can enter coordinates manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handlePlaceOrder = async () => {
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

    if (requiresLocation && (!latitude || !longitude)) {
      alert('Please share your delivery location so we can verify the delivery zone.');
      return;
    }
    if (deliveryBlocked) {
      alert(deliveryMessage || 'This location is not available for delivery.');
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
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          notes: customerNotes || null,
        },
        paymentMethod: 'cod',
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b' }}>Delivery Location {requiresLocation ? '(Required)' : '(Optional)'}</label>
                <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '8px 12px' }} onClick={useCurrentLocation} disabled={locating}>{locating ? 'Locating…' : 'Use current location'}</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input className="form-input" type="number" min="-90" max="90" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="Latitude" />
                <input className="form-input" type="number" min="-180" max="180" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="Longitude" />
              </div>
              {deliveryMessage && <small style={{ display: 'block', marginTop: '8px', color: deliveryMessage.includes('outside') ? '#dc2626' : '#64748b' }}>{deliveryMessage}</small>}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', marginBottom: '6px' }}>Guest Notes (Optional)</label>
              <input className="form-input" type="text" value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} placeholder="Delivery preferences for this guest" />
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
              <input className="form-input" value="Cash on delivery" readOnly />
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
                        {item.quantity} × €{Number(item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                    <strong style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                      €{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </strong>
                  </div>
                ))
              ) : <p style={{ margin: 0, color: '#64748b' }}>Your cart is empty.</p>}
            </div>

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>
                <span>Subtotal</span>
                <span>€{cartSubtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>
                <span>Delivery Fee</span>
                <span>€{quotedDeliveryFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: '#0f172a', fontWeight: 900, paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <span>Total</span>
                <span style={{ color: '#F95700' }}>€{totalAmount.toFixed(2)}</span>
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
              <span>€{totalAmount.toFixed(2)}</span>
            </button>
          </div>
        </div>

      </div>
    </CustomerLayout>
  );
}
