'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import { useCart } from '../components/CartContext';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  requiredPoints: number;
  rewardType: string; // FREE_ITEM, FIXED_DISCOUNT
  discountAmount: number | null;
  minimumOrderAmount: number | null;
}

interface Transaction {
  id: string;
  type: string; // EARNED, REDEEMED, REVERSED, etc.
  points: number;
  description: string;
  createdAt: string;
}

export default function RewardsPage() {
  const router = useRouter();
  const { applyRedemption } = useCart();
  const [user, setUser] = useState<any | null>(null);
  const [loyalty, setLoyalty] = useState<any | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Redemption success modal state
  const [activeVoucher, setActiveVoucher] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);

        // Fetch loyalty account balance
        const loyaltyRes = await fetch('/api/loyalty/me');
        if (loyaltyRes.ok) {
          const loyaltyData = await loyaltyRes.json();
          setLoyalty(loyaltyData);
        }

        // Fetch transaction history
        const historyRes = await fetch('/api/loyalty/history');
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData);
        }
      } else {
        setUser(null);
      }

      // Fetch active rewards catalog (public for everyone)
      const rewardsRes = await fetch('/api/rewards');
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setRewards(rewardsData);
      }
    } catch (err) {
      console.error('Error loading rewards page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleRedeem = async (rewardId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rewards/${rewardId}/redeem`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Failed to redeem reward.');
        setLoading(false);
        return;
      }

      // Find the redeemed reward details for the modal
      const targetReward = rewards.find(r => r.id === rewardId);

      setActiveVoucher({
        code: data.redemption.redemptionCode,
        rewardName: targetReward?.name,
        discountAmount: targetReward?.discountAmount || 5.00,
      });

      // Reload loyalty points balance & transaction history
      await loadData();
    } catch (err) {
      console.error(err);
      alert('An error occurred during redemption.');
      setLoading(false);
    }
  };

  const handleApplyVoucherToCart = () => {
    if (!activeVoucher) return;
    
    applyRedemption({
      redemptionCode: activeVoucher.code,
      reward: {
        name: activeVoucher.rewardName,
        discountAmount: Number(activeVoucher.discountAmount),
      }
    });

    alert(`Reward code ${activeVoucher.code} successfully applied to your checkout cart!`);
    setActiveVoucher(null);
    router.push('/');
  };

  // Determine next goal
  const points = loyalty?.currentPoints || 0;
  const nextTier = rewards.find(r => r.requiredPoints > points) || rewards[rewards.length - 1];
  const pointsNeeded = nextTier ? Math.max(0, nextTier.requiredPoints - points) : 0;
  const progressPercent = nextTier ? Math.min(100, (points / nextTier.requiredPoints) * 100) : 100;

  if (loading && !user) {
    return (
      <CustomerLayout>
        <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your rewards dashboard...
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ color: '#ff9500', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            LOYALTY REWARDS
          </span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#ffffff', margin: '8px 0', textTransform: 'uppercase' }}>
            YOUR REWARDS & POINTS
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
          
          {/* LEFT: POINTS METER & ACTIVITY HISTORY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Points balance display card */}
            <div style={{
              background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)',
              border: '1px solid #282838',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <span style={{ color: '#ff9500', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                LOYALTY REWARDS
              </span>
              <span style={{ color: '#ffffff', fontSize: '0.95rem', display: 'block' }}>You have</span>
              
              <div style={{ margin: '8px 0' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: '#ff9500', lineHeight: '1' }}>
                  {points.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: '8px' }}>Points</span>
              </div>

              {nextTier && pointsNeeded > 0 ? (
                <>
                  {/* Progress bar container */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#282838', borderRadius: '4px', margin: '16px 0 8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #ff9500 0%, #e07b00 100%)', transition: 'width 0.5s ease', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>Next reward at {nextTier.requiredPoints} points</span>
                    <span>{pointsNeeded} pts left</span>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: 600, margin: '12px 0 0 0' }}>
                  🏆 Highest rewards tier unlocked!
                </p>
              )}

              <div style={{ marginTop: '20px' }}>
                <Link
                  href="/menu"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#1c1c28',
                    border: '1px solid #3a3a4c',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  View rewards
                </Link>
              </div>
            </div>

            {/* Loyalty Transactions Log */}
            <div style={{
              background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)',
              border: '1px solid #282838',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0', textTransform: 'uppercase' }}>Points Activity</h3>
              {history.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No point logs recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                  {history.map((tx) => {
                    const isDeduction = tx.points < 0;
                    return (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0a0f', padding: '12px 16px', borderRadius: '10px', border: '1px solid #282838', fontSize: '0.85rem' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: '#ffffff', margin: 0 }}>{tx.description}</p>
                          <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '2px 0 0 0' }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span style={{ fontWeight: 800, color: isDeduction ? 'var(--accent-red, #ff3b30)' : '#22c55e' }}>
                          {isDeduction ? '' : '+'}{tx.points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: AVAILABLE REWARDS LIST */}
          <div style={{
            background: 'linear-gradient(180deg, #121218 0%, #14131a 65%, rgba(255, 149, 0, 0.16) 100%)',
            border: '1px solid #282838',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 -30px 45px -15px rgba(255, 149, 0, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ff9500', margin: '0 0 20px 0', textTransform: 'uppercase' }}>Available Rewards</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rewards.map((reward) => {
                const canRedeem = points >= reward.requiredPoints;
                const pointsDiff = reward.requiredPoints - points;
                return (
                  <div key={reward.id} style={{ backgroundColor: '#0a0a0f', padding: '18px', borderRadius: '14px', border: '1px solid #282838', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{reward.name}</h4>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0 0' }}>{reward.description || 'Redeem points for discounts.'}</p>
                      <span style={{ display: 'inline-block', backgroundColor: 'rgba(255, 149, 0, 0.15)', color: '#ff9500', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '8px', marginTop: '8px' }}>
                        🪙 {reward.requiredPoints} points
                      </span>
                    </div>

                    <button
                      disabled={!canRedeem}
                      onClick={() => handleRedeem(reward.id)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        background: canRedeem ? 'linear-gradient(135deg, #ffa000 0%, #ff7000 100%)' : '#1a1a24',
                        color: canRedeem ? '#ffffff' : '#64748b',
                        border: canRedeem ? 'none' : '1px solid #282838',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: canRedeem ? 'pointer' : 'not-allowed',
                        boxShadow: canRedeem ? '0 8px 24px rgba(255, 140, 0, 0.45)' : 'none',
                      }}
                    >
                      {canRedeem ? 'Redeem' : `Need ${pointsDiff} pts`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* REDEMPTION SUCCESS VOUCHER MODAL */}
      {activeVoucher && (
        <div className="modal-backdrop fade-in" onClick={() => setActiveVoucher(null)}>
          <div className="modal-content zoom-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div className="modal-body" style={{ padding: '32px 24px' }}>
              
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '2px solid var(--success)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '16px' }} className="bounce-in">
                ✓
              </div>

              <h3 className="heading-bebas" style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>Voucher Redeemed!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
                You've successfully redeemed points for <strong>{activeVoucher.rewardName}</strong>.
              </p>

              {/* Promo Code Box */}
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '2px dashed var(--border-focus)', padding: '16px', borderRadius: '8px', margin: '24px 0 16px', position: 'relative' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voucher Code</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '4px', letterSpacing: '0.1em' }}>{activeVoucher.code}</p>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '24px' }}>
                Copy this code and apply it during checkout to claim your reward.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleApplyVoucherToCart}>
                  Apply directly to Cart
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveVoucher(null)}>
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </CustomerLayout>
  );
}
