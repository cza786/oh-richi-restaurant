'use client';

import React, { useState, useMemo, useEffect } from 'react';

export interface MenuItemOption {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number | string;
  category?: { name: string };
  variations?: Array<{ id: string; name: string; priceDifference: number | string }>;
  itemSpiceLevels?: Array<{
    spiceLevel: { id: string; name: string; value: number; priceDifference: number | string };
  }>;
  itemAddons?: Array<{
    addon: { id: string; name: string; price: number | string; isAvailable?: boolean };
  }>;
}

interface ProductCustomizerModalProps {
  item: MenuItemOption | null;
  onClose: () => void;
  onAddToCart: (customizedData: {
    item: MenuItemOption;
    quantity: number;
    variation: { id: string; name: string; priceDifference: number } | null;
    spiceLevel: { id: string; name: string; priceDifference: number } | null;
    addons: Array<{ id: string; name: string; price: number }>;
    notes: string;
  }) => void;
}

export default function ProductCustomizerModal({
  item,
  onClose,
  onAddToCart,
}: ProductCustomizerModalProps) {
  // Accordion collapsed state for each section
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    variant: true,
    spice: false,
    fries: false,
    sauces: true,
    toppings: false,
  });

  // Customization selections
  const [selectedVariation, setSelectedVariation] = useState<{ id: string; name: string; priceDifference: number } | null>(null);
  const [selectedSpice, setSelectedSpice] = useState<{ id: string; name: string; priceDifference: number } | null>(null);
  const [selectedFries, setSelectedFries] = useState<{ id: string; name: string; price: number } | null>(null);
  const [selectedSauces, setSelectedSauces] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [selectedToppings, setSelectedToppings] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Carolina Reaper Scoville Disclaimer state
  const [showReaperDisclaimer, setShowReaperDisclaimer] = useState(false);
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);

  useEffect(() => {
    if (item) {
      if (item.variations && item.variations.length > 0) {
        const first = item.variations[0];
        setSelectedVariation({
          id: first.id,
          name: first.name,
          priceDifference: Number(first.priceDifference || 0),
        });
      } else {
        setSelectedVariation(null);
      }
      setSelectedSpice(null);
      setSelectedFries(null);
      setSelectedSauces([]);
      setSelectedToppings([]);
      setQuantity(1);
      setNotes('');
      setDisclaimerAgreed(false);
      setShowReaperDisclaimer(false);
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Stock Options
  const FRIES_OPTIONS = [
    { id: 'fries-reg', name: 'Stealth Fries (Regular)', price: 5.00 },
    { id: 'fries-loaded', name: 'Loaded Fries with Cheese & Smoky Onions', price: 7.50 },
  ];

  const SAUCE_OPTIONS = [
    { id: 'sauce-ohg', name: 'Oh-G Signature Sauce', price: 1.50 },
    { id: 'sauce-chimi', name: 'Chimi Mayo', price: 2.00 },
    { id: 'sauce-truffle', name: 'Trüffel Mayo', price: 2.50 },
    { id: 'sauce-bbq', name: 'Smoky BBQ Glaze', price: 1.50 },
    { id: 'sauce-ketchup', name: 'Classic Ketchup', price: 1.00 },
    { id: 'sauce-mayo', name: 'Creamy Mayo', price: 1.00 },
  ];

  const TOPPING_OPTIONS = [
    { id: 'top-patty-100', name: 'Extra 100g Angus Beef Patty', price: 3.00 },
    { id: 'top-patty-140', name: 'Extra 140g Chunky Beef Patty', price: 4.50 },
    { id: 'top-bacon', name: 'Crispy Beef Bacon', price: 2.50 },
    { id: 'top-cheddar', name: 'Melted Cheddar Cheese', price: 1.50 },
    { id: 'top-onions', name: 'Caramelized Röstzwiebeln', price: 1.00 },
    { id: 'top-jalapenos', name: 'Pickled Jalapeños 🌶️', price: 1.00 },
  ];

  const SPICE_OPTIONS = [
    { id: 'spice-mild', name: 'Mild / Standard', priceDifference: 0 },
    { id: 'spice-habanero', name: 'Habanero Chili (350K Scoville) 🌶️', priceDifference: 1.00 },
    { id: 'spice-bhut', name: 'Bhut Jolokia Ghost Pepper (1.5M Scoville) 🌶️🌶️', priceDifference: 2.00 },
    { id: 'spice-reaper', name: 'Carolina Reaper (2.7M Scoville) 🔥🔥🔥', priceDifference: 3.00 },
  ];

  const toggleSauce = (sauce: { id: string; name: string; price: number }) => {
    setSelectedSauces((prev) =>
      prev.some((s) => s.id === sauce.id) ? prev.filter((s) => s.id !== sauce.id) : [...prev, sauce]
    );
  };

  const toggleTopping = (topping: { id: string; name: string; price: number }) => {
    setSelectedToppings((prev) =>
      prev.some((t) => t.id === topping.id) ? prev.filter((t) => t.id !== topping.id) : [...prev, topping]
    );
  };

  const handleSpiceSelect = (spice: { id: string; name: string; priceDifference: number }) => {
    setSelectedSpice(spice);
    if (spice.name.toLowerCase().includes('carolina reaper')) {
      setShowReaperDisclaimer(true);
    }
  };

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    const base = Number(item.basePrice);
    const varPrice = selectedVariation ? Number(selectedVariation.priceDifference) : 0;
    const spicePrice = selectedSpice ? Number(selectedSpice.priceDifference) : 0;
    const friesPrice = selectedFries ? Number(selectedFries.price) : 0;
    const saucesPrice = selectedSauces.reduce((sum, s) => sum + Number(s.price), 0);
    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + Number(t.price), 0);
    return base + varPrice + spicePrice + friesPrice + saucesPrice + toppingsPrice;
  }, [item, selectedVariation, selectedSpice, selectedFries, selectedSauces, selectedToppings]);

  const totalPrice = unitPrice * quantity;

  if (!item) return null;

  const isSpicy = item.name.toLowerCase().includes('pikant') || item.description?.includes('🌶️');
  const isVeg = item.name.toLowerCase().includes('veggi') || item.name.toLowerCase().includes('rainb');

  const handleSubmit = () => {
    if (selectedSpice?.name.toLowerCase().includes('carolina reaper') && !disclaimerAgreed) {
      setShowReaperDisclaimer(true);
      return;
    }

    const allAddons = [
      ...(selectedFries ? [{ id: selectedFries.id, name: selectedFries.name, price: selectedFries.price }] : []),
      ...selectedSauces,
      ...selectedToppings,
    ];

    let fullNotes = notes;
    if (disclaimerAgreed) {
      fullNotes = fullNotes ? `${fullNotes} | Accepted Carolina Reaper Scoville Disclaimer` : 'Accepted Carolina Reaper Scoville Disclaimer';
    }

    onAddToCart({
      item,
      quantity,
      variation: selectedVariation,
      spiceLevel: selectedSpice,
      addons: allAddons,
      notes: fullNotes,
    });
    onClose();
  };

  return (
    <>
      {/* Modal Backdrop Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 99990,
        }}
      />

      {/* KFC-Style Modal Card Container */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95%',
          maxWidth: '920px',
          maxHeight: '90vh',
          backgroundColor: '#121218',
          border: '1px solid #282838',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          zIndex: 99991,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Bar & Brand Pill */}
        <div style={{
          position: 'relative',
          padding: '16px 24px',
          borderBottom: '1px solid #232333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#181824',
        }}>
          <div style={{ display: 'flex', gap: '4px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <span style={{ width: '8px', height: '18px', backgroundColor: '#ff9500', borderRadius: '3px' }} />
            <span style={{ width: '8px', height: '18px', backgroundColor: '#ff9500', borderRadius: '3px' }} />
            <span style={{ width: '8px', height: '18px', backgroundColor: '#ff9500', borderRadius: '3px' }} />
          </div>

          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ff9500', textTransform: 'uppercase', letterSpacing: '1px' }}>
            CUSTOMIZE YOUR ORDER
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Main Content Area (Two Columns) */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 70px)',
        }}>

          {/* LEFT COLUMN: Collapsible Accordion Sections */}
          <div style={{
            flex: '1 1 480px',
            padding: '24px',
            borderRight: '1px solid #232333',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: '#121218',
          }}>

            {/* 1. Size / Variation Accordion */}
            {item.variations && item.variations.length > 0 && (
              <div style={{ border: '1px solid #282838', borderRadius: '14px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => toggleSection('variant')}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: 'linear-gradient(135deg, #ff9500 0%, #e07b00 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>Select Size / Variant <small style={{ opacity: 0.8, textTransform: 'none', fontSize: '0.75rem', marginLeft: '6px' }}>(Required)</small></span>
                  <span>{openSections.variant ? '▲' : '▼'}</span>
                </button>
                {openSections.variant && (
                  <div style={{ padding: '14px', backgroundColor: '#181824', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {item.variations.map((v) => {
                      const isSelected = selectedVariation?.id === v.id;
                      const priceDiff = Number(v.priceDifference || 0);
                      return (
                        <label
                          key={v.id}
                          onClick={() => setSelectedVariation({ id: v.id, name: v.name, priceDifference: priceDiff })}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            backgroundColor: isSelected ? 'rgba(255, 149, 0, 0.15)' : '#0d0d12',
                            border: isSelected ? '1px solid #ff9500' : '1px solid #282838',
                            cursor: 'pointer',
                            color: '#ffffff',
                            fontSize: '0.88rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="radio"
                              name="variant-choice"
                              checked={isSelected}
                              onChange={() => setSelectedVariation({ id: v.id, name: v.name, priceDifference: priceDiff })}
                              style={{ accentColor: '#ff9500' }}
                            />
                            <span>{v.name}</span>
                          </div>
                          <span style={{ color: '#ff9500', fontWeight: 700 }}>
                            {priceDiff > 0 ? `+€${priceDiff.toFixed(2)}` : 'Standard'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. Spice Intensity Accordion */}
            <div style={{ border: '1px solid #282838', borderRadius: '14px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => toggleSection('spice')}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #ff9500 0%, #e07b00 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                <span>Select Spice Intensity <small style={{ opacity: 0.8, textTransform: 'none', fontSize: '0.75rem', marginLeft: '6px' }}>(Optional)</small></span>
                <span>{openSections.spice ? '▲' : '▼'}</span>
              </button>
              {openSections.spice && (
                <div style={{ padding: '14px', backgroundColor: '#181824', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {SPICE_OPTIONS.map((spice) => {
                    const isSelected = selectedSpice?.id === spice.id;
                    return (
                      <label
                        key={spice.id}
                        onClick={() => handleSpiceSelect(spice)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'rgba(255, 149, 0, 0.15)' : '#0d0d12',
                          border: isSelected ? '1px solid #ff9500' : '1px solid #282838',
                          cursor: 'pointer',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="radio"
                            name="spice-choice"
                            checked={isSelected}
                            onChange={() => handleSpiceSelect(spice)}
                            style={{ accentColor: '#ff9500' }}
                          />
                          <span>{spice.name}</span>
                        </div>
                        <span style={{ color: '#ff9500', fontWeight: 700 }}>
                          {spice.priceDifference > 0 ? `+€${spice.priceDifference.toFixed(2)}` : 'Free'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Don't Forget the Fries! Accordion */}
            <div style={{ border: '1px solid #282838', borderRadius: '14px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => toggleSection('fries')}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #ff9500 0%, #e07b00 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                <span>Don&apos;t forget the Fries! <small style={{ opacity: 0.8, textTransform: 'none', fontSize: '0.75rem', marginLeft: '6px' }}>(Optional)</small></span>
                <span>{openSections.fries ? '▲' : '▼'}</span>
              </button>
              {openSections.fries && (
                <div style={{ padding: '14px', backgroundColor: '#181824', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {FRIES_OPTIONS.map((f) => {
                    const isSelected = selectedFries?.id === f.id;
                    return (
                      <label
                        key={f.id}
                        onClick={() => setSelectedFries(isSelected ? null : f)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'rgba(255, 149, 0, 0.15)' : '#0d0d12',
                          border: isSelected ? '1px solid #ff9500' : '1px solid #282838',
                          cursor: 'pointer',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setSelectedFries(isSelected ? null : f)}
                            style={{ accentColor: '#ff9500' }}
                          />
                          <span>🍟 {f.name}</span>
                        </div>
                        <span style={{ color: '#ff9500', fontWeight: 700 }}>
                          +€{f.price.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Add Some Dips Accordion */}
            <div style={{ border: '1px solid #282838', borderRadius: '14px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => toggleSection('sauces')}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #ff9500 0%, #e07b00 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                <span>Add some Dips <small style={{ opacity: 0.8, textTransform: 'none', fontSize: '0.75rem', marginLeft: '6px' }}>(Optional)</small></span>
                <span>{openSections.sauces ? '▲' : '▼'}</span>
              </button>
              {openSections.sauces && (
                <div style={{ padding: '14px', backgroundColor: '#181824', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {SAUCE_OPTIONS.map((s) => {
                    const isSelected = selectedSauces.some((item) => item.id === s.id);
                    return (
                      <label
                        key={s.id}
                        onClick={() => toggleSauce(s)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'rgba(255, 149, 0, 0.15)' : '#0d0d12',
                          border: isSelected ? '1px solid #ff9500' : '1px solid #282838',
                          cursor: 'pointer',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSauce(s)}
                            style={{ accentColor: '#ff9500' }}
                          />
                          <span>🍯 {s.name}</span>
                        </div>
                        <span style={{ color: '#ff9500', fontWeight: 700 }}>
                          +€{s.price.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Extra Toppings Accordion */}
            <div style={{ border: '1px solid #282838', borderRadius: '14px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => toggleSection('toppings')}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #ff9500 0%, #e07b00 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                <span>Extra Toppings <small style={{ opacity: 0.8, textTransform: 'none', fontSize: '0.75rem', marginLeft: '6px' }}>(Optional)</small></span>
                <span>{openSections.toppings ? '▲' : '▼'}</span>
              </button>
              {openSections.toppings && (
                <div style={{ padding: '14px', backgroundColor: '#181824', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {TOPPING_OPTIONS.map((t) => {
                    const isSelected = selectedToppings.some((item) => item.id === t.id);
                    return (
                      <label
                        key={t.id}
                        onClick={() => toggleTopping(t)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'rgba(255, 149, 0, 0.15)' : '#0d0d12',
                          border: isSelected ? '1px solid #ff9500' : '1px solid #282838',
                          cursor: 'pointer',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTopping(t)}
                            style={{ accentColor: '#ff9500' }}
                          />
                          <span>🧀 {t.name}</span>
                        </div>
                        <span style={{ color: '#ff9500', fontWeight: 700 }}>
                          +€{t.price.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Product Preview & Action Box */}
          <div style={{
            flex: '1 1 360px',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#181824',
          }}>
            {/* Product Image Visual */}
            <div style={{
              width: '100%',
              maxWidth: '280px',
              height: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: '20px',
            }}>
              <img
                src={item.imageUrl || '/burger_hero.png'}
                alt={item.name}
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 25px rgba(0, 0, 0, 0.6))',
                }}
              />
            </div>

            {/* Title, Badges & Subtext */}
            <div style={{ textAlign: 'center', width: '100%', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }}>
                <span style={{ backgroundColor: 'rgba(255, 149, 0, 0.2)', color: '#ff9500', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                  100% HALAL
                </span>
                {isSpicy && (
                  <span style={{ backgroundColor: 'rgba(255, 59, 48, 0.2)', color: 'var(--accent-red, #ff3b30)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                    Pikant 🌶️
                  </span>
                )}
                {isVeg && (
                  <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                    🥬 Vegetarisch
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                {item.name}
              </h2>

              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                {item.description || 'Crafted with 100% Halal prime beef and signature homemade sauce.'}
              </p>
            </div>

            {/* Quantity Stepper & Red Action Button */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Stepper (- 1 +) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                backgroundColor: '#0d0d12',
                border: '1px solid #282838',
                borderRadius: '12px',
                padding: '6px 16px',
                width: 'fit-content',
                margin: '0 auto',
              }}>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#1e1e2d',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  -
                </button>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', minWidth: '24px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#1e1e2d',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>

              {/* Light Orange Gradient Add to Cart Button */}
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>€{totalPrice.toFixed(2)}</span>
                <span style={{ letterSpacing: '1px' }}>ADD TO CART &nbsp;→</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Carolina Reaper Liability Disclaimer Modal Overlay */}
      {showReaperDisclaimer && (
        <>
          <div
            onClick={() => setShowReaperDisclaimer(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 99998 }}
          />
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
            <div style={{ backgroundColor: '#0d0d12', padding: '16px', borderRadius: '8px', border: '1px solid #282838', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '20px' }}>
              <p style={{ marginTop: 0 }}>
                You selected <strong>Carolina Reaper Chilli (2,700,000 Scoville Heat Units)</strong>.
              </p>
              <p style={{ marginBottom: 0 }}>
                This spice is extremely hot. By proceeding, you confirm that you accept the intense heat level and consent to add this item to your order.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#ffffff', cursor: 'pointer', marginBottom: '20px' }}>
              <input
                type="checkbox"
                checked={disclaimerAgreed}
                onChange={(e) => setDisclaimerAgreed(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#ff9500' }}
              />
              <span>Ich akzeptiere die Verzichtserklärung (I accept the liability disclaimer).</span>
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => { setShowReaperDisclaimer(false); setSelectedSpice(null); }}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#282838', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!disclaimerAgreed}
                onClick={() => setShowReaperDisclaimer(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  background: disclaimerAgreed ? 'linear-gradient(135deg, #ff9500 0%, #e07b00 100%)' : '#332211',
                  color: disclaimerAgreed ? '#ffffff' : '#886644',
                  border: 'none',
                  fontWeight: 700,
                  cursor: disclaimerAgreed ? 'pointer' : 'not-allowed',
                }}
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
