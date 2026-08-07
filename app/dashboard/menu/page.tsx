'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function MenuManagementPage() {
  const [activeTab, setActiveTab] = useState('products'); // products, addons, combos, performance
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Products state (will fetch from backend)
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock Menu Categories
  const categories = ['ALL', 'Burgers', 'Pizzas', 'Sides', 'Drinks', 'Desserts'];

  // Fetch Menu Items from Database
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        // Map database products with mock labels/prep times for display
        const enriched = data.map((item: any) => {
          let labels: string[] = [];
          let prepTime = 10;
          if (item.name.toLowerCase().includes('oh g')) {
            labels = ['Bestseller', 'Halal'];
            prepTime = 12;
          } else if (item.name.toLowerCase().includes('gaucho')) {
            labels = ['Special', 'Recommended'];
            prepTime = 15;
          } else if (item.name.toLowerCase().includes('smash') || item.name.toLowerCase().includes('classic')) {
            labels = ['Recommended'];
            prepTime = 8;
          } else if (item.name.toLowerCase().includes('fries')) {
            labels = ['Halal'];
            prepTime = 5;
          }
          return {
            ...item,
            categoryName: item.category?.name || 'Burgers',
            labels,
            prepTime,
            allowSpice: true,
            allowAddons: true,
            allowCombo: true,
          };
        });
        setProducts(enriched);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const openProductEditor = (product: any) => {
    setEditingProduct({ ...product, imageUrl: product.imageUrl || null });
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError('');
    setSaveError('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const closeProductEditor = () => {
    setEditingProduct(null);
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError('');
    setSaveError('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleProductImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Choose a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Product images must be 5 MB or smaller.');
      return;
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageError('');
  };

  const removeProductImage = () => {
    setEditingProduct((product: any) => product ? { ...product, imageUrl: null } : product);
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Mock Add-ons List (Screen 11)
  const [addons, setAddons] = useState([
    { id: 'a1', name: 'Extra Cheese', price: 1.50, isAvailable: true, type: 'Topping' },
    { id: 'a2', name: 'Crispy Bacon', price: 2.00, isAvailable: true, type: 'Extra' },
    { id: 'a3', name: 'Jalapenos', price: 1.00, isAvailable: true, type: 'Topping' },
    { id: 'a4', name: 'Avocado', price: 2.50, isAvailable: true, type: 'Premium' },
    { id: 'a5', name: 'Grilled Mushrooms', price: 1.50, isAvailable: true, type: 'Topping' },
    { id: 'a6', name: 'OHG Sauce', price: 0.80, isAvailable: true, type: 'Sauce' },
  ]);

  // Mock Combo Setup (Screen 12 & 13)
  const [comboDrinks, setComboDrinks] = useState(['Cola', 'Fanta', 'Sprite', 'Water', 'Cola Zero']);
  const [comboDips, setComboDips] = useState(['Ketchup', 'Mayonnaise', 'BBQ Sauce', 'Homemade OHG Sauce']);
  const [comboPrice, setComboPrice] = useState(6.80);

  // Toggle availability in Database
  const toggleProductAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isAvailable: !currentStatus }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, isAvailable: !currentStatus } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAddonAvailability = (id: string) => {
    setAddons(prev => prev.map(a => a.id === id ? { ...a, isAvailable: !a.isAvailable } : a));
  };

  // Submit edit form to Database
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const name = String(formData.get('prodName') || '');
    const categoryName = String(formData.get('prodCategory') || 'Burgers');
    const basePrice = parseFloat(String(formData.get('prodPrice') || '0'));
    const description = String(formData.get('prodDesc') || '');

    setSavingProduct(true);
    setSaveError('');

    try {
      let imageUrl = editingProduct.imageUrl || null;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);

        const uploadResponse = await fetch('/api/admin/menu-images', {
          method: 'POST',
          body: uploadData,
        });
        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || 'Unable to upload the product image.');
        }

        imageUrl = uploadResult.imageUrl;
      }

      let response: Response;
      if (editingProduct.id) {
        // Edit existing product
        response = await fetch('/api/menu', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProduct.id,
            name,
            basePrice,
            description,
            imageUrl,
          }),
        });
      } else {
        // Create new product
        response = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            categoryName,
            basePrice,
            description,
            imageUrl,
          }),
        });
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to save the menu item.');
      }

      await fetchMenu();
      alert(editingProduct.id ? 'Menu item updated successfully!' : 'New menu item created successfully!');
      closeProductEditor();
    } catch (err) {
      console.error('Error saving item:', err);
      setSaveError(err instanceof Error ? err.message : 'Unable to save the menu item.');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete product from Database
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item from the database?')) {
      return;
    }
    try {
      const res = await fetch(`/api/menu?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Menu item successfully deleted from database.');
        setProducts(prev => prev.filter(p => p.id !== id));
        closeProductEditor();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Filter products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Menu Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Configure menu categories, individual recipes, custom add-ons, and smart combo packages.
          </p>
        </div>

        {/* Global Action */}
        <button 
          className="btn btn-primary" 
          style={{ width: 'auto' }}
          onClick={() => openProductEditor({ id: '', name: '', categoryName: 'Burgers', basePrice: 0, imageUrl: null, isAvailable: true, description: '', labels: [], prepTime: 10, allowSpice: true, allowAddons: true, allowCombo: true })}
        >
          + Add Product
        </button>
      </div>

      {/* Screen Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '24px', width: 'fit-content' }}>
        <button className={`filter-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products List</button>
        <button className={`filter-tab ${activeTab === 'addons' ? 'active' : ''}`} onClick={() => setActiveTab('addons')}>Add-ons Manager</button>
        <button className={`filter-tab ${activeTab === 'combos' ? 'active' : ''}`} onClick={() => setActiveTab('combos')}>Combo Config & Upgrades</button>
        <button className={`filter-tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>Performance Analytics</button>
      </div>

      {/* Products Tab (Screen 9) */}
      {activeTab === 'products' && (
        <div className="grid-3" style={{ gridTemplateColumns: editingProduct ? '2fr 1.2fr' : '1fr' }}>
          {/* Main List */}
          <div className="dashboard-card" style={{ marginBottom: '0' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                className="topbar-search" 
                placeholder="Search menu items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '280px' }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      backgroundColor: selectedCategory === cat ? 'var(--accent-red)' : '#111',
                      color: selectedCategory === cat ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading menu from PostgreSQL...
              </div>
            ) : (
              <div className="pos-table-wrapper">
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Base Price</th>
                      <th>Labels</th>
                      <th>Prep Time</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => openProductEditor(p)}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td>{p.categoryName}</td>
                        <td style={{ fontWeight: 600 }}>€{p.basePrice.toFixed(2)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {p.labels.map((l: string) => (
                              <span 
                                key={l} 
                                style={{ 
                                  fontSize: '0.65rem', 
                                  padding: '2px 6px', 
                                  backgroundColor: l === 'Bestseller' ? 'rgba(214,168,79,0.15)' : 'rgba(215,25,32,0.15)',
                                  color: l === 'Bestseller' ? 'var(--accent-gold)' : 'var(--accent-red-bright)',
                                  border: '1px solid rgba(255,255,255,0.05)',
                                  borderRadius: '4px'
                                }}
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>{p.prepTime} mins</td>
                        <td>
                          <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={p.isAvailable} 
                              onChange={() => toggleProductAvailability(p.id, p.isAvailable)} 
                            />
                            <span className="checkmark"></span>
                            <span style={{ fontSize: '0.75rem' }}>{p.isAvailable ? 'Available' : 'Sold Out'}</span>
                          </label>
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', display: 'inline-block' }}
                            onClick={() => openProductEditor(p)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Panel Sidebar (Screen 10) */}
          {editingProduct && (
            <div className="dashboard-card" style={{ marginBottom: '0', border: '1px solid var(--accent-red)' }}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 className="heading-bebas" style={{ fontSize: '1.4rem' }}>
                  {editingProduct.id ? 'Edit Product' : 'New Product'}
                </h3>
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
                  onClick={closeProductEditor}
                  disabled={savingProduct}
                >
                  ✕
                </button>
              </div>

              <form key={editingProduct.id || 'new-product'} onSubmit={handleSaveProduct}>
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input type="text" name="prodName" className="form-input" defaultValue={editingProduct.name} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="prodCategory" className="form-select" defaultValue={editingProduct.categoryName}>
                    <option value="Burgers">Burgers</option>
                    <option value="Pizzas">Pizzas</option>
                    <option value="Sides">Sides</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Base Price (€)</label>
                  <input type="number" step="0.01" name="prodPrice" className="form-input" defaultValue={editingProduct.basePrice} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    name="prodDesc"
                    className="form-input" 
                    defaultValue={editingProduct.description} 
                    style={{ height: '70px', resize: 'none', fontFamily: 'var(--font-body)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Image</label>
                  <div
                    style={{
                      aspectRatio: '16 / 9',
                      overflow: 'hidden',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: '#0b0b0b',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {(imagePreviewUrl || editingProduct.imageUrl) ? (
                      <img
                        src={imagePreviewUrl || editingProduct.imageUrl}
                        alt={(editingProduct.name || 'Product') + ' preview'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        No product image selected
                      </div>
                    )}
                  </div>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProductImageChange}
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={savingProduct}
                      style={{ padding: '8px 12px', fontSize: '0.75rem' }}
                    >
                      {(imagePreviewUrl || editingProduct.imageUrl) ? 'Replace Image' : 'Upload Image'}
                    </button>
                    {(imagePreviewUrl || editingProduct.imageUrl) && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={removeProductImage}
                        disabled={savingProduct}
                        style={{ padding: '8px 12px', fontSize: '0.75rem' }}
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  <small style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    JPG, PNG, or WebP up to 5 MB. This image appears on the customer menu, cart, and product details.
                  </small>
                  {imageError && (
                    <div role="alert" style={{ color: 'var(--accent-red-bright)', fontSize: '0.78rem' }}>
                      {imageError}
                    </div>
                  )}
                </div>

                {/* Behavioral Toggles */}
                <div className="form-group" style={{ gap: '10px', marginTop: '10px' }}>
                  <label className="checkbox-container">
                    <input type="checkbox" defaultChecked={editingProduct.allowSpice} />
                    <span className="checkmark"></span>
                    Allow Spice Levels
                  </label>
                  <label className="checkbox-container">
                    <input type="checkbox" defaultChecked={editingProduct.allowAddons} />
                    <span className="checkmark"></span>
                    Allow Custom Add-ons
                  </label>
                  <label className="checkbox-container">
                    <input type="checkbox" defaultChecked={editingProduct.allowCombo} />
                    <span className="checkmark"></span>
                    Allow Smart Menu Combo Upgrade
                  </label>
                </div>

                {saveError && (
                  <div role="alert" style={{ color: 'var(--accent-red-bright)', fontSize: '0.8rem', marginTop: '14px' }}>
                    {saveError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingProduct}>
                    {savingProduct ? 'Saving...' : 'Save Changes'}
                  </button>
                  {editingProduct.id && (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => handleDeleteProduct(editingProduct.id)}
                      disabled={savingProduct}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Addons Manager Tab (Screen 11) */}
      {activeTab === 'addons' && (
        <div className="grid-2">
          {/* Add-ons list */}
          <div className="dashboard-card">
            <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Available Toppings & Dips</h3>
            <div className="pos-table-wrapper">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Addon Name</th>
                    <th>Type</th>
                    <th>Extra Surcharge</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {addons.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', backgroundColor: '#222', borderRadius: '4px' }}>
                          {a.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>+€{a.price.toFixed(2)}</td>
                      <td>
                        <label className="checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={a.isAvailable} 
                            onChange={() => toggleAddonAvailability(a.id)} 
                          />
                          <span className="checkmark"></span>
                          <span style={{ fontSize: '0.75rem' }}>{a.isAvailable ? 'Active' : 'Disabled'}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create new addon */}
          <div className="dashboard-card">
            <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Configure New Add-on</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as any;
              const name = form.addonName.value;
              const price = parseFloat(form.addonPrice.value);
              const type = form.addonType.value;
              setAddons(prev => [...prev, { id: Date.now().toString(), name, price, isAvailable: true, type }]);
              form.reset();
              alert('Add-on added successfully!');
            }}>
              <div className="form-group">
                <label className="form-label">Add-on Name</label>
                <input type="text" name="addonName" className="form-input" placeholder="e.g. Garlic Mayo" required />
              </div>
              <div className="form-group">
                <label className="form-label">Surcharge Price (€)</label>
                <input type="number" name="addonPrice" step="0.01" className="form-input" placeholder="e.g. 1.20" required />
              </div>
              <div className="form-group">
                <label className="form-label">Add-on Classification</label>
                <select name="addonType" className="form-select">
                  <option value="Topping">Topping / Layer</option>
                  <option value="Sauce">Sauce / Dip</option>
                  <option value="Extra">Extra Patty / Slice</option>
                  <option value="Premium">Premium Upgrade</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Create & Active</button>
            </form>
          </div>
        </div>
      )}

      {/* Combo Configuration (Screen 12 & 13) */}
      {activeTab === 'combos' && (
        <div className="grid-2">
          {/* Drinks & Dips choice lists */}
          <div className="dashboard-card">
            <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Selectable Combo Choices</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Drink Selection (Select 1)</span>
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                  onClick={() => {
                    const d = prompt('Enter new drink choice:');
                    if (d) setComboDrinks(prev => [...prev, d]);
                  }}
                >
                  + Add Drink
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {comboDrinks.map(d => (
                  <span key={d} style={{ fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#111', border: '1px solid var(--border)', borderRadius: '4px' }}>
                    🥤 {d}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Dip / Sauce Selection (Select 1)</span>
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                  onClick={() => {
                    const d = prompt('Enter new dip choice:');
                    if (d) setComboDips(prev => [...prev, d]);
                  }}
                >
                  + Add Dip
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {comboDips.map(d => (
                  <span key={d} style={{ fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#111', border: '1px solid var(--border)', borderRadius: '4px' }}>
                    🥣 {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Smart Upgrade Packages (Screen 13) */}
          <div className="dashboard-card">
            <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Smart Upgrade Pricing Packages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                style={{ 
                  padding: '16px', 
                  backgroundColor: '#111', 
                  border: '1px solid var(--border)', 
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Product Only</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No additional items added.</span>
                </div>
                <div style={{ fontWeight: 'bold' }}>€0.00</div>
              </div>

              <div 
                style={{ 
                  padding: '16px', 
                  backgroundColor: '#111', 
                  border: '1px solid var(--border)', 
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Add Drink Option</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Includes any selected soft drink.</span>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>+€2.50</div>
              </div>

              <div 
                style={{ 
                  padding: '16px', 
                  backgroundColor: '#111', 
                  border: '1px solid var(--border)', 
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Add Drink + Dip Option</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Includes one soft drink and one gourmet dipping sauce.</span>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>+€3.80</div>
              </div>

              <div 
                style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--accent-red-glow)', 
                  border: '1px solid var(--accent-red)', 
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Full Menu Combo Upgrade</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>Includes drink, dip, and standard salted french fries.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-input" 
                    value={comboPrice} 
                    onChange={(e) => setComboPrice(parseFloat(e.target.value) || 0)}
                    style={{ width: '80px', padding: '4px 8px', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Performance (Screen 4 & 5) */}
      {activeTab === 'performance' && (
        <div className="grid-3" style={{ gridTemplateColumns: '1.2fr 2fr' }}>
          {/* Screen 4: Item Popularity Report */}
          <div className="dashboard-card" style={{ marginBottom: '0' }}>
            <h3 className="card-title-text" style={{ marginBottom: '16px' }}>Item Popularity Report</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>1. Oh G Burger (Bestseller)</span>
                  <span style={{ color: 'var(--accent-gold)' }}>242 sold (€3,025.00)</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--accent-red)' }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>2. French Fries (Halal)</span>
                  <span style={{ color: 'var(--accent-gold)' }}>180 sold (€720.00)</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '74%', height: '100%', backgroundColor: 'var(--accent-red)' }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>3. El Gaucho (Special)</span>
                  <span style={{ color: 'var(--accent-gold)' }}>118 sold (€1,711.00)</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '48%', height: '100%', backgroundColor: 'var(--accent-red)' }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>4. Classic Smash (Recommended)</span>
                  <span style={{ color: 'var(--accent-gold)' }}>95 sold (€902.50)</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '39%', height: '100%', backgroundColor: 'var(--accent-red)' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Screen 5: Magic Menu Quadrant */}
          <div className="dashboard-card" style={{ marginBottom: '0' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 className="card-title-text">Magic Menu Analysis (Profitability vs Popularity)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quadrant mapping</span>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {/* Quadrant Render */}
              <div 
                style={{ 
                  width: '260px', 
                  height: '260px', 
                  border: '1px solid var(--border)', 
                  position: 'relative',
                  background: 'linear-gradient(to right, #0a0a0a 50%, #111 50%), linear-gradient(to bottom, #111 50%, #0a0a0a 50%)',
                  backgroundSize: '100% 100%'
                }}
              >
                {/* Horizontal & Vertical split lines */}
                <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', backgroundColor: 'var(--border)' }}></div>
                <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', backgroundColor: 'var(--border)' }}></div>
                
                {/* Quadrant labels */}
                <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>HIDDEN GEMS</div>
                <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.6rem', color: 'var(--success)', fontWeight: 'bold' }}>STARS (POWER PLAYS)</div>
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '0.6rem', color: 'var(--danger)', fontWeight: 'bold' }}>LOW PERFORMERS</div>
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '0.6rem', color: 'var(--warning)', fontWeight: 'bold' }}>QUESTION MARKS</div>
                
                {/* Colored dots represent menu items */}
                {/* Oh G Burger (High pop, High profit) - Star */}
                <div 
                  style={{ position: 'absolute', top: '25%', right: '20%', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)', cursor: 'pointer' }}
                  title="Oh G Burger (Star)"
                ></div>
                {/* El Gaucho (Low pop, High profit) - Hidden Gem */}
                <div 
                  style={{ position: 'absolute', top: '30%', left: '25%', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--info)', cursor: 'pointer' }}
                  title="El Gaucho (Hidden Gem)"
                ></div>
                {/* Classic Smash (High pop, Low profit) - Question mark */}
                <div 
                  style={{ position: 'absolute', bottom: '35%', right: '30%', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--warning)', cursor: 'pointer' }}
                  title="Classic Smash (Question Mark)"
                ></div>
                {/* Still Water (Low pop, Low profit) - Low performer */}
                <div 
                  style={{ position: 'absolute', bottom: '20%', left: '35%', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', cursor: 'pointer' }}
                  title="Still Water (Low Performer)"
                ></div>
              </div>

              {/* Explanatory legend */}
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Stars (Green)</span>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>High popularity, High profitability (Focus: Promote)</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--info)' }}></span>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Hidden Gems (Blue)</span>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Low popularity, High profitability (Focus: Upsell)</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--warning)' }}></span>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Power Plays (Amber)</span>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>High popularity, Low profitability (Focus: Adjust price)</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></span>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Underperformers (Gray)</span>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Low popularity, Low profitability (Focus: Remove/Rework)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
