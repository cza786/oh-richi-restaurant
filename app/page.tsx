'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CustomerLayout from './components/CustomerLayout';
import FireParticles from './components/FireParticles';
import ProductCustomizerModal from './components/ProductCustomizerModal';
import { useCart } from './components/CartContext';

type PriceValue = number | string;

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: PriceValue;
  isAvailable?: boolean;
  category: { name: string };
  variations: Array<{ id: string; name: string; priceDifference: PriceValue }>;
  itemSpiceLevels: Array<{
    spiceLevel: { id: string; name: string; value: number; priceDifference: PriceValue };
  }>;
  itemAddons: Array<{
    addon: { id: string; name: string; price: PriceValue; isAvailable?: boolean };
  }>;
}

const plainOptions = { variations: [], itemSpiceLevels: [], itemAddons: [] };

const FALLBACK_MENU: MenuItem[] = [
  {
    id: 'd3b07384-d113-4e4e-862d-0b32525164b0',
    name: 'Richi Classic',
    description: 'Flame-grilled Angus beef, cheddar, crisp lettuce, tomato and our signature sauce.',
    imageUrl: '/burger_hero.png',
    basePrice: 12.5,
    category: { name: 'Burgers' },
    variations: [
      { id: 'd3b07384-d113-4e4e-862d-0b32525164d5', name: 'Single Patty', priceDifference: 0 },
      { id: 'd3b07384-d113-4e4e-862d-0b32525164d6', name: 'Double Patty', priceDifference: 4 },
    ],
    itemSpiceLevels: [],
    itemAddons: [],
  },
  {
    id: 'd3b07384-d113-4e4e-862d-0b32525164b4',
    name: 'BBQ Bacon',
    description: 'Smoky beef, crispy bacon, caramelized onions and house barbecue glaze.',
    imageUrl: '/burger_hero.png',
    basePrice: 14,
    category: { name: 'Burgers' },
    ...plainOptions,
  },
  {
    id: 'fallback-spicy-burger',
    name: 'Spicy Jalapeño',
    description: 'Juicy beef, pepper jack, jalapeños and a bright chilli-lime sauce.',
    imageUrl: '/burger_hero.png',
    basePrice: 13.5,
    category: { name: 'Burgers' },
    ...plainOptions,
  },
  {
    id: 'fallback-mushroom-burger',
    name: 'Mushroom Melt',
    description: 'Angus beef, roasted mushrooms, melted Swiss and black garlic mayo.',
    imageUrl: '/burger_hero.png',
    basePrice: 13.25,
    category: { name: 'Burgers' },
    ...plainOptions,
  },
  {
    id: 'd3b07384-d113-4e4e-862d-0b32525164b1',
    name: 'Margherita Pizza',
    description: 'San Marzano tomato, fresh mozzarella, basil and extra virgin olive oil.',
    imageUrl: '/burger_hero.png',
    basePrice: 10,
    category: { name: 'Pizzas' },
    ...plainOptions,
  },
  {
    id: 'fallback-loaded-fries',
    name: 'Richi Loaded Fries',
    description: 'Crispy skin-on fries, cheese sauce, smoky onions and fresh herbs.',
    imageUrl: '/burger_hero.png',
    basePrice: 6.5,
    category: { name: 'Sides' },
    ...plainOptions,
  },
  {
    id: 'd3b07384-d113-4e4e-862d-0b32525164b2',
    name: 'Coca Cola',
    description: 'Ice-cold classic Coca Cola.',
    imageUrl: null,
    basePrice: 2.5,
    category: { name: 'Drinks' },
    ...plainOptions,
  },
  {
    id: 'd3b07384-d113-4e4e-862d-0b32525164b3',
    name: 'Still Water',
    description: 'Chilled premium mineral water.',
    imageUrl: null,
    basePrice: 2,
    category: { name: 'Drinks' },
    ...plainOptions,
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  All: '✦', Burgers: '🍔', Pizzas: '🍕', Chicken: '🍗', Sides: '🍟',
  Drinks: '🥤', Desserts: '🍨', Combos: '🎁',
};

const money = (value: PriceValue) => `€${Number(value).toFixed(2)}`;

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}

