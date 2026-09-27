'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import { useCart } from '../components/CartContext';

type Tab = 'stores' | 'products';
type Store = { id: string; slug: string; name: string; description?: string | null; logoUrl?: string | null; locations?: { city: string }[]; _count?: { menuItems: number } };
type Product = { id: string; name: string; description?: string | null; imageUrl?: string | null; basePrice: number; category?: { name: string }; restaurant?: { id: string; name: string; slug: string; logoUrl?: string | null } };
const categories = ['All', 'Food', 'Grocery', 'Pharmacy', 'Fashion', 'Electronics'];

export default function StoresListingPage() {
  const params = useSearchParams();
  const { cartCount, addToCart } = useCart();
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'products' ? 'products' : 'stores');
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState('All');
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setQuery(params.get('q') || ''); if (params.get('tab') === 'products') setTab('products'); }, [params]);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        if (query.trim()) {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
          if (!response.ok) throw new Error('Search failed');
          const data = await response.json();
          if (active) { setStores(data.restaurants || []); setProducts(data.products || []); }
        } else {
          const [storeResponse, productResponse] = await Promise.all([fetch('/api/restaurants'), fetch('/api/menu')]);
          if (active) { setStores(storeResponse.ok ? await storeResponse.json() : []); setProducts(productResponse.ok ? await productResponse.json() : []); }
        }
      } catch { if (active) { setStores([]); setProducts([]); } } finally { if (active) setLoading(false); }
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  const matchingStores = useMemo(() => stores.filter((store) => category === 'All' || `${store.name} ${store.description || ''}`.toLowerCase().includes(category.toLowerCase())), [stores, category]);
  const matchingProducts = useMemo(() => products.filter((product) => category === 'All' || `${product.name} ${product.description || ''} ${product.category?.name || ''} ${product.restaurant?.name || ''}`.toLowerCase().includes(category.toLowerCase())), [products, category]);
  const addProduct = (product: Product) => addToCart({ restaurantId: product.restaurant?.id, itemId: product.id, name: product.name, imageUrl: product.imageUrl || null, basePrice: Number(product.basePrice), quantity: 1, variation: null, spiceLevel: null, addons: [], notes: '' });

  return <CustomerLayout><main className="d2d-discovery-page">
    <header className="d2d-discovery-header"><Link href="/" aria-label="Back to home" className="d2d-back-button">←</Link><div className="d2d-discovery-brand"><img src="/door2door_logo.jpg" alt="Door2Door" /><div><strong>Door<span>2</span>Door</strong><small>Your Parcel · Our Priority</small></div></div></header>
    <label className="d2d-discovery-search"><span aria-hidden="true">⌕</span><input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === 'stores' ? 'Search stores...' : 'Search products...'} /><span className="d2d-filter-button" aria-hidden="true">☷</span></label>
    <div className="d2d-discovery-tabs" role="tablist"><button type="button" className={tab === 'stores' ? 'active' : ''} onClick={() => setTab('stores')}>Stores</button><button type="button" className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Products</button></div>
    <div className="d2d-category-pills">{categories.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
    {loading ? <p className="d2d-discovery-empty">Searching marketplace…</p> : tab === 'stores' ? <section className="d2d-results-list">{matchingStores.map((store) => <Link href={`/restaurants/${store.slug}`} key={store.id} className="d2d-store-result"><img src={store.logoUrl || '/door2door_logo.jpg'} alt="" /><div><h2>{store.name}</h2><p>{store.description || 'Marketplace store'} · {store.locations?.[0]?.city || 'Nearby'}</p><span>★ Marketplace store · {store._count?.menuItems || 0} products</span></div><b>›</b></Link>)}{matchingStores.length === 0 && <p className="d2d-discovery-empty">No stores match your search.</p>}</section> : <section className="d2d-product-results">{matchingProducts.map((product) => <article key={product.id} className="d2d-product-result"><img src={product.imageUrl || '/burger_hero.png'} alt="" /><div><p>{product.restaurant?.name || product.category?.name || 'Marketplace product'}</p><h2>{product.name}</h2><span>{product.description || 'Available now'}</span><strong>€{Number(product.basePrice).toFixed(2)}</strong></div><button type="button" onClick={() => addProduct(product)} aria-label={`Add ${product.name} to cart`}>+</button></article>)}{matchingProducts.length === 0 && <p className="d2d-discovery-empty">No products match your search.</p>}</section>}
    {cartCount > 0 && <Link href="/checkout" className="d2d-discovery-cart">Cart ({cartCount})</Link>}
  </main></CustomerLayout>;
}
