'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CustomerLayout from '../components/CustomerLayout';
import { useCart } from '../components/CartContext';

interface StoreItem {
  id: string;
  slug: string;
  name: string;
  categoryTag: string;
  rating: number;
  reviewsCount: number;
  deliveryTime: string;
  deliveryFee: string;
  promoBadge?: string;
  imageUrl: string;
  isFavorite?: boolean;
}

const STORES_LIST: StoreItem[] = [
  {
    id: 'pizza-house',
    slug: 'oh-richi',
    name: 'Pizza House',
    categoryTag: 'Fast Food • Restaurant',
    rating: 4.5,
    reviewsCount: 1200,
    deliveryTime: '30 min',
    deliveryFee: '$2.00',
    promoBadge: '20% OFF',
    imageUrl: '/pizza_house_store.jpg',
  },
  {
    id: 'fresh-mart',
    slug: 'bella-italia',
    name: 'Fresh Mart',
    categoryTag: 'Grocery • Supermarket',
    rating: 4.3,
    reviewsCount: 856,
    deliveryTime: '25 min',
    deliveryFee: '$1.50',
    imageUrl: '/fresh_mart_store.jpg',
  },
  {
    id: 'city-pharmacy',
    slug: 'tokyo-sushi',
    name: 'City Pharmacy',
    categoryTag: 'Pharmacy • Health',
    rating: 4.7,
    reviewsCount: 642,
    deliveryTime: '20 min',
    deliveryFee: '$1.00',
    imageUrl: '/door2door_promo_box.jpg',
  },
  {
    id: 'fashion-hub',
    slug: 'smash-burger-express',
    name: 'Fashion Hub',
    categoryTag: 'Clothing • Fashion',
    rating: 4.2,
    reviewsCount: 453,
    deliveryTime: '35 min',
    deliveryFee: '$2.50',
    imageUrl: '/door2door_hero_rider.jpg',
  },
  {
    id: 'tech-world',
    slug: 'oh-richi',
    name: 'Tech World',
    categoryTag: 'Electronics • Gadgets',
    rating: 4.6,
    reviewsCount: 321,
    deliveryTime: '40 min',
    deliveryFee: '$3.00',
    imageUrl: '/door2door_logo.jpg',
  },
];

const CATEGORY_PILLS = ['All', 'Food', 'Grocery', 'Pharmacy', 'Fashion', 'Electronics'];

export default function StoresListingPage() {
  const { cart } = useCart();
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredStores = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return STORES_LIST.filter((s) => {
      const matchesSearch = !query || s.name.toLowerCase().includes(query) || s.categoryTag.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'All'
        || (selectedCategory === 'Food' && s.categoryTag.toLowerCase().includes('restaurant'))
        || (selectedCategory === 'Grocery' && s.categoryTag.toLowerCase().includes('grocery'))
        || (selectedCategory === 'Pharmacy' && s.categoryTag.toLowerCase().includes('pharmacy'))
        || (selectedCategory === 'Fashion' && s.categoryTag.toLowerCase().includes('fashion'))
        || (selectedCategory === 'Electronics' && s.categoryTag.toLowerCase().includes('electronics'));
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
        
        {/* HEADER & LOCATION */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Stores</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 800, color: '#F95700', backgroundColor: '#fff7ed', padding: '6px 14px', borderRadius: '20px' }}>
            <span>📍</span>
            <span>New York, NY</span>
            <span style={{ fontSize: '0.75rem' }}>▼</span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '8px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1.5px solid #e2e8f0',
            marginBottom: '20px',
          }}
        >
          <span style={{ color: '#94a3b8', marginRight: '10px' }}>🔍</span>
          <input
            type="search"
            placeholder="Search restaurants, cuisines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#0f172a',
            }}
          />
          <button
            type="button"
            style={{
              backgroundColor: '#F95700',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            ⚙️
          </button>
        </div>

        {/* CATEGORY FILTER PILLS */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
          {CATEGORY_PILLS.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                backgroundColor: selectedCategory === cat ? '#F95700' : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : '#64748b',
                border: selectedCategory === cat ? 'none' : '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '8px 20px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: selectedCategory === cat ? '0 4px 12px rgba(249, 87, 0, 0.25)' : 'none',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* VERTICAL STORE LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredStores.map((store) => (
            <Link
              href={`/restaurants/${store.slug}`}
              key={store.id}
              style={{ textDecoration: 'none' }}
            >
              <article
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '24px',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  position: 'relative',
                }}
              >
                {/* Store Thumbnail */}
                <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0, borderRadius: '18px', overflow: 'hidden' }}>
                  <img
                    src={store.imageUrl}
                    alt={store.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/burger_hero.png'; }}
                  />
                  {store.promoBadge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      {store.promoBadge}
                    </span>
                  )}
                </div>

                {/* Store Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                      {store.name}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(store.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        color: favorites[store.id] ? '#ef4444' : '#cbd5e1',
                      }}
                    >
                      ♥
                    </button>
                  </div>

                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>
                    {store.categoryTag}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px', fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                    <span style={{ color: '#f59e0b' }}>★ {store.rating} ({store.reviewsCount})</span>
                    <span>⏱ {store.deliveryTime}</span>
                    <span>🛵 {store.deliveryFee}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

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
          <button type="button" style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#F95700', fontWeight: 800, fontSize: '0.78rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🏪</span>
            <span>Stores</span>
          </button>
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
          <Link href="/orders" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontWeight: 800, fontSize: '0.78rem' }}>
            <span style={{ fontSize: '1.3rem' }}>📋</span>
            <span>Orders</span>
          </Link>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontWeight: 800, fontSize: '0.78rem' }}>
            <span style={{ fontSize: '1.3rem' }}>•••</span>
            <span>More</span>
          </Link>
        </nav>

      </div>
    </CustomerLayout>
  );
}
