import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from './Layout';
import { CreditCardIcon, CheckmarkBadge01Icon } from 'hugeicons-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const Billing: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'campay_mtn' | 'campay_orange'>('stripe');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [campayRef, setCampayRef] = useState<string | null>(localStorage.getItem('pending_campay_ref'));
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      checkAuth();
      alert('Subscription upgraded successfully!');
      setSearchParams({}); // Clear params
    }
  }, [searchParams]);

  useEffect(() => {
    let interval: any;
    if (campayRef && !polling) {
      setPolling(true);
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/payment/campay/status/${campayRef}`);
          if (res.data.data.status === 'SUCCESSFUL') {
            await checkAuth();
            alert('Mobile payment confirmed! Your plan has been upgraded.');
            setCampayRef(null);
            localStorage.removeItem('pending_campay_ref');
            clearInterval(interval);
          } else if (res.data.data.status === 'FAILED') {
            alert('Mobile payment failed or was cancelled.');
            setCampayRef(null);
            localStorage.removeItem('pending_campay_ref');
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 5000); // Poll every 5s
    }
    return () => clearInterval(interval);
  }, [campayRef]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setLoadingPlan(selectedPlan);
    try {
      if (paymentMethod === 'stripe') {
        const res = await api.post('/payment/create-checkout-session', { plan: selectedPlan });
        window.location.href = res.data.data.url;
      } else {
        if (!phoneNumber) {
          alert('Please enter your mobile money phone number');
          return;
        }
        const res = await api.post('/payment/campay/init', { 
          plan: selectedPlan, 
          phoneNumber, 
          provider: paymentMethod 
        });
        setCampayRef(res.data.data.reference);
        localStorage.setItem('pending_campay_ref', res.data.data.reference);
        alert(res.data.data.message);
        setSelectedPlan(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: 40, maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 10 }}>Billing & Plan</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 40 }}>Manage your subscription and payment methods.</p>

        {/* Pending Payment Alert */}
        {campayRef && (
          <div className="glass-panel" style={{ padding: '20px 30px', marginBottom: 40, border: '2px border var(--color-warning)', background: 'rgba(255, 204, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#92400E' }}>Payment in Progress</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#B45309' }}>We are waiting for confirmation from your mobile provider. Ref: {campayRef}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setCampayRef(campayRef)}>Check Status</button>
              <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: '#B45309', color: '#B45309' }} onClick={() => {
                setCampayRef(null);
                localStorage.removeItem('pending_campay_ref');
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Current Plan Overview */}
        <div className="glass-panel" style={{ padding: 30, marginBottom: 40, border: '1px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary-light)', textTransform: 'capitalize' }}>{user?.plan || 'Hacker'} Plan</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>{user?.plan === 'hacker' ? 'Limited Plan' : 'Professional Status'}</p>
            </div>
            <div style={{ padding: '10px 20px', background: 'rgba(124, 58, 237, 0.2)', borderRadius: 20, color: 'var(--color-primary-light)', fontWeight: 600 }}>
              ACTIVE
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 20, marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <h4 style={{ margin: 0 }}>Project Usage</h4>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                {user?.usage?.projectsThisMonth || 0} / {user?.plan === 'agency' ? '∞' : user?.plan === 'founder' ? '5' : '1'} Projects
              </span>
            </div>
            <div style={{ background: 'var(--color-surface-2)', height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.min(((user?.usage?.projectsThisMonth || 0) / (user?.plan === 'agency' ? 100 : user?.plan === 'founder' ? 5 : 1)) * 100, 100)}%`, 
                height: '100%', 
                background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))' 
              }} />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: 10 }}>
              {user?.plan === 'agency' ? 'You have unlimited projects.' : 'Upgrade your plan for more monthly project slots.'}
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: 20 }}>Available Plans</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
          
          {/* Hacker (Downgrade) */}
          <div className="glass-panel" style={{ padding: 30, opacity: 0.6 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 5 }}>Hacker</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 20 }}>$19<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>/mo</span></div>
            <button className="btn-secondary" style={{ width: '100%', marginBottom: 20 }} disabled>Free/Starter</button>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', gap: 10 }}><CheckmarkBadge01Icon size={16} /> 1 Project/mo</li>
              <li style={{ display: 'flex', gap: 10 }}><CheckmarkBadge01Icon size={16} /> PDF Export</li>
            </ul>
          </div>

          {/* Founder */}
          <div className="glass-panel" style={{ padding: 30, border: user?.plan === 'founder' ? '2px solid var(--color-primary)' : '' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 5, color: 'var(--color-primary-light)' }}>Founder</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 20 }}>$49<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>/mo</span></div>
            {user?.plan === 'founder' ? (
              <button className="btn-primary" style={{ width: '100%', marginBottom: 20 }} disabled>Current Plan</button>
            ) : (
              <button onClick={() => setSelectedPlan('founder')} className="btn-primary" style={{ width: '100%', marginBottom: 20 }}>
                Upgrade to Founder
              </button>
            )}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', gap: 10 }}><CheckmarkBadge01Icon size={16} /> 5 Projects/mo</li>
              <li style={{ display: 'flex', gap: 10 }}><CheckmarkBadge01Icon size={16} /> PDF + PPTX Export</li>
              <li style={{ display: 'flex', gap: 10 }}><CheckmarkBadge01Icon size={16} color="var(--color-accent)"/> Red Team Mode</li>
            </ul>
          </div>

          {/* Agency */}
          <div className="glass-panel" style={{ padding: 30, border: user?.plan === 'agency' ? '2px solid var(--color-primary)' : '' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 5 }}>Agency</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 20 }}>$149<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>/mo</span></div>
            {user?.plan === 'agency' ? (
              <button className="btn-primary" style={{ width: '100%', marginBottom: 20 }} disabled>Current Plan</button>
            ) : (
              <button onClick={() => setSelectedPlan('agency')} className="btn-secondary" style={{ width: '100%', marginBottom: 20 }}>
                Upgrade to Agency
              </button>
            )}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', gap: 10 }}><CheckmarkBadge01Icon size={16} /> Unlimited Projects</li>
              <li style={{ display: 'flex', gap: 10 }}><CheckmarkBadge01Icon size={16} /> White-label Exports</li>
              <li style={{ display: 'flex', gap: 10 }}><CheckmarkBadge01Icon size={16} /> Priority Support</li>
            </ul>
          </div>

        </div>

        {/* Selected Plan Details & Payment Selection */}
        {selectedPlan && (
          <div className="glass-panel" style={{ marginTop: 40, padding: 30, border: '1px solid var(--color-accent)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 20 }}>Complete Upgrade to <span style={{ textTransform: 'capitalize' }}>{selectedPlan}</span></h2>
            
            <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
              <div 
                style={{ flex: 1, padding: 20, border: paymentMethod === 'stripe' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: 12, cursor: 'pointer', background: paymentMethod === 'stripe' ? 'rgba(124, 58, 237, 0.05)' : 'white' }}
                onClick={() => setPaymentMethod('stripe')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <CreditCardIcon size={24} color="var(--color-primary)" />
                  <span style={{ fontWeight: 600 }}>Credit Card</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Pay via Stripe Secure Checkout</p>
              </div>

              <div 
                style={{ flex: 1, padding: 20, border: paymentMethod === 'campay_mtn' ? '2px solid #FFCC00' : '1px solid var(--color-border)', borderRadius: 12, cursor: 'pointer', background: paymentMethod === 'campay_mtn' ? 'rgba(255, 204, 0, 0.05)' : 'white' }}
                onClick={() => setPaymentMethod('campay_mtn')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 24, height: 24, background: '#FFCC00', borderRadius: '50%' }} />
                  <span style={{ fontWeight: 600 }}>MTN MoMo</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Pay with MTN Mobile Money</p>
              </div>

              <div 
                style={{ flex: 1, padding: 20, border: paymentMethod === 'campay_orange' ? '2px solid #FF6600' : '1px solid var(--color-border)', borderRadius: 12, cursor: 'pointer', background: paymentMethod === 'campay_orange' ? 'rgba(255, 102, 0, 0.05)' : 'white' }}
                onClick={() => setPaymentMethod('campay_orange')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 24, height: 24, background: '#FF6600', borderRadius: '50%' }} />
                  <span style={{ fontWeight: 600 }}>Orange Money</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Pay with Orange Money</p>
              </div>
            </div>

            {(paymentMethod === 'campay_mtn' || paymentMethod === 'campay_orange') && (
              <div style={{ marginBottom: 30 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Enter Mobile Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 237670000000" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
                  Include country code (e.g., 237 for Cameroon). You will receive a prompt on your phone.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16 }}>
              <button 
                className="btn-primary" 
                style={{ flex: 2, padding: '14px' }} 
                onClick={handleSubscribe}
                disabled={!!loadingPlan}
              >
                {loadingPlan ? 'Processing Payment...' : `Subscribe for $${selectedPlan === 'founder' ? '49' : '149'}/mo`}
              </button>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: '14px' }} 
                onClick={() => setSelectedPlan(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 20 }}>Payment Methods</h2>
          <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <CreditCardIcon size={32} color="var(--color-primary-light)" />
              <div>
                <p style={{ fontWeight: 600 }}>Stripe Integration</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Secure one-click checkout enabled</p>
              </div>
            </div>
            <button className="btn-secondary" style={{ padding: '8px 16px' }} onClick={() => {
              setSelectedPlan(user?.plan || 'hacker');
              setPaymentMethod('stripe');
            }}>Refill</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
