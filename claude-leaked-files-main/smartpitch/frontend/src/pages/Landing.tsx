import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket01Icon, 
  CodeIcon, 
  PresentationOnlineIcon, 
  ArtificialIntelligence01Icon,
  CheckmarkBadge01Icon,
  GithubIcon
} from 'hugeicons-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <nav style={{ 
        padding: '16px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <ArtificialIntelligence01Icon color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Smart<span style={{ color: 'var(--color-primary)' }}>Pitch</span></h2>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#features" style={{ fontWeight: 500 }}>Features</a>
          <a href="#pricing" style={{ fontWeight: 500 }}>Pricing</a>
          <button className="btn-secondary" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '120px 20px',
        textAlign: 'center',
        background: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Decorative Elements */}
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 500, height: 500, background: '#E8F0FE', filter: 'blur(120px)', opacity: 0.8, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: 400, height: 400, background: '#F1F3F4', filter: 'blur(120px)', opacity: 0.8, borderRadius: '50%' }} />

        <div style={{ zIndex: 10, maxWidth: 800 }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            background: '#E8F0FE', 
            border: '1px solid #ADCCFB',
            padding: '6px 16px',
            borderRadius: 30,
            marginBottom: 24,
            fontWeight: 500,
            color: 'var(--color-primary)'
          }}>
            <Rocket01Icon size={18} />
            <span>SmartPitch 2.0 is live! Generate pitches 10x faster.</span>
          </div>
          
          <h1 style={{ fontSize: '4.5rem', lineHeight: 1.1, marginBottom: 24 }}>
            Turn your GitHub Repo into a <br/>
            <span className="text-gradient">Fundable Pitch Deck</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', marginBottom: 40, maxWidth: 640, margin: '0 auto 40px' }}>
            Powered by advanced AI, our platform analyzes your codebase, architecture, and logic to automatically generate stunning pitch decks and technical reviews for investors.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => navigate('/register')}>
              <GithubIcon size={24} />
              Analyze Repo Now
            </button>
            <button className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              View Sample Deck
            </button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" style={{ padding: '100px 20px', background: '#F8F9FA', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ fontSize: '3rem', marginBottom: 16 }}>Everything you need to <span style={{ color: 'var(--color-primary)' }}>raise capital</span></h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>From raw code to high-converting executive summaries and slide decks.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>
            <div className="glass-panel" style={{ padding: 40 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <CodeIcon size={28} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: 10 }}>Deep Code Analysis</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>Our AI streams through your repositories without cloning, understanding architecture, tech stack, and scalability.</p>
            </div>
            
            <div className="glass-panel" style={{ padding: 40 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <PresentationOnlineIcon size={28} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: 10 }}>Instant Decks</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>Export beautifully styled PDF and PPTX decks automatically styled for SaaS, Tech, or Corporate aesthetics.</p>
            </div>

            <div className="glass-panel" style={{ padding: 40 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <ArtificialIntelligence01Icon size={28} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: 10 }}>Red Team Investor Mode</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>Get aggressively grilled by our tier-1 investor AI persona before you actually hit the boardroom. Practice hard questions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '100px 20px', position: 'relative', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: '3rem', marginBottom: 16 }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Choose the plan that fits your fundraising stage.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap' }}>
            {/* Hacker Plan */}
            <div className="glass-panel" style={{ width: 350, padding: 40, borderTop: '4px solid #6B7280' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: 5 }}>Hacker</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Solodevs & Early Founders</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 30 }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 700 }}>$19</span>
                <span style={{ color: 'var(--color-text-muted)' }}>/mo</span>
              </div>
              <button className="btn-secondary" style={{ width: '100%', marginBottom: 30 }}>Get Starter</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckmarkBadge01Icon color="var(--color-primary-light)" size={20}/> <span>1 Project analysis/mo</span></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckmarkBadge01Icon color="var(--color-primary-light)" size={20}/> <span>Standard AI reasoning</span></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckmarkBadge01Icon color="var(--color-primary-light)" size={20}/> <span>PDF export only</span></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--color-text-muted)' }}><CheckmarkBadge01Icon color="transparent" size={20}/> <span style={{ textDecoration: 'line-through' }}>PPTX exports</span></div>
              </div>
            </div>

            {/* Founder Plan */}
            <div className="glass-panel" style={{ width: 350, padding: 40, border: '2px solid var(--color-primary)', transform: 'scale(1.05)', boxShadow: '0 10px 25px rgba(26, 115, 232, 0.15)', position: 'relative', background: '#fff' }}>
              <div style={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-primary)', color: '#fff', padding: '5px 15px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>MOST POPULAR</div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: 5 }}>Founder</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Active fundraising stage</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 30 }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 700 }}>$49</span>
                <span style={{ color: 'var(--color-text-muted)' }}>/mo</span>
              </div>
              <button className="btn-primary" style={{ width: '100%', marginBottom: 30 }}>Go Pro</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckmarkBadge01Icon color="var(--color-primary)" size={20}/> <span>5 Project analyses/mo</span></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckmarkBadge01Icon color="var(--color-primary)" size={20}/> <span>PDF + PPTX exports</span></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckmarkBadge01Icon color="var(--color-primary)" size={20}/> <span>"Red Team" AI Challenge</span></div>
              </div>
            </div>

            {/* Agency Plan */}
            <div className="glass-panel" style={{ width: 340, padding: 40, borderTop: '4px solid var(--color-accent)', background: '#fff' }}>
               <h3 style={{ fontSize: '1.8rem', marginBottom: 5 }}>Agency</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Dev shops & Consultants</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 30 }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 700 }}>$149</span>
                <span style={{ color: 'var(--color-text-muted)' }}>/mo</span>
              </div>
              <button className="btn-secondary" style={{ width: '100%', marginBottom: 30 }}>Get Agency</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckmarkBadge01Icon color="var(--color-primary)" size={20}/> <span>Unlimited analyses</span></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><CheckmarkBadge01Icon color="var(--color-primary)" size={20}/> <span>White-labeling support</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '60px 20px', background: '#F8F9FA', borderTop: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <p style={{ fontSize: '0.9rem' }}>© 2026 SmartPitch AI. A Google-style Documentation Companion. All rights reserved.</p>
         <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 32, fontSize: '0.9rem' }}>
          <a href="#" style={{ color: 'var(--color-text-muted)' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'var(--color-text-muted)' }}>Terms</a>
          <a href="#" style={{ color: 'var(--color-text-muted)' }}>Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
