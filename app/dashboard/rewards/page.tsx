'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function CustomerRewardsPage() {
  const [pointsBalance, setPointsBalance] = useState(0);
  const [rewardsCatalog, setRewardsCatalog] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal voucher popup state
  const [activeVoucher, setActiveVoucher] = useState<any | null>(null);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      // Fetch loyalty account profile
      const profileRes = await fetch('/api/loyalty/me');
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setPointsBalance(profile.currentPoints);
      }

      // Fetch active catalog rewards
      const catalogRes = await fetch('/api/rewards');
      if (catalogRes.ok) {
        const catalog = await catalogRes.json();
        setRewardsCatalog(catalog);
      }

      // Fetch transaction logs
      const historyRes = await fetch('/api/loyalty/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  // Handle voucher redemption
  const handleRedeem = async (rewardId: string) => {
    try {
      const res = await fetch(`/api/rewards/${rewardId}/redeem`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        // Show redeemed voucher modal
        setActiveVoucher(data.redemption);
        // Refresh customer data
        fetchLoyaltyData();
      } else {
        alert(data.error || 'Redemption failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Find next milestone reward
  const sortedRewards = [...rewardsCatalog].sort((a, b) => a.requiredPoints - b.requiredPoints);
  const nextReward = sortedRewards.find(r => r.requiredPoints > pointsBalance) || sortedRewards[sortedRewards.length - 1];
  const progressPercent = nextReward ? Math.min(100, Math.round((pointsBalance / nextReward.requiredPoints) * 100)) : 0;
  const pointsNeeded = nextReward ? Math.max(0, nextReward.requiredPoints - pointsBalance) : 0;

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Loyalty Rewards
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Earn points on every order. Redeem points to claim free meals, premium burgers, and drinks.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading rewards information...
        </div>
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: '1.2fr 2fr', alignItems: 'start', gap: '24px' }}>
          
          {/* Left panel: Balance card & History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Balance Card */}
            <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #181818 0%, #111 100%)', border: '1px solid var(--accent-red)', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '1.5rem' }}>💎</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Balance</div>
              <div className="heading-bebas" style={{ fontSize: '3.6rem', color: 'var(--text-primary)', margin: '10px 0' }}>
                {pointsBalance} <span style={{ fontSize: '1.5rem', color: 'var(--accent-gold)' }}>PTS</span>
              </div>

              {/* Progress to next reward */}
              {nextReward && (
                <div style={{ textAlign: 'left', marginTop: '20px' }}>
                  <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>Next milestone: {nextReward.name}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{pointsBalance} / {nextReward.requiredPoints}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#222', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--accent-red)', transition: 'width 0.3s ease' }}></div>
                  </div>
                  {pointsNeeded > 0 ? (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', textAlign: 'right', fontWeight: 600 }}>
                      ⚡ Earn {pointsNeeded} more points to unlock!
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.7rem', color: 'var(--success)', textAlign: 'right', fontWeight: 600 }}>
                      ✓ Milestone unlocked! Click Redeem below.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Points History logs */}
            <div className="dashboard-card" style={{ padding: '20px' }}>
              <h3 className="card-title-text" style={{ marginBottom: '16px' }}>History Ledger</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {history.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No points transactions found yet.</div>
                ) : (
                  history.map((tx) => (
                    <div key={tx.id} className="flex-between" style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.description}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: tx.points > 0 ? 'var(--success)' : 'var(--accent-red)' }}>
                        {tx.points > 0 ? `+${tx.points}` : tx.points} PTS
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Active/Locked Rewards catalog grid */}
          <div className="dashboard-card" style={{ padding: '24px' }}>
            <h3 className="card-title-text" style={{ marginBottom: '20px' }}>Rewards Catalog</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {rewardsCatalog.map((reward) => {
                const isLocked = pointsBalance < reward.requiredPoints;
                return (
                  <div 
                    key={reward.id} 
                    style={{ 
                      padding: '16px', 
                      backgroundColor: '#111', 
                      border: isLocked ? '1px solid #222' : '1px solid var(--accent-red-glow)', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      opacity: isLocked ? 0.65 : 1,
                      position: 'relative'
                    }}
                  >
                    {/* Points Tag */}
                    <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 8px', backgroundColor: 'rgba(215, 25, 32, 0.15)', border: '1px solid var(--accent-red)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {reward.requiredPoints} pts
                    </div>

                    <div>
                      {/* Placeholder Reward Icon */}
                      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
                        {reward.rewardType === 'FREE_ITEM' ? '🍔' : '🏷️'}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{reward.name}</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{reward.description}</p>
                    </div>

                    {isLocked ? (
                      <button className="btn btn-secondary" style={{ padding: '8px 0', fontSize: '0.75rem', cursor: 'not-allowed' }} disabled>
                        Need {reward.requiredPoints - pointsBalance} more points
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '8px 0', fontSize: '0.75rem' }}
                        onClick={() => handleRedeem(reward.id)}
                      >
                        Redeem Reward
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Voucher Code & QR Modal Popup */}
      {activeVoucher && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="dashboard-card" style={{ maxWidth: '380px', width: '90%', padding: '32px', textAlign: 'center', border: '2px solid var(--accent-red)', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🎟️</div>
            <h3 className="heading-bebas" style={{ fontSize: '1.8rem', color: 'white', marginBottom: '6px' }}>Redemption Successful!</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Present this coupon code or scan the QR token at the counter to claim your reward benefit.</p>

            {/* Voucher Card layout */}
            <div style={{ backgroundColor: 'white', color: 'black', padding: '24px 16px', borderRadius: '6px', fontFamily: 'monospace', margin: '0 auto 24px', border: '1px dashed #333' }}>
              <div style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VOUCHER CODE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0', color: 'var(--accent-red)' }}>{activeVoucher.redemptionCode}</div>
              
              {/* Simulated QR block */}
              <div style={{ border: '2px solid #000', padding: '14px', width: '120px', height: '120px', margin: '14px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '25px', height: '25px', backgroundColor: 'black' }}></div>
                  <div style={{ width: '25px', height: '25px', backgroundColor: 'black' }}></div>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#000', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px' }}>{activeVoucher.qrToken}</div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ width: '25px', height: '25px', backgroundColor: 'black' }}></div>
                  <div style={{ width: '5px', height: '5px', backgroundColor: 'black' }}></div>
                </div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => setActiveVoucher(null)}>
              Done
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
