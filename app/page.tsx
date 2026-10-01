'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerLayout from './components/CustomerLayout';
import FireParticles from './components/FireParticles';
import { useCart } from './components/CartContext';

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  address: string;
  _count?: {
    menuItems: number;
  };
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  isAvailable?: boolean;
  options?: Array<{ id: string; isRequired: boolean }>;
  category?: { name: string };
  restaurant?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

export default function Door2DoorMarketplaceHomePage() {
  const router = useRouter();
  const { cart, addToCart } = useCart();
  const itemsCount = useMemo(() => cart.reduce((total, i) => total + i.quantity, 0), [cart]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'restaurants' | 'products'>('restaurants');

  const [toast, setToast] = useState('');

  const addPlainProductToCart = (item: MenuItem) => {
    if (item.options?.length) {
      router.push(`/menu/${item.id}`);
      return;
    }
    addToCart({
      restaurantId: item.restaurant?.id,
      itemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl || null,
      basePrice: Number(item.basePrice),
      quantity: 1,
      selectedOptions: [],
    });
    setToast(`Added ${item.name} to your cart!`);
  };

  useEffect(() => {
    let mounted = true;
    async function loadMarketplaceData() {
      try {
        setLoading(true);
        if (searchQuery.trim().length > 0) {
          const searchRes = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
          if (searchRes.ok) {
            const data = await searchRes.json();
            if (mounted) {
              setRestaurants(data.restaurants || []);
              setProducts(data.products || []);
              setLoading(false);
              return;
            }
          }
        }

        const [restaurantResponse, productResponse] = await Promise.all([
          fetch('/api/restaurants'),
          fetch('/api/menu'),
        ]);
        if (!restaurantResponse.ok || !productResponse.ok) throw new Error('Failed to fetch marketplace data');
        const [restaurantData, productData] = await Promise.all([
          restaurantResponse.json(),
          productResponse.json(),
        ]);
        if (mounted) {
          setRestaurants(Array.isArray(restaurantData) ? restaurantData : []);
          setProducts(Array.isArray(productData) ? productData : []);
        }
      } catch {
        if (mounted) {
          setRestaurants([]);
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadMarketplaceData();
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return restaurants.filter((r) => {
      const matchesSearch = !query
        || r.name.toLowerCase().includes(query)
        || r.description?.toLowerCase().includes(query)
        || r.address.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [restaurants, searchQuery]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !query
        || p.name.toLowerCase().includes(query)
        || p.description?.toLowerCase().includes(query)
        || p.category?.name.toLowerCase().includes(query)
        || p.restaurant?.name.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [products, searchQuery]);

  return (
    <CustomerLayout>
      <div className="d2d-home-container" style={{ paddingBottom: '90px' }}>
        
        {/* HERO SECTION WITH DOOR2DOOR BRANDING & BANNER */}
        <section
          className="d2d-hero-container"
          style={{
            position: 'relative',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #ffffff 0%, #fff6ef 50%, #ffedd5 100%)',
            padding: '36px 32px',
            marginBottom: '32px',
            boxShadow: '0 16px 40px rgba(249, 87, 0, 0.08)',
            border: '1px solid #ffd8be',
            overflow: 'hidden',
          }}
        >
          <div
            className="d2d-hero-content"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            {/* Left Content */}
            <div className="d2d-hero-copy" style={{ zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
                <img
                  src="/door2door_logo.jpg"
                  alt="Door2Door Logo"
                  style={{
                    width: '85px',
                    height: '85px',
                    borderRadius: '50%',
                    boxShadow: '0 8px 20px rgba(249, 87, 0, 0.2)',
                    objectFit: 'cover',
                  }}
                />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>
                    Door<span style={{ color: '#F95700' }}>2</span>Door
                  </h2>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.3px' }}>
                    Your Parcel • Our Priority
                  </span>
                </div>
              </div>

              <h1
                style={{
                  fontSize: '2.8rem',
                  lineHeight: '1.1',
                  fontWeight: 900,
                  color: '#0f172a',
                  marginBottom: '16px',
                  letterSpacing: '-1px',
                }}
              >
                Everything You Need, <br />
                <span style={{ color: '#F95700' }}>Delivered To You</span>
              </h1>

              {/* Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', backgroundColor: '#ffffff', padding: '6px 14px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span style={{ color: '#F95700' }}>✓</span> Fast Delivery
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', backgroundColor: '#ffffff', padding: '6px 14px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span style={{ color: '#F95700' }}>✓</span> Safe &amp; Reliable
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', backgroundColor: '#ffffff', padding: '6px 14px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span style={{ color: '#F95700' }}>♥</span> Your Priority
                </span>
              </div>

            </div>

            {/* Right Rider Banner Illustration */}
            <div className="d2d-hero-rider" style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
              <img
                className="d2d-hero-rider-image"
                src="/door2door_hero_rider.jpg"
                alt="Door2Door Delivery Rider"
                style={{
                  width: '100%',
                  maxHeight: '280px',
                  objectFit: 'cover',
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                }}
              />
            </div>
          </div>

          {/* Search sits below both hero columns, as in the desktop reference. */}
          <div
            className="d2d-hero-search"
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '6px 8px 6px 20px',
              boxShadow: '0 12px 32px rgba(249, 87, 0, 0.15)',
              border: '2px solid #F95700',
              maxWidth: '560px',
            }}
          >
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', marginRight: '12px' }}>
              <SearchIcon />
            </span>
            <input
              type="search"
              placeholder="Search for stores, products..."
              value={searchQuery}
              onFocus={() => router.push('/stores')}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '1.02rem',
                fontWeight: 600,
                color: '#0f172a',
                background: 'transparent',
                padding: '10px 0',
              }}
            />
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'restaurants' ? 'products' : 'restaurants')}
              style={{
                backgroundColor: '#F95700',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                width: '46px',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(249, 87, 0, 0.3)',
                transition: 'transform 0.2s ease',
              }}
              title="Switch between stores and products"
            >
              <FilterIcon />
            </button>
          </div>
        </section>

        {/* TAB NAVIGATION & DIRECTORY VIEW (STORES VS MEALS) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
            {activeTab === 'restaurants' ? 'Featured Stores & Restaurants' : 'Popular Dishes & Items'}
          </h2>

          <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('restaurants')}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: activeTab === 'restaurants' ? '#F95700' : 'transparent',
                color: activeTab === 'restaurants' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'restaurants' ? '0 4px 12px rgba(249, 87, 0, 0.25)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              🏪 Stores ({filteredRestaurants.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: activeTab === 'products' ? '#F95700' : 'transparent',
                color: activeTab === 'products' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'products' ? '0 4px 12px rgba(249, 87, 0, 0.25)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              🍔 Dishes &amp; Products ({filteredProducts.length})
            </button>
          </div>
        </div>

        {/* RESTAURANTS VIEW */}
        {activeTab === 'restaurants' && (
          <section>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: '260px', backgroundColor: '#f1f5f9', borderRadius: '24px', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : filteredRestaurants.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '24px',
                }}
              >
                {filteredRestaurants.map((r, index) => (
                  <Link
                    href={`/restaurants/${r.slug}`}
                    key={r.id}
                    style={{ textDecoration: 'none' }}
                  >
                    <article
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                        height: '100%',
                      }}
                    >
                      <div style={{ position: 'relative', height: '160px', backgroundColor: '#fff7ed', overflow: 'hidden' }}>
                        <img
                          src={r.logoUrl || '/burger_hero.png'}
                          alt={r.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/burger_hero.png'; }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            backgroundColor: '#ffffff',
                            color: '#F95700',
                            fontSize: '0.8rem',
                            fontWeight: 900,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                          }}
                        >
                          ★ {(4.8 - (index % 3) * 0.1).toFixed(1)}
                        </span>
                      </div>

                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                            {r.name}
                          </h3>
                          <p style={{ margin: '0 0 14px 0', fontSize: '0.88rem', color: '#64748b', lineHeight: '1.4' }}>
                            {r.description || 'Popular store serving fast deliveries.'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                            📍 {r.address}
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#F95700' }}>
                            Visit Store ›
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>No stores found</p>
                <button type="button" onClick={() => setSearchQuery('')} style={{ color: '#F95700', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Show all stores</button>
              </div>
            )}
          </section>
        )}

        {/* PRODUCTS / DISHES TAB VIEW */}
        {activeTab === 'products' && (
          <section>
            {filteredProducts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {filteredProducts.map((p) => (
                  <article
                    key={p.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '24px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div>
                      <img
                        src={p.imageUrl || '/burger_hero.png'}
                        alt={p.name}
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '16px', marginBottom: '12px' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/burger_hero.png'; }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F95700', backgroundColor: '#fff7ed', padding: '4px 10px', borderRadius: '12px' }}>
                        {p.restaurant?.name || 'Partner Store'}
                      </span>
                      <h4 style={{ margin: '8px 0 4px 0', fontSize: '1.08rem', fontWeight: 900, color: '#0f172a' }}>{p.name}</h4>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0', lineHeight: '1.4' }}>{p.description}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>€{Number(p.basePrice).toFixed(2)}</strong>
                      <button
                        type="button"
                        onClick={() => addPlainProductToCart(p)}
                        style={{
                          backgroundColor: '#F95700',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '14px',
                          padding: '8px 16px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(249, 87, 0, 0.2)',
                        }}
                      >
                        Add +
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>No products found</p>
              </div>
            )}
          </section>
        )}

        {/* BOTTOM NAVIGATION BAR (FIXED FOR MOBILE / DESKTOP DISCOVERY) */}
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
            boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('restaurants')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: '#F95700',
              fontWeight: 800,
              fontSize: '0.78rem',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>🏠</span>
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restaurants')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: activeTab === 'restaurants' ? '#F95700' : '#64748b',
              fontWeight: 800,
              fontSize: '0.78rem',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>🏪</span>
            <span>Stores</span>
          </button>

          <Link
            href="/checkout"
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: '#64748b',
              fontWeight: 800,
              fontSize: '0.78rem',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '1.3rem', position: 'relative' }}>
              🛒
              {itemsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    backgroundColor: '#F95700',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                  }}
                >
                  {itemsCount}
                </span>
              )}
            </span>
            <span>Cart</span>
          </Link>

          <Link
            href="/track-order"
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: '#64748b',
              fontWeight: 800,
              fontSize: '0.78rem',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>📋</span>
            <span>Orders</span>
          </Link>

          <Link
            href="/dashboard"
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: '#64748b',
              fontWeight: 800,
              fontSize: '0.78rem',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>•••</span>
            <span>More</span>
          </Link>
        </nav>

        {toast && <div className="richi-toast" role="status"><span>✓</span>{toast}</div>}

      </div>
    </CustomerLayout>
  );
}
