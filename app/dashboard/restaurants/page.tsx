'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';

interface RestaurantItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  isActive: boolean;
  locations?: Array<{ id: string; name: string; city: string }>;
  _count?: {
    menuItems: number;
    menuCategories: number;
    orders: number;
  };
}

export default function SuperAdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/restaurants');
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      const data = await res.json();
      setRestaurants(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const openCreateModal = () => {
    setEditingRestaurant(null);
    setName('');
    setSlug('');
    setDescription('');
    setLogoUrl('');
    setWebsite('');
    setCity('Rome');
    setAddressLine1('123 Central Ave');
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: RestaurantItem) => {
    setEditingRestaurant(r);
    setName(r.name);
    setSlug(r.slug);
    setDescription(r.description || '');
    setLogoUrl(r.logoUrl || '');
    setWebsite(r.website || '');
    setIsActive(r.isActive);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingRestaurant && !slug) {
      const autoSlug = val.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      setSlug(autoSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Restaurant name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: editingRestaurant?.id,
        name,
        slug,
        description,
        logoUrl,
        website,
        isActive,
        city,
        addressLine1,
      };

      const method = editingRestaurant ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/restaurants', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save restaurant');
      }

      setIsModalOpen(false);
      fetchRestaurants();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActiveStatus = async (r: RestaurantItem) => {
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, isActive: !r.isActive }),
      });
      if (res.ok) {
        fetchRestaurants();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div style={{ padding: '24px', color: '#ffffff' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ color: '#ff9500', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Door2Door Platform Control
            </span>
            <h1 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 900 }}>
              Multi-Tenant Restaurant Management
            </h1>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 140, 0, 0.4)',
            }}
          >
            ＋ Onboard New Restaurant
          </button>
        </div>

        {/* Stats Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#13131a', border: '1px solid #232333', borderRadius: '16px', padding: '20px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Total Onboarded</span>
            <h3 style={{ margin: '8px 0 0 0', fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>{restaurants.length}</h3>
          </div>
          <div style={{ backgroundColor: '#13131a', border: '1px solid #232333', borderRadius: '16px', padding: '20px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Active Storefronts</span>
            <h3 style={{ margin: '8px 0 0 0', fontSize: '1.8rem', fontWeight: 900, color: '#34c759' }}>
              {restaurants.filter((r) => r.isActive).length}
            </h3>
          </div>
          <div style={{ backgroundColor: '#13131a', border: '1px solid #232333', borderRadius: '16px', padding: '20px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Total Platform Orders</span>
            <h3 style={{ margin: '8px 0 0 0', fontSize: '1.8rem', fontWeight: 900, color: '#ff9500' }}>
              {restaurants.reduce((sum, r) => sum + (r._count?.orders || 0), 0)}
            </h3>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
          <input
            type="search"
            placeholder="Search by name, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#13131a',
              border: '1px solid #232333',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Restaurants Table */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>Loading onboarded restaurants...</div>
        ) : filteredRestaurants.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#13131a', borderRadius: '16px', border: '1px solid #232333' }}>
            <h3>No restaurants found</h3>
            <p style={{ color: '#94a3b8' }}>Onboard your first restaurant to launch a new marketplace storefront.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#13131a', border: '1px solid #232333', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#1c1c28', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '16px 20px' }}>Restaurant</th>
                  <th style={{ padding: '16px 20px' }}>Public Slug</th>
                  <th style={{ padding: '16px 20px' }}>Dishes &amp; Orders</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRestaurants.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #1f1f2e' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={r.logoUrl || '/burger_hero.png'}
                          alt={r.name}
                          style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', backgroundColor: '#222' }}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/burger_hero.png'; }}
                        />
                        <div>
                          <strong style={{ color: '#ffffff', display: 'block' }}>{r.name}</strong>
                          <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{r.description || 'No description'}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <Link
                        href={`/restaurants/${r.slug}`}
                        target="_blank"
                        style={{ color: '#ff9500', textDecoration: 'none', fontWeight: 600 }}
                      >
                        /restaurants/{r.slug} ↗
                      </Link>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#cbd5e1' }}>
                      <span>🍔 {r._count?.menuItems || 0} items</span> &nbsp;•&nbsp; <span>📦 {r._count?.orders || 0} orders</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button
                        type="button"
                        onClick={() => toggleActiveStatus(r)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          backgroundColor: r.isActive ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)',
                          color: r.isActive ? '#34c759' : '#ff3b30',
                        }}
                      >
                        {r.isActive ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#282838',
                            border: '1px solid #3a3a4c',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <Link
                          href={`/restaurants/${r.slug}`}
                          target="_blank"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ff9500',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                          }}
                        >
                          View Store
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for Creating / Editing Restaurant */}
        {isModalOpen && (
          <>
            <div
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)',
                zIndex: 99998,
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: '520px',
                backgroundColor: '#16161e',
                border: '1px solid #2a2a3c',
                borderRadius: '20px',
                padding: '28px',
                zIndex: 99999,
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                  {editingRestaurant ? 'Edit Restaurant Details' : 'Onboard New Restaurant'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div style={{ backgroundColor: 'rgba(255, 59, 48, 0.15)', border: '1px solid #ff3b30', color: '#ff3b30', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>Restaurant Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Bella Italia Trattoria"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0d12', border: '1px solid #2a2a3c', color: '#ffffff', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>Public URL Slug * (/restaurants/slug)</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. bella-italia"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0d12', border: '1px solid #2a2a3c', color: '#ffffff', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of cuisine and specialties..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0d12', border: '1px solid #2a2a3c', color: '#ffffff', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>Logo Image URL</label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0d12', border: '1px solid #2a2a3c', color: '#ffffff', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0d12', border: '1px solid #2a2a3c', color: '#ffffff', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                {!editingRestaurant && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Rome"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0d12', border: '1px solid #2a2a3c', color: '#ffffff', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>Street Address</label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="123 Main Street"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0d12', border: '1px solid #2a2a3c', color: '#ffffff', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>Active Storefront (Visible on Marketplace)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Saving...' : editingRestaurant ? 'Update Restaurant' : 'Onboard Restaurant'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
