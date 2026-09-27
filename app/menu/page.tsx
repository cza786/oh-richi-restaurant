'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import CustomerLayout from '../components/CustomerLayout';
import { useCart } from '../components/CartContext';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  isAvailable?: boolean;
  category: { name: string };
  variations: Array<{ id: string; name: string; priceDifference: number }>;
  itemSpiceLevels: Array<{
    spiceLevel: { id: string; name: string; value: number; priceDifference: number };
  }>;
  itemAddons: Array<{
    addon: { id: string; name: string; price: number; isAvailable?: boolean };
  }>;
}

const CATEGORIES = [
  'All',
  'Chunky Beef Burger',
  'Chicken / Hänchen',
  'Vegetarisch',
  'Burger im Menü',
  'Stealth Fries / Loaded',
  'Getränke',
  'Coffee',
  'Sweets',
  'Toppings',
  'Spices',
  'Saucen',
];

export default function PublicMenuPage() {
  const { addToCart } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');

  // Selected variant maps (itemId -> variationId)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Carolina Reaper Liability Disclaimer Modal State
  const [reaperModalItem, setReaperModalItem] = useState<MenuItem | null>(null);
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);

  // Combo Deal Builder Modal State
  const [comboModalItem, setComboModalItem] = useState<MenuItem | null>(null);
  const [selectedDrink, setSelectedDrink] = useState('Coca Cola (0.3L)');
  const [selectedFries, setSelectedFries] = useState('Stealth Fries (Regular)');
  const [selectedSauce, setSelectedSauce] = useState('Oh-G Sauce');

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMenuItems(data);
          }
        }
      } catch (err) {
        console.error('Error loading menu:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const catMatch = activeCategory === 'All' || item.category?.name === activeCategory;
      const searchMatch = !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const handleVariantSelect = (itemId: string, varId: string) => {
    setSelectedVariants((prev) => ({ ...prev, [itemId]: varId }));
  };

  const getItemPrice = (item: MenuItem) => {
    const selectedVarId = selectedVariants[item.id];
    if (selectedVarId && item.variations) {
      const matched = item.variations.find((v) => v.id === selectedVarId);
      if (matched) return Number(item.basePrice) + Number(matched.priceDifference);
    }
    return Number(item.basePrice);
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      itemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      basePrice: Number(item.basePrice),
      quantity: 1,
      variation: null,
      spiceLevel: null,
      addons: [],
      notes: '',
    });

    setToast(`Added ${item.name} to cart!`);
  };

  const confirmReaperAdd = () => {
    if (!reaperModalItem || !disclaimerAgreed) return;

    addToCart({
      itemId: reaperModalItem.id,
      name: reaperModalItem.name,
      imageUrl: reaperModalItem.imageUrl,
      basePrice: Number(reaperModalItem.basePrice),
      quantity: 1,
      variation: null,
      spiceLevel: null,
      addons: [],
      notes: '⚠️ Customer accepted Carolina Reaper Scoville Disclaimer.',
    });

    setToast(`Added ${reaperModalItem.name} to cart! 🔥`);
    setReaperModalItem(null);
  };

  const handleAddComboDeal = () => {
    if (!comboModalItem) return;

    addToCart({
      itemId: comboModalItem.id,
      name: comboModalItem.name,
      imageUrl: comboModalItem.imageUrl,
      basePrice: Number(comboModalItem.basePrice),
      quantity: 1,
      variation: null,
      spiceLevel: null,
      addons: [],
      notes: `Combo Drink: ${selectedDrink} | Fries: ${selectedFries} | Sauce: ${selectedSauce}`,
    });

    setToast(`Added ${comboModalItem.name} to cart! 🍔🍟🥤`);
    setComboModalItem(null);
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            color: 'var(--accent-gold, #d6a84f)',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            FRESH SMASHED BURGERS & SIDES
          </span>
          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: 900,
            color: '#ffffff',
            margin: '8px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            OUR FULL MENU
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto' }}>
            Crafted with 100% Halal prime beef, freshly baked Martins rolls, and signature homemade sauces.
          </p>
        </div>

        {/* Search & Category Filter Header */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Search menu items, ingredients, sauces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor: '#16161e',
              border: '1px solid #2a2a3c',
              color: '#ffffff',
              fontSize: '0.95rem',
              outline: 'none',
              marginBottom: '20px',
            }}
          />

          {/* Categories Horizontal Scroll Bar */}
          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '12px',
            scrollbarWidth: 'thin',
          }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '25px',
                  border: activeCategory === cat ? '1px solid #ffa000' : '1px solid #282838',
                  background: activeCategory === cat ? 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)' : '#121218',
                  color: activeCategory === cat ? '#ffffff' : '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeCategory === cat ? '0 8px 24px rgba(255, 140, 0, 0.45)' : 'none',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--accent-red, #ff3b30)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          }}>
            ✓ {toast}
          </div>
        )}

        {/* Menu Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            Loading menu items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            No items found matching your criteria.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {filteredItems.map((item) => {
              const currentPrice = getItemPrice(item);
              const isSpicy = item.name.toLowerCase().includes('pikant') || item.description?.includes('🌶️');
              const isVeg = item.name.toLowerCase().includes('veggi') || item.description?.includes('Vegetarisch') || item.name.includes('Rainb');

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)',
                    border: '1px solid #282838',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.22)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  <div>
                    {/* Visual & Badges */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      style={{
                        width: '100%',
                        position: 'relative',
                        height: '190px',
                        backgroundColor: '#0a0a0f',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <img
                        src={item.imageUrl || '/burger_hero.png'}
                        alt={item.name}
                        style={{ maxHeight: '88%', maxWidth: '88%', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.6))' }}
                      />
                      <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                        {isSpicy && (
                          <span style={{ backgroundColor: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.4)', color: 'var(--accent-red, #ff3b30)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>
                            Pikant 🌶️
                          </span>
                        )}
                        {isVeg && (
                          <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#22c55e', padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>
                            🥬 Vegetarisch
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Name & Details */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        style={{ background: 'none', border: 'none', padding: 0, color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase' }}>{item.name}</h3>
                      </button>
                    </div>

                    <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>
                      {item.description}
                    </p>

                    {/* Variations Selector if available */}
                    {item.variations && item.variations.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase' }}>
                          Select Size / Variant:
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {item.variations.map((v) => {
                            const selected = selectedVariants[item.id] === v.id || (!selectedVariants[item.id] && v.priceDifference === 0);
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => handleVariantSelect(item.id, v.id)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  borderRadius: '8px',
                                  backgroundColor: selected ? 'linear-gradient(135deg, #ff9500 0%, #e07b00 100%)' : '#1a1a24',
                                  background: selected ? 'linear-gradient(135deg, #ff9500 0%, #e07b00 100%)' : '#1a1a24',
                                  color: '#ffffff',
                                  border: selected ? '1px solid #ff9500' : '1px solid #282838',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {v.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Action Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #232333' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ff9500' }}>
                      €{currentPrice.toFixed(2)}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {item.category?.name === 'Burger im Menü' ? (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                            color: '#ffffff',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
                          }}
                        >
                          Build Combo
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                            color: '#ffffff',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
                          }}
                        >
                          Order now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Carolina Reaper Scoville Disclaimer Modal */}
      {reaperModalItem && (
        <>
          <div 
            onClick={() => setReaperModalItem(null)} 
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 99998 }} 
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '500px',
            backgroundColor: '#16161e',
            border: '2px solid var(--accent-red, #ff3b30)',
            borderRadius: '16px',
            padding: '24px',
            zIndex: 99999,
            color: '#ffffff',
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--accent-red, #ff3b30)', fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase' }}>
              ⚠️ Verzichtserklärung — Extreme Spice Warning
            </h3>
            <div style={{ backgroundColor: '#0d0d12', padding: '16px', borderRadius: '8px', border: '1px solid #2a2a3c', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '20px' }}>
              <p style={{ marginTop: 0 }}>
                You are adding <strong>Carolina Reaper Chilli (2,700,000 Scoville Heat Units)</strong> to your order.
              </p>
              <p style={{ marginBottom: 0 }}>
                This spice is extremely hot. By proceeding, you confirm that you are aware of the intense heat level and consent to add this item to your meal.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#ffffff', cursor: 'pointer', marginBottom: '20px' }}>
              <input
                type="checkbox"
                checked={disclaimerAgreed}
                onChange={(e) => setDisclaimerAgreed(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-red, #ff3b30)' }}
              />
              <span>Ich akzeptiere die Verzichtserklärung (I accept the liability disclaimer).</span>
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setReaperModalItem(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#2a2a3c', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!disclaimerAgreed}
                onClick={confirmReaperAdd}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: disclaimerAgreed ? 'var(--accent-red, #ff3b30)' : '#441515',
                  color: disclaimerAgreed ? '#ffffff' : '#885555',
                  border: 'none',
                  fontWeight: 700,
                  cursor: disclaimerAgreed ? 'pointer' : 'not-allowed',
                }}
              >
                Confirm & Add
              </button>
            </div>
          </div>
        </>
      )}

      {/* Combo Meal Builder Modal */}
      {comboModalItem && (
        <>
          <div 
            onClick={() => setComboModalItem(null)} 
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 99998 }} 
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '480px',
            backgroundColor: '#16161e',
            border: '1px solid #2a2a3c',
            borderRadius: '16px',
            padding: '24px',
            zIndex: 99999,
            color: '#ffffff',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>
              Build Your Burger Combo (€5.80)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Select 0.3L Softdrink:
                </label>
                <select
                  value={selectedDrink}
                  onChange={(e) => setSelectedDrink(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0d0d12', border: '1px solid #2a2a3c', color: '#ffffff', borderRadius: '8px' }}
                >
                  <option value="Coca Cola (0.3L)">Coca Cola (0.3L)</option>
                  <option value="Coca Cola Zero (0.3L)">Coca Cola Zero (0.3L)</option>
                  <option value="Fanta (0.3L)">Fanta (0.3L)</option>
                  <option value="Sprite (0.3L)">Sprite (0.3L)</option>
                  <option value="Vio Wasser Still (0.5L)">Vio Wasser Still (0.5L)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Select Stealth Fries:
                </label>
                <select
                  value={selectedFries}
                  onChange={(e) => setSelectedFries(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0d0d12', border: '1px solid #2a2a3c', color: '#ffffff', borderRadius: '8px' }}
                >
                  <option value="Stealth Fries (Regular)">Stealth Fries (Regular)</option>
                  <option value="Loaded Fries (+€1.50)">Loaded Fries (+€1.50)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Select Sauce Dip:
                </label>
                <select
                  value={selectedSauce}
                  onChange={(e) => setSelectedSauce(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0d0d12', border: '1px solid #2a2a3c', color: '#ffffff', borderRadius: '8px' }}
                >
                  <option value="Oh-G Sauce">Oh-G Sauce</option>
                  <option value="Chimi Mayo">Chimi Mayo</option>
                  <option value="Trüffel Mayo">Trüffel Mayo</option>
                  <option value="BBQ Sauce">BBQ Sauce</option>
                  <option value="Ketchup">Ketchup</option>
                  <option value="Mayo">Mayo</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddComboDeal}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                fontWeight: 900,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
              }}
            >
              Add Combo to Cart (€5.80)
            </button>
          </div>
        </>
      )}
    </CustomerLayout>
  );
}
