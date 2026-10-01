'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CustomerLayout from '../components/CustomerLayout';
import { useCart } from '../components/CartContext';

export default function MenuPage() {
  const { addToCart } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  useEffect(() => { fetch('/api/menu').then(async (response) => { if (response.ok) setItems(await response.json()); }); }, []);
  const visible = useMemo(() => items.filter((item) => item.isAvailable !== false && `${item.name} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  return <CustomerLayout><div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
    <div className="flex-between" style={{ marginBottom: '24px' }}><div><h1>Menu</h1><p>Products available for guest checkout.</p></div><input className="form-input" style={{ maxWidth: '280px' }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" /></div>
    <div className="grid-3">{visible.map((item) => <article className="dashboard-card" key={item.id}>
      <Link href={`/menu/${item.id}`}><img src={item.images?.[0]?.imageUrl || item.imageUrl || '/burger_hero.png'} alt={item.name} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px' }} /></Link>
      <h2 style={{ marginTop: '14px' }}>{item.name}</h2><p style={{ color: 'var(--text-muted)' }}>{item.description}</p>
      <div className="flex-between" style={{ marginTop: '16px' }}><strong>€{Number(item.basePrice).toFixed(2)}</strong>
        {item.options?.length
          ? <Link href={`/menu/${item.id}`} className="btn btn-primary" style={{ width: 'auto' }}>Choose options</Link>
          : <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => addToCart({ restaurantId: item.restaurantId, itemId: item.id, name: item.name, imageUrl: item.images?.[0]?.imageUrl || item.imageUrl, basePrice: Number(item.basePrice), quantity: 1, selectedOptions: [] })}>Add</button>}
      </div>
    </article>)}</div>
  </div></CustomerLayout>;
}
