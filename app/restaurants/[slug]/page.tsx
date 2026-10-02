'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../../components/CustomerLayout';
import { useCart } from '../../components/CartContext';

type PriceValue = number | string;

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: PriceValue;
  isAvailable?: boolean;
  options?: Array<{ id: string }>;
  category: { name: string };
}

interface RestaurantData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  address: string;
  phone: string;
  whatsapp: string | null;
  isOpen: boolean;
  acceptingOrders: boolean;
  openingTime: string | null;
  closingTime: string | null;
  deliveryFee: number;
  minimumOrderAmount: number;
  menuCategories: Array<{
    id: string;
    name: string;
    sortOrder: number;
    menuItems: MenuItem[];
  }>;
}

const CATEGORY_ICONS: Record<string, string> = {
  All: '✦', Burgers: '🍔', Pizza: '🍕', Pizzas: '🍕', Chicken: '🍗', Sides: '🍟',
  Drinks: '🥤', Sweets: '🍨', Toppings: '🧀', Spices: '🌶️', Saucen: '🥫',
};

export default function RestaurantStorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug } = use(params);
  const { addToCart, cart } = useCart();
  const cartCount = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);

  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'menu' | 'info'>('menu');

  const [toast, setToast] = useState('');

  const addPlainItemToCart = (item: MenuItem) => {
    if (!restaurant?.acceptingOrders) {
      setToast('This restaurant is currently closed.');
      return;
    }
    if (item.options?.length) {
      router.push(`/menu/${item.id}`);
      return;
    }
    addToCart({
      restaurantId: restaurant?.id,
      itemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl || null,
      basePrice: Number(item.basePrice),
      quantity: 1,
      selectedOptions: [],
    });
    setToast(`Added ${item.name} to cart!`);
  };

  useEffect(() => {
    let mounted = true;
    async function loadRestaurant() {
      try {
        setLoading(true);
        const res = await fetch(`/api/restaurants/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          throw new Error('Restaurant not found');
        }
        const data = await res.json();
        if (mounted) {
          setRestaurant(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Could not load restaurant');
          setLoading(false);
        }
      }
    }
    loadRestaurant();
    return () => { mounted = false; };
  }, [slug]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const allMenuItems = useMemo(() => {
    if (!restaurant?.menuCategories) return [];
    return restaurant.menuCategories.flatMap((cat) =>
      cat.menuItems.map((item) => ({
        ...item,
        category: { name: cat.name },
      }))
    );
  }, [restaurant]);

  const categories = useMemo(() => {
    if (!restaurant?.menuCategories) return ['All'];
    return ['All', ...restaurant.menuCategories.map((c) => c.name)];
  }, [restaurant]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allMenuItems.filter((item) => {
      const inCategory = selectedCategory === 'All' || item.category?.name === selectedCategory;
      const inSearch = !query || item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
      return inCategory && inSearch && item.isAvailable !== false;
    });
  }, [allMenuItems, searchQuery, selectedCategory]);

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
        
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
            <p>Loading store menu...</p>
          </div>
        ) : error || !restaurant ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '3rem' }}>🏪</span>
            <h2 style={{ color: '#0f172a', margin: '16px 0 8px 0' }}>Store Not Found</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              We couldn&apos;t find a store matching &quot;{slug}&quot;.
            </p>
            <Link
              href="/stores"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#F95700',
                color: '#ffffff',
                borderRadius: '16px',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Browse All Stores
            </Link>
          </div>
        ) : (
          <>
            {/* HERO COVER HEADER */}
            <div
              style={{
                position: 'relative',
                height: '200px',
                borderRadius: '24px',
                overflow: 'hidden',
                marginBottom: '-40px',
              }}
            >
              <img
                src={restaurant.coverImageUrl || '/pizza_house_store.jpg'}
                alt={restaurant.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/burger_hero.png'; }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '16px',
                }}
              >
                <Link
                  href="/stores"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f172a',
                    textDecoration: 'none',
                    fontWeight: 900,
                  }}
                >
                  ←
                </Link>
              </div>
            </div>

            {/* STORE DETAILS CARD (MATCHING SCREEN 3 OF MOCKUP) */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              {/* Store Logo Circle */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#fff7ed',
                  border: '3px solid #ffffff',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}
              >
                <img
                  src={restaurant.logoUrl || '/burger_hero.png'}
                  alt={restaurant.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/burger_hero.png'; }}
                />
              </div>

              {/* Store Titles & Info */}
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                  {restaurant.name}
                </h1>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                  {restaurant.description || 'Marketplace restaurant'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
                  <span>Delivery €{Number(restaurant.deliveryFee).toFixed(2)}</span>
                  <span>Minimum €{Number(restaurant.minimumOrderAmount).toFixed(2)}</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 800, color: restaurant.acceptingOrders ? '#16a34a' : '#dc2626' }}>
                  {restaurant.acceptingOrders ? 'Open now' : 'Closed'}
                  {restaurant.openingTime && restaurant.closingTime ? ` · ${restaurant.openingTime}–${restaurant.closingTime}` : ''}
                </div>
              </div>
            </div>

            {/* TAB SELECTOR: MENU / INFO / REVIEWS */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'menu' ? '3px solid #F95700' : 'none',
                  color: activeTab === 'menu' ? '#F95700' : '#64748b',
                  fontWeight: 900,
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                }}
              >
                Menu
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'info' ? '3px solid #F95700' : 'none',
                  color: activeTab === 'info' ? '#F95700' : '#64748b',
                  fontWeight: 900,
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                }}
              >
                Info
              </button>
            </div>

            {/* MENU TAB VIEW */}
            {activeTab === 'menu' && (
              <>
                {/* SEARCH MENU ITEMS */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '8px 16px',
                    border: '1.5px solid #e2e8f0',
                    marginBottom: '20px',
                  }}
                >
                  <span style={{ color: '#94a3b8', marginRight: '10px' }}>🔍</span>
                  <input
                    type="search"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>×</button>
                  )}
                </div>

                {/* CATEGORY CHIPS */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        backgroundColor: selectedCategory === cat ? '#F95700' : '#ffffff',
                        color: selectedCategory === cat ? '#ffffff' : '#64748b',
                        border: selectedCategory === cat ? 'none' : '1px solid #e2e8f0',
                        borderRadius: '20px',
                        padding: '6px 18px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{CATEGORY_ICONS[cat] || '🍽️'} </span>
                      {cat}
                    </button>
                  ))}
                </div>

                {/* PRODUCTS LIST */}
                {filteredItems.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredItems.map((item) => (
                      <article
                        key={item.id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '20px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                        }}
                      >
                        <img
                          src={item.imageUrl || '/burger_hero.png'}
                          alt={item.name}
                          style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '16px', flexShrink: 0 }}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/burger_hero.png'; }}
                        />

                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.08rem', fontWeight: 900, color: '#0f172a' }}>
                            {item.name}
                          </h3>
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: '#64748b', lineHeight: '1.4' }}>
                            {item.description || 'Freshly prepared with authentic ingredients.'}
                          </p>
                          <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                            ${Number(item.basePrice).toFixed(2)}
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() => addPlainItemToCart(item)}
                          style={{
                            backgroundColor: '#F95700',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            fontSize: '1.4rem',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(249, 87, 0, 0.25)',
                          }}
                        >
                          +
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: 800, color: '#0f172a' }}>No menu items found</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'info' && (
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 12px 0', fontWeight: 900 }}>About {restaurant.name}</h3>
                <p style={{ color: '#64748b', lineHeight: '1.6' }}>{restaurant.description}</p>
                <div style={{ marginTop: '16px', fontWeight: 700, color: '#334155' }}>
                  📍 Address: {restaurant.address}
                </div>
              </div>
            )}

          </>
        )}

        {/* BOTTOM NAVIGATION BAR */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 100,
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontWeight: 800, fontSize: '0.78rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🏠</span>
            <span>Home</span>
          </Link>
          <Link href="/stores" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#F95700', fontWeight: 800, fontSize: '0.78rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🏪</span>
            <span>Stores</span>
          </Link>
          <Link href="/checkout" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontWeight: 800, fontSize: '0.78rem', position: 'relative' }}>
            <span style={{ fontSize: '1.3rem', position: 'relative' }}>
              🛒
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-10px', backgroundColor: '#F95700', color: '#ffffff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                  {cartCount}
                </span>
              )}
            </span>
            <span>Cart</span>
          </Link>
          <Link href="/track-order" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontWeight: 800, fontSize: '0.78rem' }}>
            <span style={{ fontSize: '1.3rem' }}>📋</span>
            <span>Orders</span>
          </Link>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontWeight: 800, fontSize: '0.78rem' }}>
            <span style={{ fontSize: '1.3rem' }}>•••</span>
            <span>More</span>
          </Link>
        </nav>

        {toast && <div className="richi-toast" role="status"><span>✓</span>{toast}</div>}

      </div>
    </CustomerLayout>
  );
}
