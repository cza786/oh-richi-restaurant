'use client';

import React, { useState, useEffect } from 'react';
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
      if (!userRes.ok) {
        router.push('/customer/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      // Fetch loyalty account balance
      const loyaltyRes = await fetch('/api/loyalty/me');
      if (loyaltyRes.ok) {
        const loyaltyData = await loyaltyRes.json();
        setLoyalty(loyaltyData);
      }

      // Fetch active rewards
      const rewardsRes = await fetch('/api/rewards');
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setRewards(rewardsData);
      }

      // Fetch transaction history
      const historyRes = await fetch('/api/loyalty/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
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
        
        <h1 className="heading-bebas" style={{ fontSize: '2.5rem', marginBottom: '24px' }}>Rewards & Loyalty</h1>

        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* LEFT: POINTS METER & ACTIVITY HISTORY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Points balance display */}
            <div className="auth-card" style={{ maxWidth: '100%', padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Your Point Balance</p>
              
              {/* Radial Points Circle */}
              <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--accent-gold)', margin: '0 auto 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(214, 168, 79, 0.05)' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{points.toLocaleString()}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>points</span>
              </div>

              {nextTier && pointsNeeded > 0 ? (
                <>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    You are <strong>{pointsNeeded} pts</strong> away from a <strong>{nextTier.name}</strong>!
                  </p>
                  {/* Progress bar container */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border)', margin: '16px 0 8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: 'var(--accent-gold)', transition: 'width 0.5s ease', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>0 pts</span>
                    <span>{nextTier.requiredPoints} pts</span>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 600 }}>
                  🏆 You've reached the highest rewards tier! Keep earning!
                </p>
              )}
            </div>

            {/* Loyalty Transactions Log */}
            <div className="auth-card" style={{ maxWidth: '100%', padding: '24px' }}>
              <h3 className="heading-bebas" style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '16px' }}>Points Activity</h3>
              {history.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No point logs recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                  {history.map((tx) => {
                    const isDeduction = tx.points < 0;
                    return (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{tx.description}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span style={{ fontWeight: 700, color: isDeduction ? 'var(--danger)' : 'var(--success)' }}>
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
          <div className="auth-card" style={{ maxWidth: '100%', padding: '28px' }}>
            <h3 className="heading-bebas" style={{ fontSize: '1.3rem', color: 'var(--accent-gold)', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Available Rewards</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rewards.map((reward) => {
                const canRedeem = points >= reward.requiredPoints;
                const pointsDiff = reward.requiredPoints - points;
                return (
                  <div key={reward.id} style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{reward.name}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{reward.description || 'Redeem points for discounts.'}</p>
                      <span style={{ display: 'inline-block', backgroundColor: 'rgba(214, 168, 79, 0.1)', color: 'var(--accent-gold)', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', marginTop: '8px' }}>
                        🪙 {reward.requiredPoints} points
                      </span>
                    </div>

                    <button
                      className={`btn ${canRedeem ? 'btn-primary' : 'btn-secondary'}`}
                      disabled={!canRedeem}
                      onClick={() => handleRedeem(reward.id)}
                      style={{ width: 'auto', padding: '0 16px', height: '36px', fontSize: '0.8rem', border: !canRedeem ? '1px solid var(--border)' : undefined }}
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
