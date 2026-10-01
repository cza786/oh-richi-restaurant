'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const emptyProduct = { id: '', restaurantId: '', categoryId: '', name: '', description: '', imageUrl: '', basePrice: 0, sortOrder: 0, isAvailable: true, isActive: true, images: [] as any[], options: [] as any[] };

export default function MenuManagementPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [newCategory, setNewCategory] = useState({ restaurantId: '', name: '', imageUrl: '', sortOrder: 0 });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [productResponse, restaurantResponse, categoryResponse] = await Promise.all([fetch('/api/admin/products'), fetch('/api/admin/restaurants'), fetch('/api/admin/categories')]);
    if (productResponse.ok) setProducts(await productResponse.json());
    if (restaurantResponse.ok) {
      const data = await restaurantResponse.json();
      setRestaurants(data);
      setNewCategory((current) => ({ ...current, restaurantId: current.restaurantId || data[0]?.id || '' }));
    }
    if (categoryResponse.ok) setCategories(await categoryResponse.json());
  }, []);
  useEffect(() => { void load(); }, [load]);

  const openNew = () => {
    const restaurantId = restaurants[0]?.id || '';
    setEditing({ ...emptyProduct, restaurantId, categoryId: categories.find((category) => category.restaurantId === restaurantId)?.id || '' });
  };
  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/menu', { method: editing.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || 'Unable to save product.');
    setEditing(null);
    await load();
  };
  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCategory) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || 'Unable to create category.');
    setNewCategory({ ...newCategory, name: '', imageUrl: '', sortOrder: 0 });
    await load();
  };
  const archive = async (id: string) => {
    if (!window.confirm('Archive this product?')) return;
    await fetch(`/api/menu?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setEditing(null);
    await load();
  };
  const updateOption = (optionIndex: number, patch: any) => setEditing({ ...editing, options: editing.options.map((option: any, index: number) => index === optionIndex ? { ...option, ...patch } : option) });
  const updateItem = (optionIndex: number, itemIndex: number, patch: any) => updateOption(optionIndex, { items: editing.options[optionIndex].items.map((item: any, index: number) => index === itemIndex ? { ...item, ...patch } : item) });

  return <DashboardLayout>
    <div className="flex-between" style={{ marginBottom: '24px' }}><div><h1 className="heading-bebas" style={{ fontSize: '2.4rem' }}>Catalog</h1><p style={{ color: 'var(--text-muted)' }}>Tenant-scoped categories, products, images and options.</p></div><button className="btn btn-primary" style={{ width: 'auto' }} onClick={openNew}>Add product</button></div>
    {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}
    <form className="dashboard-card" onSubmit={addCategory} style={{ marginBottom: '20px' }}><h2>Add category</h2><div className="grid-2"><select className="form-input" value={newCategory.restaurantId} onChange={(event) => setNewCategory({ ...newCategory, restaurantId: event.target.value })} required>{restaurants.map((restaurant) => <option value={restaurant.id} key={restaurant.id}>{restaurant.name}</option>)}</select><input className="form-input" value={newCategory.name} onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })} placeholder="Category name" required /><input className="form-input" value={newCategory.imageUrl} onChange={(event) => setNewCategory({ ...newCategory, imageUrl: event.target.value })} placeholder="Category image URL" /><input className="form-input" type="number" value={newCategory.sortOrder} onChange={(event) => setNewCategory({ ...newCategory, sortOrder: Number(event.target.value) })} placeholder="Sort order" /></div><button className="btn btn-secondary" style={{ width: 'auto', marginTop: '12px' }}>Create category</button></form>
    <div className="dashboard-card"><div className="pos-table-wrapper"><table className="pos-table"><thead><tr><th>Product</th><th>Tenant</th><th>Category</th><th>Price</th><th>Order</th><th>Options</th><th>Action</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.restaurant.name}</td><td>{product.category.name}</td><td>€{Number(product.basePrice).toFixed(2)}</td><td>{product.sortOrder}</td><td>{product.options.length}</td><td><button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setEditing({ ...product, images: product.images || [], options: product.options || [] })}>Edit</button></td></tr>)}</tbody></table></div></div>

    {editing && <div className="drawer open"><div className="drawer-content"><div className="drawer-header"><h2>{editing.id ? 'Edit product' : 'Add product'}</h2><button onClick={() => setEditing(null)}>×</button></div><form onSubmit={saveProduct} style={{ padding: '20px' }}>
      <label className="form-group"><span className="form-label">Restaurant</span><select className="form-input" value={editing.restaurantId} onChange={(event) => setEditing({ ...editing, restaurantId: event.target.value, categoryId: categories.find((category) => category.restaurantId === event.target.value)?.id || '' })} required>{restaurants.map((restaurant) => <option value={restaurant.id} key={restaurant.id}>{restaurant.name}</option>)}</select></label>
      <label className="form-group"><span className="form-label">Category</span><select className="form-input" value={editing.categoryId} onChange={(event) => setEditing({ ...editing, categoryId: event.target.value })} required>{categories.filter((category) => category.restaurantId === editing.restaurantId).map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      <div className="grid-2"><label className="form-group"><span className="form-label">Name</span><input className="form-input" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required /></label><label className="form-group"><span className="form-label">Base price</span><input className="form-input" type="number" min="0" step="0.01" value={editing.basePrice} onChange={(event) => setEditing({ ...editing, basePrice: Number(event.target.value) })} required /></label><label className="form-group"><span className="form-label">Sort order</span><input className="form-input" type="number" value={editing.sortOrder} onChange={(event) => setEditing({ ...editing, sortOrder: Number(event.target.value) })} /></label><label className="form-group"><span className="form-label">Primary image URL</span><input className="form-input" value={editing.imageUrl || ''} onChange={(event) => setEditing({ ...editing, imageUrl: event.target.value })} /></label></div>
      <label className="form-group"><span className="form-label">Description</span><textarea className="form-input" value={editing.description || ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label>
      <h3>Additional images</h3>{editing.images.map((image: any, index: number) => <div className="grid-2" key={image.id || index}><input className="form-input" value={image.imageUrl} onChange={(event) => setEditing({ ...editing, images: editing.images.map((entry: any, entryIndex: number) => entryIndex === index ? { ...entry, imageUrl: event.target.value } : entry) })} placeholder="Image URL" /><label><input type="checkbox" checked={image.isPrimary} onChange={(event) => setEditing({ ...editing, images: editing.images.map((entry: any, entryIndex: number) => ({ ...entry, isPrimary: entryIndex === index ? event.target.checked : false })) })} /> Primary</label></div>)}<button type="button" className="btn btn-secondary" style={{ width: 'auto', margin: '10px 0' }} onClick={() => setEditing({ ...editing, images: [...editing.images, { imageUrl: '', isPrimary: editing.images.length === 0, sortOrder: editing.images.length }] })}>Add image</button>
      <h3>Product options</h3>{editing.options.map((option: any, optionIndex: number) => <fieldset key={option.id || optionIndex} style={{ padding: '12px', marginBottom: '12px' }}><div className="grid-2"><input className="form-input" value={option.name} onChange={(event) => updateOption(optionIndex, { name: event.target.value })} placeholder="Option name" required /><label><input type="checkbox" checked={option.isRequired} onChange={(event) => updateOption(optionIndex, { isRequired: event.target.checked })} /> Required</label></div>{option.items.map((item: any, itemIndex: number) => <div className="grid-2" key={item.id || itemIndex}><input className="form-input" value={item.name} onChange={(event) => updateItem(optionIndex, itemIndex, { name: event.target.value })} placeholder="Choice" required /><input className="form-input" type="number" step="0.01" value={item.priceDelta} onChange={(event) => updateItem(optionIndex, itemIndex, { priceDelta: Number(event.target.value) })} placeholder="Price delta" /></div>)}<button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => updateOption(optionIndex, { items: [...option.items, { name: '', priceDelta: 0, isActive: true, sortOrder: option.items.length }] })}>Add choice</button></fieldset>)}<button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setEditing({ ...editing, options: [...editing.options, { name: '', isRequired: false, sortOrder: editing.options.length, items: [{ name: '', priceDelta: 0, isActive: true, sortOrder: 0 }] }] })}>Add option group</button>
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}><button className="btn btn-primary">Save product</button>{editing.id && <button className="btn btn-secondary" type="button" onClick={() => archive(editing.id)}>Archive</button>}</div>
    </form></div></div>}
  </DashboardLayout>;
}
