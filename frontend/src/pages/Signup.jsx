import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Emergency Contact State
  const [ecName, setEcName] = useState('');
  const [ecEmail, setEcEmail] = useState('');
  const [ecPhone, setEcPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        phone,
        password,
        emergencyContacts: [
          {
            name: ecName,
            email: ecEmail,
            phone: ecPhone
          }
        ]
      };

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const ct = res.headers.get('content-type') || '';
      const text = await res.text();
      let data = null;
      if (ct.includes('application/json') && text) {
        try { data = JSON.parse(text); } catch {}
      }
      if (!res.ok) {
        throw new Error((data && data.message) || `Failed to sign up (${res.status})`);
      }
      navigate('/signin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <style>{`
        :root {
          --primary: #b11226;
          --primary-dark: #7f0d1b;
          --white: #ffffff;
          --bg: #0b0b0d;
          --panel: #111218;
          --card: #161820;
          --border: #252632;
        }
        * { box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }

        .auth-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          background: radial-gradient(circle at 20% 20%, rgba(177, 18, 38, 0.14), transparent 28%),
                      radial-gradient(circle at 80% 0%, rgba(177, 18, 38, 0.18), transparent 32%),
                      var(--bg);
        }
        .auth-container {
          width: 100%;
          max-width: 940px;
          background: linear-gradient(145deg, rgba(17, 18, 24, 0.98), rgba(22, 24, 32, 0.98));
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45),
                      0 10px 30px rgba(128, 128, 128, 0.3),
                      0 5px 15px rgba(169, 169, 169, 0.2);
          display: flex;
          overflow: hidden;
          animation: fadeUp 0.6s ease forwards;
        }
        .left-panel {
          flex: 1;
          background: linear-gradient(165deg, var(--primary) 0%, #a63240ff 50%, #350308 100%);
          color: var(--white);
          padding: 64px 52px;
          clip-path: polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
          position: relative;
          overflow: hidden;
        }
        .left-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.08), transparent 40%);
          pointer-events: none;
        }
        .logo { font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .welcome-text h1 { font-size: 32px; font-weight: 700; margin: 0 0 12px; }
        .welcome-text p { font-size: 15px; line-height: 1.7; opacity: 0.95; margin: 0; max-width: 320px; }

        .right-panel {
          flex: 1;
          padding: 64px 52px;
          background: var(--card);
          display: flex;
          flex-direction: column;
          justify-content: center;
          animation: slideIn 0.6s ease 0.1s both;
        }
        .right-panel h2 { color: var(--white); font-size: 26px; margin-bottom: 8px; letter-spacing: -0.3px; }
        .right-panel p { font-size: 14px; color: #b8bac7; margin-bottom: 26px; }

        .input-group { margin-bottom: 18px; }
        .input-group input {
          width: 100%; padding: 12px 14px; border-radius: 10px; border: 1.5px solid var(--border);
          font-size: 14px; background: #0f1016; color: var(--white); transition: all 0.25s ease;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 3px rgba(128,128,128,0.2), 0 4px 8px rgba(128,128,128,0.15), 0 2px 4px rgba(169,169,169,0.1);
        }
        .input-group input:focus {
          outline: none; border-color: var(--primary);
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 4px rgba(128,128,128,0.25),
                      0 0 0 3px rgba(177,18,38,0.15), 0 6px 12px rgba(128,128,128,0.2), 0 3px 6px rgba(169,169,169,0.15);
          transform: translateY(-2px);
        }

        button {
          width: 100%; padding: 13px; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          border: none; border-radius: 12px; color: var(--white); font-size: 16px; font-weight: 700;
          cursor: pointer; letter-spacing: 0.3px; transition: all 0.25s ease; box-shadow: 0 12px 28px rgba(177,18,38,0.32);
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(177,18,38,0.4); }
        button:active { transform: translateY(0); }
        button:disabled { opacity: 0.7; cursor: not-allowed; }

        .switch { margin-top: 24px; text-align: center; font-size: 14px; color: #888; }
        
        @media (max-width: 768px) {
          .auth-container { flex-direction: column; max-width: 400px; }
          .left-panel { padding: 40px 32px; clip-path: none; text-align: center; align-items: center; }
          .welcome-text p { max-width: 100%; }
          .right-panel { padding: 42px 32px 50px; }
        }
      `}</style>

      <div className="auth-container">
        <div className="left-panel">
          <div className="logo">EchoGaurd</div>
          <div className="welcome-text">
            <h1>Join Us</h1>
            <p>Create your account to access real-time safety monitoring and alerts dashboard.</p>
          </div>
        </div>

        <div className="right-panel">
          <h2>Sign Up</h2>
          <p>Create your new account</p>
          <form onSubmit={handleSignup}>
            {/* User Details */}
            <div className="input-group">
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <input type="tel" placeholder="Your Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>

            {/* Password Section */}
            <div className="grid-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
              </div>
              <div className="input-group">
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div style={{ margin: '20px 0 10px', borderTop: '1px solid #333', paddingTop: '15px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '15px' }}>Emergency Contact</h3>
              <div className="input-group">
                <input type="text" placeholder="Contact Name" value={ecName} onChange={(e) => setEcName(e.target.value)} required />
              </div>
              <div className="grid-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <input type="email" placeholder="Contact Email" value={ecEmail} onChange={(e) => setEcEmail(e.target.value)} required />
                </div>
                <div className="input-group">
                  <input type="tel" placeholder="Contact Phone" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} required />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: '10px' }}>{loading ? 'Creating Account...' : 'Sign Up'}</button>
          </form>

          {error && <div style={{ color: '#ffb3b3', marginTop: 12, fontSize: 13 }}>{error}</div>}

          <div className="switch">
            Already have an account?
            <Link to="/signin" style={{ color: 'var(--primary)', marginLeft: 4 }}> Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