function ProductCard({ item, index, compact, onOpen, onAdd }: {
  item: MenuItem;
  index: number;
  compact?: boolean;
  onOpen: (item: MenuItem) => void;
  onAdd: (item: MenuItem) => void;
}) {
  const category = item.category?.name || 'Menu';
  const isDrink = category.toLowerCase().includes('drink') && !item.imageUrl;

  return (
    <article className={`richi-product-card ${compact ? 'is-compact' : ''}`}>
      <button className="richi-product-visual" type="button" onClick={() => onOpen(item)} aria-label={`Customize ${item.name}`}>
        <span className="richi-product-badge">{index === 0 ? 'Popular' : category}</span>
        {isDrink ? <span className="richi-product-emoji" aria-hidden="true">🥤</span> : (
          <img
            src={item.imageUrl || '/burger_hero.png'}
            alt=""
            loading={index < 4 ? 'eager' : 'lazy'}
            onError={(event) => { event.currentTarget.src = '/burger_hero.png'; }}
          />
        )}
      </button>
      <div className="richi-product-copy">
        <div className="richi-product-heading">
          <h3>{item.name}</h3>
          <span className="richi-rating"><b>★</b> {(4.6 + (index % 3) * 0.1).toFixed(1)}</span>
        </div>
        {!compact && <p>{item.description || 'Freshly prepared with premium ingredients.'}</p>}
        <div className="richi-product-footer">
          <strong>{money(item.basePrice)}</strong>
          <button type="button" onClick={() => onAdd(item)}>Add <span>+</span></button>
        </div>
      </div>
    </article>
  );
}

