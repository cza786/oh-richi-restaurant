'use client';

import React from 'react';
import Link from 'next/link';
import CustomerLayout from '../components/CustomerLayout';

export default function PromotionsPage() {
  const deals = [
    {
      id: 'happy-hour',
      title: 'HAPPY HOUR SPECIAL',
      discount: '20% OFF ALL BURGERS',
      schedule: 'Monday – Thursday • 3 PM – 6 PM',
      code: 'HAPPY20',
      description: 'Get 20% off all smash beef and chicken burgers during afternoon hours.',
      tag: 'DAILY DEAL',
    },
    {
      id: 'family-feast',
      title: 'FAMILY BURGER FEAST',
      discount: '€24.90 (SAVE €6.60)',
      schedule: 'Available All Week',
      code: 'FEAST25',
      description: 'Includes 2 Classic Hammhhh Burgers + 2 Stealth Fries + 2 Cold Drinks.',
      tag: 'COMBO DEAL',
    },
    {
      id: 'welcome-deal',
      title: 'WELCOME TO OH\'RICHI!',
      discount: '15% OFF FIRST ORDER',
      schedule: 'Valid for New Customers',
      code: 'RICHI15',
      description: 'Use promo code RICHI15 at checkout to claim 15% off your entire first order.',
      tag: 'NEW USER',
    },
  ];

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ color: 'var(--accent-gold, #d6a84f)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            OFFERS & DEALS
          </span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#ffffff', margin: '8px 0', textTransform: 'uppercase' }}>
            PROMOTIONS & DISCOUNTS
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto' }}>
            Save on your favorite smashed burgers, loaded fries, and family combo meals.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          {deals.map((deal) => (
            <div
              key={deal.id}
              style={{
                background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)',
                border: '1px solid #282838',
                borderRadius: '24px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.25)',
              }}
            >
              <div>
                <span style={{
                  display: 'inline-block',
                  color: '#ff9500',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}>
                  🔥 {deal.tag}
                </span>

                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {deal.title}
                </h3>
                
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: 900, color: '#ff9500' }}>
                  {deal.discount}
                </h4>

                <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                  📅 {deal.schedule}
                </p>

                <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {deal.description}
                </p>
              </div>

              <div style={{
                backgroundColor: '#0a0a0f',
                borderRadius: '16px',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px dashed #282838',
              }}>
                <div>
                  <small style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>PROMO CODE</small>
                  <strong style={{ color: '#ffffff', fontSize: '1.2rem', letterSpacing: '1px', fontWeight: 900 }}>{deal.code}</strong>
                </div>
                <Link
                  href="/menu"
                  style={{
                    background: 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)',
                    color: '#ffffff',
                    padding: '12px 22px',
                    borderRadius: '14px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(255, 140, 0, 0.45)',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  USE IN MENU →
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </CustomerLayout>
  );
}
