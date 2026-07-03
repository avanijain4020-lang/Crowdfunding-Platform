import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5002/api/campaigns';
const AUTH_URL = 'http://localhost:5002/api/auth';

function App() {
  // --- States ---
  const [campaigns, setCampaigns] = useState([]);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [category, setCategory] = useState('');

  // Auth States
  const [user, setUser] = useState(null); 
  const [isLoginView, setIsLoginView] = useState(true); 
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Navigation View Toggle ('dashboard' ya 'profile')
  const [currentView, setCurrentView] = useState('dashboard');

  // --- NEW STATES: Payment Modal ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activePaymentCampaign, setActivePaymentCampaign] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' ya 'upi'
  const [paymentForm, setPaymentForm] = useState({ cardNumber: '', expiry: '', cvv: '', upiId: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Fetch Campaigns ---
  const fetchCampaigns = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // --- Auth Handlers ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isLoginView ? '/login' : '/signup';
    
    try {
      const response = await fetch(`${AUTH_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (isLoginView) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setCurrentView('dashboard'); 
      } else {
        alert("Registration Successful! Please Login. 🎉");
        setIsLoginView(true);
      }
      setAuthForm({ name: '', email: '', password: '' });
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // --- Campaign Handlers ---
  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, goal, category })
      });
      
      if (response.ok) {
        setTitle(''); setGoal(''); setCategory('');
        fetchCampaigns();
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to create campaign");
      }
    } catch (error) {
      console.error("Error creating:", error);
    }
  };

  // --- Trigger Payment Modal ---
  const openPaymentGateway = (campaign) => {
    const amt = document.getElementById(`amt-${campaign._id}`).value;
    if (!amt || Number(amt) <= 0) {
      alert("Please enter a valid amount to fund!");
      return;
    }
    setDonationAmount(amt);
    setActivePaymentCampaign(campaign);
    setShowPaymentModal(true);
  };

  // --- Process Secure Donation (Triggered inside Modal) ---
  const handleSecurePaymentSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login to make a donation.");
      return;
    }

    setIsProcessing(true); // Spinner/Loading start

    // 2 Seconds ka fake delay simulation premium experience ke liye
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/${activePaymentCampaign._id}/pledge`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount: donationAmount })
        });

        if (response.ok) {
          alert(`🎉 Payment Successful! Thank you for supporting "${activePaymentCampaign.title}"`);
          setShowPaymentModal(false);
          setDonationAmount('');
          setPaymentForm({ cardNumber: '', expiry: '', cvv: '', upiId: '' });
          document.getElementById(`amt-${activePaymentCampaign._id}`).value = '';
          fetchCampaigns();
        } else {
          const errData = await response.json();
          alert(errData.message || "Donation failed");
        }
      } catch (error) {
        console.error("Error donating:", error);
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  const handleDelete = async (id, creatorId) => {
    if (!confirm("Are you sure you want to close this campaign?")) return;
    
    if (creatorId !== user.id) {
      alert("❌ Unauthorized! You can only close your own campaigns.");
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchCampaigns();
      } else {
        const errData = await response.json();
        alert(errData.message);
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const totalCampaigns = campaigns.length;
  const totalFundsRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);

  const myCampaigns = campaigns.filter(c => c.userId && user && c.userId === user.id);
  const myTotalRaised = myCampaigns.reduce((sum, c) => sum + c.raised, 0);

  // --- RENDER CONDITION 1: Login Screen ---
  if (!user) {
    return (
      <div className="glass-wrapper">
        <div className="glass-card">
          <h2>{isLoginView ? 'Welcome Back' : 'Get Started'}</h2>
          <p className="subtitle">{isLoginView ? 'Login to access your fundraising dashboard' : 'Create a secure account to launch campaigns'}</p>
          {authError && <div style={{ color: '#fda4af', background: 'rgba(225, 29, 72, 0.2)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(225, 29, 72, 0.3)', fontWeight: '500' }}>⚠️ {authError}</div>}
          <form onSubmit={handleAuthSubmit}>
            {!isLoginView && (
              <div className="glass-form-group">
                <label>Full Name</label>
                <div className="input-with-icon"><span className="input-icon">👤</span><input type="text" placeholder="John Doe" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required /></div>
              </div>
            )}
            <div className="glass-form-group">
              <label>Email Address</label>
              <div className="input-with-icon"><span className="input-icon">✉️</span><input type="email" placeholder="name@example.com" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required /></div>
            </div>
            <div className="glass-form-group">
              <label>Password</label>
              <div className="input-with-icon"><span className="input-icon">🔒</span><input type="password" placeholder="••••••••" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required /></div>
            </div>
            <button type="submit" className="btn-glass">{isLoginView ? 'Sign In' : 'Create Account'}</button>
          </form>
          <p className="glass-switch-text">{isLoginView ? "Don't have an account?" : "Already have an account?"}<span className="glass-link" onClick={() => { setIsLoginView(!isLoginView); setAuthError(''); }}>{isLoginView ? 'Register here' : 'Login here'}</span></p>
        </div>
      </div>
    );
  }

  // --- RENDER CONDITION 2: Main Dashboard & Profile ---
  return (
    <div className="app-container">
      <header style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setCurrentView('dashboard')} style={{ background: currentView === 'dashboard' ? '#6366f1' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>🏠 Home</button>
          <button onClick={() => setCurrentView('profile')} style={{ background: currentView === 'profile' ? '#6366f1' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>👤 My Profile</button>
          <button onClick={handleLogout} style={{ background: '#e11d48', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Logout 🚪</button>
        </div>
        <h1>🚀 FundMyProject</h1>
        <p>{currentView === 'dashboard' ? 'A premium, fast, and secure crowdfunding platform.' : 'Manage your identity and customized fundraising matrix.'}</p>
      </header>

      <div className="main-content">
        
        {/* --- VIEW 1: DASHBOARD --- */}
        {currentView === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card dark"><h3>Total Active Projects</h3><p>{totalCampaigns}</p></div>
              <div className="stat-card green"><h3>Total Funds Raised</h3><p>${totalFundsRaised}</p></div>
            </div>

            <div className="dashboard-layout">
              <section className="form-section">
                <h2>Start a Campaign</h2>
                <form onSubmit={handleCreate}>
                  <div className="form-group"><label>Project Title</label><input type="text" placeholder="e.g. Smart Watch" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                  <div className="form-group"><label>Funding Goal ($)</label><input type="number" placeholder="Min 100" value={goal} onChange={(e) => setGoal(e.target.value)} required /></div>
                  <div className="form-group"><label>Category</label><input type="text" placeholder="e.g. Technology" value={category} onChange={(e) => setCategory(e.target.value)} required /></div>
                  <button type="submit" className="btn-primary">Launch Campaign 🚀</button>
                </form>
              </section>

              <section className="campaigns-section">
                <h2>Active Campaigns</h2>
                <div className="campaigns-grid">
                  {campaigns.map((campaign) => {
                    let percentage = Math.round((campaign.raised / campaign.goal) * 100);
                    if (percentage > 100) percentage = 100;

                    return (
                      <div className="card" key={campaign._id} style={{ minHeight: '380px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="category-tag">{campaign.category}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>By: {campaign.createdBy || 'Anonymous'}</span>
                          </div>
                          <h3>{campaign.title}</h3>
                          
                          <div className="goal-raised">
                            <div><span>Goal</span><strong>${campaign.goal}</strong></div>
                            <div><span>Raised</span><strong style={{color: '#10b981'}}>${campaign.raised}</strong></div>
                          </div>
                          
                          <div className="progress-bar"><div className="progress-fill" style={{ width: `${percentage}%` }}></div></div>
                          <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{percentage}% Funded</span>

                          <div style={{ marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>👥 Recent Supporters:</span>
                            <div style={{ maxHeight: '75px', overflowY: 'auto', background: '#fff', borderRadius: '6px', padding: '5px', border: '1px solid #f1f5f9' }}>
                              {campaign.donors && campaign.donors.length > 0 ? (
                                campaign.donors.map((donor, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '3px 0', borderBottom: idx !== campaign.donors.length - 1 ? '1px dashed #f1f5f9' : 'none' }}>
                                    <span style={{ color: '#64748b' }}>❤️ {donor.donorName}</span>
                                    <strong style={{ color: '#10b981' }}>+${donor.amount}</strong>
                                  </div>
                                ))
                              ) : (
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', padding: '5px 0' }}>No donors yet. Be the first!</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="card-actions">
                          {percentage >= 100 ? (
                            <div className="target-achieved">🎉 Target Achieved!</div>
                          ) : (
                            <div className="donate-form">
                              <input type="number" id={`amt-${campaign._id}`} placeholder="Amt ($)" />
                              {/* Open payment gateway modal */}
                              <button className="btn-success" onClick={() => openPaymentGateway(campaign)}>Fund</button>
                            </div>
                          )}
                          <button className="btn-danger" onClick={() => handleDelete(campaign._id, campaign.userId)}>❌ Close</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        )}

        {/* --- VIEW 2: USER PROFILE SECTION --- */}
        {currentView === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
            <div className="form-section" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '25px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
              <div style={{ fontSize: '3.5rem', background: '#e0e7ff', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(99,102,241,0.15)' }}>👤</div>
              <div>
                <h2 style={{ margin: '0 0 5px 0', border: 'none', padding: '0', fontSize: '1.8rem', color: '#1e1b4b' }}>{user.name}</h2>
                <p style={{ margin: '0', color: '#64748b', fontSize: '1rem' }}>📧 Email: <strong>{user.email}</strong></p>
                <span style={{ display: 'inline-block', marginTop: '10px', padding: '4px 12px', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Verified Account</span>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card dark" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' }}><h3>My Launched Projects</h3><p>{myCampaigns.length}</p></div>
              <div className="stat-card green" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}><h3>Total Funds My Projects Raised</h3><p>${myTotalRaised}</p></div>
            </div>

            <div className="campaigns-section">
              <h2>My Managed Campaigns ({myCampaigns.length})</h2>
              {myCampaigns.length > 0 ? (
                <div className="campaigns-grid">
                  {myCampaigns.map((campaign) => {
                    let percentage = Math.round((campaign.raised / campaign.goal) * 100);
                    if (percentage > 100) percentage = 100;

                    return (
                      <div className="card" key={campaign._id} style={{ minHeight: '280px', background: '#fff', border: '1px solid #e2e8f0' }}>
                        <div>
                          <span className="category-tag" style={{ background: '#f3e8ff', color: '#7c3aed' }}>{campaign.category}</span>
                          <h3 style={{ marginTop: '10px' }}>{campaign.title}</h3>
                          <div className="goal-raised" style={{ marginTop: '15px' }}>
                            <div><span>Target Goal</span><strong>${campaign.goal}</strong></div>
                            <div><span>Total Accumulated</span><strong style={{color: '#7c3aed'}}>${campaign.raised}</strong></div>
                          </div>
                          <div className="progress-bar" style={{ background: '#f1f5f9' }}><div className="progress-fill" style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)' }}></div></div>
                          <span style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#6d28d9'}}>{percentage}% Completed</span>
                        </div>
                        <div className="card-actions" style={{ marginTop: '15px' }}><button className="btn-danger" style={{ width: '100%' }} onClick={() => handleDelete(campaign._id, campaign.userId)}>❌ Close Campaign Permanently</button></div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📁</div>
                  <p style={{ margin: '0', fontSize: '0.95rem' }}>You haven't launched any campaign yet. Go to Home tab to launch your first concept!</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* --- NEW: PAYMENT MOCKUP MODAL GATEWAY UI --- */}
      {showPaymentModal && activePaymentCampaign && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', width: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', border: '1px solid #e2e8f0', position: 'relative' }}>
            <button onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '2.5rem' }}>🔒</span>
              <h3 style={{ margin: '10px 0 5px 0', fontSize: '1.3rem', color: '#0f172a' }}>Secure Checkout</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Funding <strong>{activePaymentCampaign.title}</strong></p>
              <div style={{ marginTop: '12px', background: '#f0fdf4', padding: '8px', borderRadius: '8px', color: '#16a34a', fontWeight: 'bold', fontSize: '1.2rem' }}>${donationAmount}</div>
            </div>

            {/* Payment Method Toggle Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '4px', borderRadius: '8px' }}>
              <button type="button" onClick={() => setPaymentMethod('card')} style={{ flex: 1, padding: '8px', border: 'none', background: paymentMethod === 'card' ? '#ffffff' : 'none', color: paymentMethod === 'card' ? '#4f46e5' : '#64748b', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', boxShadow: paymentMethod === 'card' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>💳 Card</button>
              <button type="button" onClick={() => setPaymentMethod('upi')} style={{ flex: 1, padding: '8px', border: 'none', background: paymentMethod === 'upi' ? '#ffffff' : 'none', color: paymentMethod === 'upi' ? '#4f46e5' : '#64748b', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', boxShadow: paymentMethod === 'upi' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>📱 UPI ID</button>
            </div>

            <form onSubmit={handleSecurePaymentSubmit}>
              {paymentMethod === 'card' ? (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Card Number</label>
                    <input type="text" placeholder="4111 2222 3333 4444" value={paymentForm.cardNumber} onChange={(e) => setPaymentForm({...paymentForm, cardNumber: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} required={paymentMethod === 'card'} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Expiry</label>
                      <input type="text" placeholder="MM/YY" value={paymentForm.expiry} onChange={(e) => setPaymentForm({...paymentForm, expiry: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', textAlign: 'center' }} required={paymentMethod === 'card'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>CVV</label>
                      <input type="password" placeholder="•••" maxLength="3" value={paymentForm.cvv} onChange={(e) => setPaymentForm({...paymentForm, cvv: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', textAlign: 'center' }} required={paymentMethod === 'card'} />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Virtual Payment Address (VPA)</label>
                  <input type="text" placeholder="username@upi" value={paymentForm.upiId} onChange={(e) => setPaymentForm({...paymentForm, upiId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} required={paymentMethod === 'upi'} />
                </div>
              )}

              <button type="submit" disabled={isProcessing} style={{ width: '100%', padding: '12px', background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1 }}>
                {isProcessing ? '🔄 Authorizing Secure Gateway...' : `Pay & Fund $${donationAmount}`}
              </button>
            </form>
            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: '12px', margin: '12px 0 0 0' }}>🔒 256-Bit SSL Mock Encryption Gateway Protocol</p>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;