export default function CustomerHomePage() {
  const { addToCart } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Burgers');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<MenuItem['variations'][number] | null>(null);
  const [selectedSpice, setSelectedSpice] = useState<MenuItem['itemSpiceLevels'][number]['spiceLevel'] | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<MenuItem['itemAddons'][number]['addon'][]>([]);
  const [quantity, setQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    const timeout = window.setTimeout(() => controller.abort(), 3000);
    async function loadMenu() {
      try {
        const response = await fetch('/api/menu', { signal: controller.signal });
        if (!response.ok) throw new Error('Menu unavailable');
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('Menu empty');
        if (mounted) setMenuItems(data);
      } catch {
        if (!mounted) return;
        setMenuItems(FALLBACK_MENU);
        setUsingFallback(true);
      } finally {
        window.clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    }
    loadMenu();
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!customizingItem) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setCustomizingItem(null);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [customizingItem]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(menuItems.map((item) => item.category?.name || 'Other')))],
    [menuItems],
  );
  const homeCategories = useMemo(() => {
    const preferredOrder = ['Burgers', 'Sides', 'Drinks', 'Desserts', 'Pizzas', 'Chicken'];
    const available = categories
      .filter((category) => category !== 'All')
      .sort((left, right) => {
        const leftIndex = preferredOrder.indexOf(left);
        const rightIndex = preferredOrder.indexOf(right);
        return (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex);
      });
    return [...available, 'All'];
  }, [categories]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      const inCategory = selectedCategory === 'All' || item.category?.name === selectedCategory;
      const inSearch = !query || item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
      return inCategory && inSearch && item.isAvailable !== false;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const availableItems = menuItems.filter((item) => item.isAvailable !== false);
  const featuredItems = [
    ...availableItems.filter((item) => item.category?.name.toLowerCase().includes('burger')),
    ...availableItems.filter((item) => !item.category?.name.toLowerCase().includes('burger')),
  ].slice(0, 4);
  const scrollToMenu = () => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });

  const openCustomizer = (item: MenuItem) => {
    setCustomizingItem(item);
  };

  const quickAdd = (item: MenuItem) => {
    openCustomizer(item);
  };

  const toggleAddon = (addon: MenuItem['itemAddons'][number]['addon']) => {
    setSelectedAddons((current) => current.some((item) => item.id === addon.id)
      ? current.filter((item) => item.id !== addon.id)
      : [...current, addon]);
  };

  const addCustomizedItem = () => {
    if (!customizingItem) return;
    addToCart({
      itemId: customizingItem.id,
      name: customizingItem.name,
      imageUrl: customizingItem.imageUrl,
      basePrice: Number(customizingItem.basePrice),
      quantity,
      variation: selectedVariation ? {
        id: selectedVariation.id, name: selectedVariation.name,
        priceDifference: Number(selectedVariation.priceDifference || 0),
      } : null,
      spiceLevel: selectedSpice ? {
        id: selectedSpice.id, name: selectedSpice.name,
        priceDifference: Number(selectedSpice.priceDifference || 0),
      } : null,
      addons: selectedAddons.map((addon) => ({ id: addon.id, name: addon.name, price: Number(addon.price) })),
      notes: itemNotes,
    });
    setToast(`${customizingItem.name} added to your cart`);
    setCustomizingItem(null);
  };

  const modalPrice = useMemo(() => {
    if (!customizingItem) return 0;
    const extras = Number(selectedVariation?.priceDifference || 0)
      + Number(selectedSpice?.priceDifference || 0)
      + selectedAddons.reduce((total, addon) => total + Number(addon.price || 0), 0);
    return (Number(customizingItem.basePrice) + extras) * quantity;
  }, [customizingItem, quantity, selectedAddons, selectedSpice, selectedVariation]);
  return (
    <CustomerLayout>
      <div className="richi-storefront">
        <div className="richi-home-grid">
          <aside className="richi-promo-rail" aria-label="Current offers">
            <section className="richi-promo-card richi-family-card">
              <span className="richi-micro-label">🔥 Today&apos;s deal</span>
              <h2>Family Feast</h2>
              <p>2 Burgers + 2 Fries<br />+ 2 Drinks</p>
              <div className="richi-promo-price"><strong>€24.90</strong><del>€31.50</del></div>
              <button type="button" onClick={scrollToMenu}>Order now</button>
              <img src="/burger_hero.png" alt="Family burger feast" />
            </section>

            <section className="richi-promo-card richi-loyalty-card">
              <span className="richi-micro-label">Loyalty rewards</span>
              <p>You have</p>
              <strong className="richi-points">1,250</strong>
              <span>Points</span>
              <div className="richi-points-track"><span /></div>
              <small>Next reward at 1,500 points</small>
              <Link href="/rewards">View rewards</Link>
            </section>
          </aside>

          <div className="richi-home-main">
            <section className="richi-hero" aria-labelledby="richi-hero-title" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
                <FireParticles />
              </div>
              <div className="richi-hero-glow" aria-hidden="true" />
              <div className="richi-spark richi-spark-one" aria-hidden="true">✦</div>
              <div className="richi-spark richi-spark-two" aria-hidden="true">•</div>
              <div className="richi-hero-copy" style={{ position: 'relative', zIndex: 2 }}>
                <span className="richi-fresh-pill">100% Halal &nbsp;•&nbsp; Freshly Made Daily</span>
                <h1 id="richi-hero-title" style={{ fontSize: '3rem', lineHeight: '1.05', textTransform: 'uppercase' }}>
                  BURGERS THAT<br /><em style={{ color: 'var(--accent-gold, #d6a84f)' }}>HIT DIFFERENT</em>
                </h1>
                <div className="richi-review-row">
                  <span aria-label="5 out of 5 stars">★★★★★</span>
                  <small>4.9 (3.2K+ reviews)</small>
                </div>
                <p>Premium ingredients, bold recipes and cheese that melts into every layer.</p>
                <div className="richi-hero-actions">
                  <Link href="/menu" className="richi-primary-action" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    ORDER NOW <ArrowIcon />
                  </Link>
                  <Link href="/menu" className="richi-secondary-action" style={{ textDecoration: 'none' }}>
                    EXPLORE MENU
                  </Link>
                </div>
              </div>
              <div className="richi-hero-art" aria-hidden="true" style={{ position: 'relative', zIndex: 2 }}>
                <img src="/burger_hero.png" alt="OH Richi Signature Burger" />
                <div className="richi-beef-seal"><b>100%</b><span>HALAL</span><strong>Beef</strong></div>
                <span className="richi-chilli">🌶️</span>
              </div>
            </section>

            {/* TRUST & QUALITY SECTION (4 FEATURE BLOCKS) */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              margin: '24px 0',
            }}>
              {[
                { icon: '📜', title: '100% HALAL', desc: 'Certified Ingredients' },
                { icon: '🔥', title: 'FRESHLY MADE', desc: 'Every Single Order' },
                { icon: '⭐', title: 'PREMIUM QUALITY', desc: 'Best Ingredients' },
                { icon: '🍔', title: 'BOLD FLAVOURS', desc: 'Made to Perfection' },
              ].map((block) => (
                <div 
                  key={block.title}
                  style={{
                    backgroundColor: '#13131a',
                    border: '1px solid #232333',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '1.8rem' }}>{block.icon}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
                      {block.title}
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                      {block.desc}
                    </p>
                  </div>
                </div>
              ))}
            </section>

            {/* HAPPY HOUR PROMOTION BANNER */}
            <section style={{
              backgroundColor: '#121218',
              border: '1px solid #282838',
              borderRadius: '24px',
              padding: '28px',
              margin: '24px 0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
            }}>
              <div style={{ flex: '1 1 300px' }}>
                <span style={{
                  display: 'inline-block',
                  color: '#ff9500',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
                  🔥 Limited Time Deal
                </span>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
                  HAPPY HOUR SPECIAL
                </h2>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 900, color: '#ff9500' }}>
                  20% OFF ALL BURGERS
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                  Monday – Thursday • 3 PM – 6 PM
                </p>
                <div style={{ marginTop: '16px' }}>
                  <Link
                    href="/menu"
                    style={{
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '12px 24px',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                      borderRadius: '14px',
                      boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
                    }}
                  >
                    ORDER NOW
                  </Link>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img 
                  src="/burger_hero.png" 
                  alt="Happy Hour Burger Deal" 
                  style={{ width: '140px', height: 'auto', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
                />
              </div>
            </section>

            <h2 className="richi-mobile-section-title">Categories</h2>
            <nav className="richi-category-bar" aria-label="Menu categories">
              {homeCategories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={selectedCategory === category ? 'active' : ''}
                  onClick={() => {
                    setSelectedCategory(category);
                    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <span>{CATEGORY_ICONS[category] || '🍽️'}</span>{category}
                </button>
              ))}
            </nav>

            <section className="richi-featured" aria-labelledby="featured-title">
              <div className="richi-section-heading">
                <div><span>🔥</span><h2 id="featured-title">Featured favorites</h2></div>
                <button type="button" onClick={scrollToMenu}>View all <ArrowIcon /></button>
              </div>
              <div className="richi-featured-layout">
                <div className="richi-featured-grid">
                  {(loading ? FALLBACK_MENU.slice(0, 4) : featuredItems).map((item, index) => (
                    <ProductCard key={item.id} item={item} index={index} compact onOpen={openCustomizer} onAdd={quickAdd} />
                  ))}
                </div>
                <aside className="richi-meal-deal">
                  <div className="richi-meal-copy">
                    <span>Meal of the day</span>
                    <h3>Double Delight Combo</h3>
                    <p>Double burger, golden fries and a cold drink.</p>
                    <div><strong>€16.90</strong><del>€20.50</del></div>
                    <button type="button" onClick={() => quickAdd(FALLBACK_MENU[1])}>Order now</button>
                  </div>
                  <img src="/burger_hero.png" alt="Double Delight burger combo" />
                </aside>
              </div>
            </section>

            <section className="richi-proof-strip" aria-label="Why customers choose Oh Richi">
              <div className="richi-review-quote">
                <span className="richi-avatar">S</span>
                <div>
                  <strong>What our customers say</strong>
                  <p>“The best burgers in town—fresh ingredients and amazing taste every time.”</p>
                  <small>— Sarah J.</small>
                </div>
              </div>
              <div className="richi-benefit"><span>⚡</span><div><strong>Fast delivery</strong><small>30 min or less</small></div></div>
              <div className="richi-benefit"><span>🥬</span><div><strong>Fresh ingredients</strong><small>Sourced daily</small></div></div>
              <div className="richi-benefit"><span>✓</span><div><strong>Best quality</strong><small>100% guaranteed</small></div></div>
            </section>
          </div>
        </div>

        <section id="menu" className="richi-menu-section" aria-labelledby="menu-title">
          <div className="richi-menu-header">
            <div>
              <span className="richi-kicker">Made fresh when you order</span>
              <h2 id="menu-title">{selectedCategory === 'All' ? 'Menu' : selectedCategory}</h2>
              <p>{selectedCategory === 'All' ? 'Find your new favorite.' : `Showing ${selectedCategory.toLowerCase()}.`}</p>
            </div>
            <label className="richi-search-box">
              <SearchIcon />
              <span className="sr-only">Search menu</span>
              <input
                type="search"
                placeholder="Search burgers, sides, drinks..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search">×</button>}
            </label>
          </div>

          <div className="richi-menu-chips" role="group" aria-label="Filter menu">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={selectedCategory === category ? 'active' : ''}
                onClick={() => setSelectedCategory(category)}
              >
                <span>{CATEGORY_ICONS[category] || '🍽️'}</span>{category}
              </button>
            ))}
          </div>

          {usingFallback && <p className="richi-menu-notice">Preview menu shown while the live catalog reconnects.</p>}

          {loading ? (
            <div className="richi-menu-grid" aria-label="Loading menu">
              {Array.from({ length: 8 }).map((_, index) => <div className="richi-product-skeleton" key={index} />)}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="richi-menu-grid">
              {filteredItems.map((item, index) => (
                <ProductCard key={item.id} item={item} index={index} onOpen={openCustomizer} onAdd={quickAdd} />
              ))}
            </div>
          ) : (
            <div className="richi-empty-menu">
              <span>🍽️</span>
              <h3>No dishes found</h3>
              <p>Try another search or clear your filters.</p>
              <button type="button" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>Show everything</button>
            </div>
          )}
        </section>
      </div>
      {toast && <div className="richi-toast" role="status"><span>✓</span>{toast}</div>}

      <ProductCustomizerModal
        item={customizingItem}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={({ item: customizedItem, quantity, variation, spiceLevel, addons, notes }) => {
          addToCart({
            itemId: customizedItem.id,
            name: customizedItem.name,
            imageUrl: customizedItem.imageUrl || null,
            basePrice: Number(customizedItem.basePrice),
            quantity,
            variation: variation ? {
              id: variation.id,
              name: variation.name,
              priceDifference: Number(variation.priceDifference || 0),
            } : null,
            spiceLevel: spiceLevel ? {
              id: spiceLevel.id,
              name: spiceLevel.name,
              priceDifference: Number(spiceLevel.priceDifference || 0),
            } : null,
            addons: addons.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) })),
            notes,
          });
          setToast(`${customizedItem.name} added to your cart!`);
          setCustomizingItem(null);
        }}
      />
    </CustomerLayout>
  );
}
