'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomerLayout from '../../components/CustomerLayout';
import { useCart } from '../../components/CartContext';

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/menu?id=${encodeURIComponent(params.id)}`)
      .then(async (response) => response.ok ? setProduct(await response.json()) : setError('Product not found.'))
      .catch(() => setError('Unable to load product.'));
  }, [params.id]);

  const selectedOptions = useMemo(() => (product?.options || []).flatMap((option: any) => {
    const item = option.items.find((candidate: any) => candidate.id === selected[option.id]);
    return item ? [{ optionId: option.id, optionItemId: item.id, optionName: option.name, name: item.name, priceDelta: Number(item.priceDelta) }] : [];
  }), [product, selected]);
  const unitPrice = Number(product?.basePrice || 0) + selectedOptions.reduce((sum: number, option: any) => sum + option.priceDelta, 0);

  if (error) return <CustomerLayout><div style={{ padding: '60px 24px', textAlign: 'center' }}>{error}</div></CustomerLayout>;
  if (!product) return <CustomerLayout><div style={{ padding: '60px 24px', textAlign: 'center' }}>Loading product…</div></CustomerLayout>;

  const add = () => {
    if (product.restaurant?.acceptingOrders === false) {
      setError('This restaurant is currently closed.');
      return;
    }
    const missing = product.options.find((option: any) => option.isRequired && !selected[option.id]);
    if (missing) {
      setError(`Choose one ${missing.name}.`);
      return;
    }
    addToCart({
      restaurantId: product.restaurantId,
      itemId: product.id,
      name: product.name,
      imageUrl: product.images?.[0]?.imageUrl || product.imageUrl,
      basePrice: Number(product.basePrice),
      quantity,
      selectedOptions,
    });
    router.back();
  };

  return <CustomerLayout><div style={{ maxWidth: '760px', margin: '30px auto', padding: '24px' }}>
    <button className="btn btn-secondary" style={{ width: 'auto', marginBottom: '20px' }} onClick={() => router.back()}>Back</button>
    <div className="dashboard-card">
      <img src={product.images?.[0]?.imageUrl || product.imageUrl || '/burger_hero.png'} alt={product.name} style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', borderRadius: '16px' }} />
      <h1 style={{ marginTop: '20px' }}>{product.name}</h1>
      <p style={{ color: 'var(--text-muted)' }}>{product.description}</p>
      <h2 style={{ margin: '16px 0' }}>€{unitPrice.toFixed(2)}</h2>
      {product.options.map((option: any) => <fieldset key={option.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
        <legend style={{ fontWeight: 800 }}>{option.name}{option.isRequired ? ' *' : ''}</legend>
        {option.items.map((item: any) => <label key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '8px 0', cursor: 'pointer' }}>
          <span><input type="radio" name={option.id} checked={selected[option.id] === item.id} onChange={() => setSelected({ ...selected, [option.id]: item.id })} /> {item.name}</span>
          <span>{Number(item.priceDelta) ? `+€${Number(item.priceDelta).toFixed(2)}` : 'Included'}</span>
        </label>)}
      </fieldset>)}
      {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}
      <div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" min="1" max="99" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(99, Number(event.target.value))))} /></div>
      <button className="btn btn-primary" onClick={add}>Add to cart · €{(unitPrice * quantity).toFixed(2)}</button>
    </div>
  </div></CustomerLayout>;
}
