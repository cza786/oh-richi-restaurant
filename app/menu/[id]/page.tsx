'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '../../components/CustomerLayout';
import { useCart } from '../../components/CartContext';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  category: { name: string };
  variations: Array<{ id: string; name: string; priceDifference: number }>;
  itemSpiceLevels: Array<{
    spiceLevel: { id: string; name: string; value: number; priceDifference: number };
  }>;
  itemAddons: Array<{
    addon: { id: string; name: string; price: number };
  }>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const productId = params.id as string;
  const [product, setProduct] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Customization state
  const [selectedVariation, setSelectedVariation] = useState<MenuItem['variations'][number] | null>(null);
  const [selectedSpice, setSelectedSpice] = useState<MenuItem['itemSpiceLevels'][number]['spiceLevel'] | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [makeComboMeal, setMakeComboMeal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');

  // Scoville Disclaimer Modal State
  const [showReaperDisclaimer, setShowReaperDisclaimer] = useState(false);
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);

  // Stock options fallback if database addons are empty
  const STOCK_VARIATIONS = [
    { id: 'v-reg', name: 'REGULAR', priceDifference: 0 },
    { id: 'v-chunk', name: 'CHUNKY', priceDifference: 1.00 },
    { id: 'v-double', name: 'DOUBLE', priceDifference: 2.00 },
  ];

  const STOCK_ADDONS = [
    { id: 'add-cheese', name: 'Extra Cheese', price: 1.50 },
    { id: 'add-bacon', name: 'Crispy Bacon', price: 1.90 },
    { id: 'add-jalapenos', name: 'Jalapeños', price: 0.90 },
    { id: 'add-onions', name: 'Röstzwiebeln', price: 0.60 },
  ];

  const STOCK_SPICES = [
    { id: 'sp-no', name: 'NO SPICE', value: 0, priceDifference: 0 },
    { id: 'sp-mild', name: 'MILD', value: 1, priceDifference: 0 },
    { id: 'sp-med', name: 'MEDIUM', value: 2, priceDifference: 0 },
    { id: 'sp-hot', name: 'HOT', value: 3, priceDifference: 0 },
    { id: 'sp-extra', name: 'EXTRA HOT', value: 4, priceDifference: 0.50 },
    { id: 'sp-reaper', name: 'OH RICHI REAPER 🌶️', value: 5, priceDifference: 1.50 },
  ];

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const items: MenuItem[] = await res.json();
          const found = items.find((i) => i.id === productId || i.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === productId);
          if (found) {
            setProduct(found);
            if (found.variations && found.variations.length > 0) {
              setSelectedVariation(found.variations[0]);
            } else {
              setSelectedVariation(STOCK_VARIATIONS[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    if (productId) fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const variationsList = useMemo(() => {
    if (product?.variations && product.variations.length > 0) return product.variations;
    return STOCK_VARIATIONS;
  }, [product]);

  const spiceLevelsList = useMemo(() => {
    if (product?.itemSpiceLevels && product.itemSpiceLevels.length > 0) {
      return product.itemSpiceLevels.map((isl) => isl.spiceLevel);
    }
    return STOCK_SPICES;
  }, [product]);

  const addonsList = useMemo(() => {
    if (product?.itemAddons && product.itemAddons.length > 0) {
      return product.itemAddons.map((ia) => ia.addon);
    }
    return STOCK_ADDONS;
  }, [product]);

  const calculatedUnitPrice = useMemo(() => {
    if (!product) return 0;
    const varDiff = Number(selectedVariation?.priceDifference || 0);
    const spiceDiff = Number(selectedSpice?.priceDifference || 0);
    const addonsSum = selectedAddons.reduce((sum, a) => sum + Number(a.price || 0), 0);
    const comboPrice = makeComboMeal ? 3.49 : 0;
    return Number(product.basePrice) + varDiff + spiceDiff + addonsSum + comboPrice;
  }, [product, selectedVariation, selectedSpice, selectedAddons, makeComboMeal]);

  const totalCalculatedPrice = calculatedUnitPrice * quantity;

  const toggleAddon = (addon: { id: string; name: string; price: number }) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id) ? prev.filter((a) => a.id !== addon.id) : [...prev, addon]
    );
  };

  const handleAddToCartSubmit = () => {
    if (!product) return;

    if (selectedSpice?.name.toLowerCase().includes('reaper') && !disclaimerAgreed) {
      setShowReaperDisclaimer(true);
      return;
    }

    const finalAddons = [
      ...selectedAddons.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) })),
      ...(makeComboMeal ? [{ id: 'combo-meal-upgrade', name: 'Meal Upgrade (Fries + Drink)', price: 3.49 }] : []),
    ];

    addToCart({
      itemId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      basePrice: Number(product.basePrice),
      quantity,
      variation: selectedVariation ? {
        id: selectedVariation.id,
        name: selectedVariation.name,
        priceDifference: Number(selectedVariation.priceDifference || 0),
      } : null,
      spiceLevel: selectedSpice ? {
        id: selectedSpice.id,
        name: selectedSpice.name,
        priceDifference: Number(selectedSpice.priceDifference || 0),
      } : null,
      addons: finalAddons,
      notes,
    });

    setToast(`${product.name} added to cart!`);
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Breadcrumb Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          color: '#94a3b8',
          marginBottom: '32px',
          fontWeight: 600,
        }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/menu" style={{ color: '#94a3b8', textDecoration: 'none' }}>Menu</Link>
          <span>›</span>
          <Link href="/menu" style={{ color: '#94a3b8', textDecoration: 'none' }}>Burgers</Link>
          <span>›</span>
          <span style={{ color: '#ffffff', fontWeight: 700 }}>{product?.name || 'Product Details'}</span>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#ff9500',
            color: '#ffffff',
            padding: '14px 24px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.95rem',
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(255, 149, 0, 0.4)',
          }}>
            ✓ {toast}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
            Loading product details...
          </div>
        ) : !product ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
            <h2 style={{ color: '#ffffff' }}>Product not found</h2>
            <Link href="/menu" style={{ color: '#ff9500', textDecoration: 'underline' }}>Return to menu</Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '48px',
            alignItems: 'start',
          }}>
            
            {/* LEFT COLUMN: Product Image Frame & 3 Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Product Visual Container */}
              <div style={{
                background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)',
                border: '1px solid #282838',
                borderRadius: '24px',
                padding: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.22)',
                minHeight: '420px',
              }}>
                <img
                  src={product.imageUrl || '/burger_hero.png'}
                  alt={product.name}
                  style={{
                    width: '100%',
                    maxHeight: '380px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 20px 35px rgba(0, 0, 0, 0.75))',
                  }}
                />
              </div>

              {/* 3 Feature Badges Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                textAlign: 'center',
              }}>
                <div style={{
                  backgroundColor: '#121218',
                  border: '1px solid #282838',
                  borderRadius: '14px',
                  padding: '12px 8px',
                }}>
                  <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>📜</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>100% HALAL BEEF</span>
                </div>
                <div style={{
                  backgroundColor: '#121218',
                  border: '1px solid #282838',
                  borderRadius: '14px',
                  padding: '12px 8px',
                }}>
                  <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>🔥</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>FRESHLY MADE</span>
                </div>
                <div style={{
                  backgroundColor: '#121218',
                  border: '1px solid #282838',
                  borderRadius: '14px',
                  padding: '12px 8px',
                }}>
                  <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '4px' }}>⏱</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>PREP 10-12 MIN</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Options, Addons, Spice Level & Add to Cart */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              color: '#ffffff',
            }}>
              {/* Product Header & Title */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                    {product.name}
                  </h1>
                  <span style={{
                    backgroundColor: '#ff9500',
                    color: '#000000',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}>
                    BESTSELLER
                  </span>
                </div>

                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ff9500', marginBottom: '12px' }}>
                  €{calculatedUnitPrice.toFixed(2)}
                </div>

                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                  {product.description || 'Juicy beef patty, OHG sauce, cheese, pickles, onions and fresh lettuce.'}
                </p>
              </div>

              {/* 1. CHOOSE YOUR OPTION (Horizontal Pill Cards instead of dropdowns) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  CHOOSE YOUR OPTION
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {variationsList.map((v) => {
                    const isSelected = selectedVariation?.id === v.id;
                    const diff = Number(v.priceDifference || 0);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariation(v)}
                        style={{
                          padding: '14px 10px',
                          borderRadius: '14px',
                          backgroundColor: isSelected ? 'rgba(255, 149, 0, 0.12)' : '#121218',
                          border: isSelected ? '2px solid #ff9500' : '1px solid #282838',
                          color: '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 15px rgba(255, 149, 0, 0.3)' : 'none',
                        }}
                      >
                        <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          {v.name}
                        </span>
                        <small style={{ fontSize: '0.75rem', color: isSelected ? '#ff9500' : '#94a3b8', marginTop: '2px', display: 'block' }}>
                          {diff > 0 ? `+€${diff.toFixed(2)}` : 'Standard'}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. ADD-ONS (2-Column Checkbox Grid instead of dropdowns) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  ADD-ONS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {addonsList.map((addon) => {
                    const isChecked = selectedAddons.some((a) => a.id === addon.id);
                    return (
                      <label
                        key={addon.id}
                        onClick={() => toggleAddon(addon)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          backgroundColor: isChecked ? 'rgba(255, 149, 0, 0.1)' : '#121218',
                          border: isChecked ? '1px solid #ff9500' : '1px solid #282838',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAddon(addon)}
                            style={{ width: '18px', height: '18px', accentColor: '#ff9500', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{addon.name}</span>
                        </div>
                        <span style={{ fontSize: '0.82rem', color: '#ff9500', fontWeight: 800 }}>
                          +€{Number(addon.price).toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 3. SPICE LEVEL (Horizontal Pill Selector Row instead of dropdowns) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  SPICE LEVEL
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {spiceLevelsList.map((spice) => {
                    const isSelected = selectedSpice?.id === spice.id || (!selectedSpice && spice.name === 'MILD');
                    return (
                      <button
                        key={spice.id}
                        type="button"
                        onClick={() => setSelectedSpice(spice)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '12px',
                          backgroundColor: isSelected ? 'rgba(255, 149, 0, 0.15)' : '#121218',
                          border: isSelected ? '2px solid #ff9500' : '1px solid #282838',
                          color: isSelected ? '#ffffff' : '#cbd5e1',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 15px rgba(255, 149, 0, 0.3)' : 'none',
                        }}
                      >
                        {spice.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. COMBO UPGRADE Box */}
              <div
                onClick={() => setMakeComboMeal(!makeComboMeal)}
                style={{
                  backgroundColor: makeComboMeal ? 'rgba(255, 149, 0, 0.12)' : '#121218',
                  border: makeComboMeal ? '2px solid #ff9500' : '1px solid #282838',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <input
                    type="checkbox"
                    checked={makeComboMeal}
                    onChange={(e) => setMakeComboMeal(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#ff9500', cursor: 'pointer' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                      Make it a Meal
                    </strong>
                    <small style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      Stealth Fries + Ice Cold Drink
                    </small>
                  </div>
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#ff9500' }}>
                  +€3.49
                </span>
              </div>

              {/* 5. BOTTOM ACTION ROW (Quantity Stepper + Light Orange Add to Cart Button + Wishlist) */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                {/* Stepper (- 1 +) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#121218',
                  border: '1px solid #282838',
                  borderRadius: '14px',
                  padding: '4px',
                  height: '52px',
                }}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{
                      width: '40px',
                      height: '44px',
                      backgroundColor: '#1a1a24',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span style={{ width: '36px', textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', color: '#ffffff' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    style={{
                      width: '40px',
                      height: '44px',
                      backgroundColor: '#1a1a24',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Primary Light Orange Gradient CTA Button */}
                <button
                  type="button"
                  onClick={handleAddToCartSubmit}
                  style={{
                    flex: 1,
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '0.5px',
                    boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ADD TO CART — €{totalCalculatedPrice.toFixed(2)}
                </button>

                {/* Wishlist Heart Button */}
                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: '#121218',
                    border: isWishlisted ? '1px solid #ff9500' : '1px solid #282838',
                    color: isWishlisted ? '#ff9500' : '#ffffff',
                    fontSize: '1.3rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  aria-label="Add to wishlist"
                >
                  {isWishlisted ? '♥' : '♡'}
                </button>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Carolina Reaper Liability Disclaimer Modal Overlay */}
      {showReaperDisclaimer && (
        <>
          <div onClick={() => setShowReaperDisclaimer(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 99998 }} />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '500px',
            backgroundColor: '#16161e',
            border: '2px solid #ff9500',
            borderRadius: '16px',
            padding: '24px',
            zIndex: 99999,
            color: '#ffffff',
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#ff9500', fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase' }}>
              ⚠️ Verzichtserklärung — Extreme Spice Warning
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '20px' }}>
              Carolina Reaper (2.7 Million Scoville) is among the world&apos;s hottest chillies. Please confirm you understand the extreme heat intensity before adding to your order.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowReaperDisclaimer(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#282838', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisclaimerAgreed(true);
                  setShowReaperDisclaimer(false);
                  handleAddToCartSubmit();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
                }}
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </>
      )}
    </CustomerLayout>
  );
}
