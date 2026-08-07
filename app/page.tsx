'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CustomerLayout from './components/CustomerLayout';
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
    setSelectedVariation(item.variations[0] || null);
    setSelectedSpice(item.itemSpiceLevels[0]?.spiceLevel || null);
    setSelectedAddons([]);
    setQuantity(1);
    setItemNotes('');
  };

  const quickAdd = (item: MenuItem) => {
    const hasChoices = item.variations.length || item.itemSpiceLevels.length || item.itemAddons.length;
    if (hasChoices) return openCustomizer(item);
    addToCart({
      itemId: item.id, name: item.name, imageUrl: item.imageUrl, basePrice: Number(item.basePrice),
      quantity: 1, variation: null, spiceLevel: null, addons: [], notes: '',
    });
    setToast(`${item.name} added to your cart`);
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
              <img src="/burger_hero.png" alt="" />
            </section>

            <section className="richi-promo-card richi-booking-card">
              <span className="richi-micro-label">Table reservation</span>
              <h2>Book your table<br />in advance</h2>
              <div className="richi-booking-fields">
                <span>Jul 24, 2026</span><span>7:00 PM</span><span>2 People</span>
              </div>
              <Link href="/account">Book now</Link>
            </section>
          </aside>

          <div className="richi-home-main">
            <section className="richi-hero" aria-labelledby="richi-hero-title">
              <div className="richi-hero-glow" aria-hidden="true" />
              <div className="richi-spark richi-spark-one" aria-hidden="true">✦</div>
              <div className="richi-spark richi-spark-two" aria-hidden="true">•</div>
              <div className="richi-hero-copy">
                <span className="richi-fresh-pill">100% fresh&nbsp; • &nbsp;premium ingredients</span>
                <h1 id="richi-hero-title">The best<br /><em>Burger</em><br />in town</h1>
                <div className="richi-review-row">
                  <span aria-label="5 out of 5 stars">★★★★★</span>
                  <small>4.8 (2.4K+ reviews)</small>
                </div>
                <p>Fresh ingredients, flame-grilled patties and bold flavor in every bite.</p>
                <div className="richi-hero-actions">
                  <button type="button" className="richi-primary-action" onClick={scrollToMenu}>Order now <ArrowIcon /></button>
                  <button type="button" className="richi-secondary-action" onClick={scrollToMenu}>View menu</button>
                </div>
              </div>
              <div className="richi-hero-art" aria-hidden="true">
                <img src="/burger_hero.png" alt="" />
                <div className="richi-beef-seal"><b>100%</b><span>premium</span><strong>Beef</strong></div>
                <span className="richi-chilli">🌶️</span>
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

      {customizingItem && (
        <div className="richi-modal-backdrop" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setCustomizingItem(null);
        }}>
          <section className="richi-customizer" role="dialog" aria-modal="true" aria-labelledby="customizer-title">
            <button className="richi-modal-close" type="button" onClick={() => setCustomizingItem(null)} aria-label="Close customizer">×</button>
            <button className="richi-modal-favorite" type="button" aria-label="Save as favorite">&hearts;</button>
            <div className="richi-customizer-art">
              <img src={customizingItem.imageUrl || '/burger_hero.png'} alt={customizingItem.name} />
              <span>Made fresh for you</span>
            </div>
            <div className="richi-customizer-body">
              <span className="richi-kicker">Customize your order</span>
              <h2 id="customizer-title">{customizingItem.name}</h2>
              <p className="richi-customizer-description">{customizingItem.description}</p>

              {customizingItem.variations.length > 0 && (
                <fieldset className="richi-option-group">
                  <legend><span>1</span> Choose your size</legend>
                  <div className="richi-choice-grid">
                    {customizingItem.variations.map((variation) => (
                      <button
                        type="button"
                        key={variation.id}
                        className={selectedVariation?.id === variation.id ? 'active' : ''}
                        onClick={() => setSelectedVariation(variation)}
                      >
                        <span>{variation.name}</span>
                        <small>{Number(variation.priceDifference) > 0 ? `+${money(variation.priceDifference)}` : 'Included'}</small>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {customizingItem.itemSpiceLevels.length > 0 && (
                <fieldset className="richi-option-group">
                  <legend><span>2</span> Pick your heat</legend>
                  <div className="richi-choice-grid">
                    {customizingItem.itemSpiceLevels.map(({ spiceLevel }) => (
                      <button
                        type="button"
                        key={spiceLevel.id}
                        className={selectedSpice?.id === spiceLevel.id ? 'active' : ''}
                        onClick={() => setSelectedSpice(spiceLevel)}
                      >
                        <span>{spiceLevel.name}</span>
                        <small>{'🌶'.repeat(Math.max(1, Math.min(3, spiceLevel.value)))}</small>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {customizingItem.itemAddons.length > 0 && (
                <fieldset className="richi-option-group">
                  <legend><span>3</span> Add something extra</legend>
                  <div className="richi-addon-list">
                    {customizingItem.itemAddons
                      .filter(({ addon }) => addon.isAvailable !== false)
                      .map(({ addon }) => {
                        const active = selectedAddons.some((selected) => selected.id === addon.id);
                        return (
                          <button type="button" key={addon.id} className={active ? 'active' : ''} onClick={() => toggleAddon(addon)}>
                            <i>{active ? '✓' : '+'}</i><span>{addon.name}</span><strong>+{money(addon.price)}</strong>
                          </button>
                        );
                      })}
                  </div>
                </fieldset>
              )}

              <label className="richi-notes-field">
                <span>Special instructions <small>Optional</small></span>
                <textarea
                  rows={2}
                  placeholder="No onions, sauce on the side..."
                  value={itemNotes}
                  onChange={(event) => setItemNotes(event.target.value)}
                />
              </label>

              <div className="richi-customizer-footer">
                <div className="richi-quantity-control">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">+</button>
                </div>
                <button type="button" className="richi-add-customized" onClick={addCustomizedItem}>
                  <span>Add to cart</span><strong>{money(modalPrice)}</strong>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </CustomerLayout>
  );
}
