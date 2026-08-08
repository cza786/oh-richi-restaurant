'use client';

import React from 'react';
import Link from 'next/link';
import CustomerLayout from '../components/CustomerLayout';

export default function AboutPage() {
  return (
    <CustomerLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ color: '#ff9500', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            OUR STORY & PASSION
          </span>
          <h1 style={{ fontSize: '3.2rem', fontWeight: 900, color: '#ffffff', margin: '12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            OH&apos;RICHI! BURGER & CO
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto', lineHeight: '1.6' }}>
            Born from street-food culture, crafted with 100% Halal certified prime beef, and built on smashing burgers that melt into every layer.
          </p>
        </div>

        {/* Hero Brand Banner */}
        <div style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)',
          border: '1px solid #282838',
          marginBottom: '56px',
          padding: '40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          alignItems: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 -40px 60px -20px rgba(255, 149, 0, 0.22)',
        }}>
          <div>
            <span style={{
              color: '#ff9500',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              🔥 AUTHENTIC SMASH CONCEPT
            </span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ffffff', margin: '12px 0', lineHeight: '1.1', textTransform: 'uppercase' }}>
              BURGERS THAT HIT DIFFERENT.
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              We believe a great burger isn&apos;t complicated—it&apos;s precise. We press fresh 100% Halal prime beef onto screeching hot flat-tops to lock in deep caramelization, crispy lace edges, and juicy flavor.
            </p>
            <Link
              href="/menu"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
              }}
            >
              Order now →
            </Link>
          </div>

          <div style={{ textAlign: 'center' }}>
            <img
              src="/burger_hero.png"
              alt="OH Richi Burger Art"
              style={{ width: '100%', maxHeight: '340px', objectFit: 'contain', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))' }}
            />
          </div>
        </div>

        {/* 4 Brand Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '28px',
          marginBottom: '56px',
        }}>
          <div style={{ background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)', border: '1px solid #282838', borderRadius: '24px', padding: '28px', boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#0a0a0f', border: '1px solid #282838', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>📜</div>
              <span style={{ color: '#ff9500', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>100% HALAL</span>
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>Certified Halal Beef</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6' }}>
              Every single cut of beef, bacon, and chicken is 100% certified Halal, prepared under strict quality guidelines.
            </p>
          </div>

          <div style={{ background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)', border: '1px solid #282838', borderRadius: '24px', padding: '28px', boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#0a0a0f', border: '1px solid #282838', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🔥</div>
              <span style={{ color: '#ff9500', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>FRESH DAILY</span>
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>Martins Potato Rolls</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6' }}>
              From freshly baked Martins rolls to crisp produce delivered daily, we never compromise on freshness.
            </p>
          </div>

          <div style={{ background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)', border: '1px solid #282838', borderRadius: '24px', padding: '28px', boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#0a0a0f', border: '1px solid #282838', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🍯</div>
              <span style={{ color: '#ff9500', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>HOUSE SAUCES</span>
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>Oh-G & Chimi Mayo</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6' }}>
              Our house Oh-G Sauce, Chimi Mayo, and Trüffel Mayo are crafted in-house daily for maximum flavor impact.
            </p>
          </div>

          <div style={{ background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)', border: '1px solid #282838', borderRadius: '24px', padding: '28px', boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#0a0a0f', border: '1px solid #282838', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🍰</div>
              <span style={{ color: '#ff9500', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>SWEET FINISH</span>
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#ffffff', fontSize: '1.25rem', fontWeight: 800 }}>San Sebastian Cake</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', lineHeight: '1.6' }}>
              Finish with our authentic San Sebastian Cheesecake and NY Banana Chocolate Cream made daily.
            </p>
          </div>
        </div>

      </div>
    </CustomerLayout>
  );
}
