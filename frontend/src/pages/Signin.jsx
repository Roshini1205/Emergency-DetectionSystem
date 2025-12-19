import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const ct = res.headers.get('content-type') || '';
      const text = await res.text();
      let data = null;
      if (ct.includes('application/json') && text) {
        try { data = JSON.parse(text); } catch {}
      }
      if (!res.ok) {
        throw new Error((data && data.message) || `Failed to sign in (${res.status})`);
      }
      if (data?.token) localStorage.setItem('token', data.token);
      if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <style>{`
        /* ==== Your original CSS from Signin page ==== */
        :root { --primary: #b11226; --primary-dark: #7f0d1b; --white: #ffffff; --bg: #0b0b0d; --panel: #111218; --card: #161820; --border: #252632; }
        * { box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(30px);} to { opacity:1; transform: translateY(0);} }
        @keyframes slideIn { from { opacity:0; transform: translateX(-20px);} to { opacity:1; transform: translateX(0);} }
        .auth-shell { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:32px 16px; background: radial-gradient(circle at 20% 20%, rgba(177,18,38,0.14), transparent 28%), radial-gradient(circle at 80% 0%, rgba(177,18,38,0.18), transparent 32%), var(--bg);}
        .auth-container { width:100%; max-width:940px; background: linear-gradient(145deg, rgba(17,18,24,0.98), rgba(22,24,32,0.98)); border:1px solid var(--border); border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.45), 0 10px 30px rgba(128,128,128,0.3), 0 5px 15px rgba(169,169,169,0.2); display:flex; overflow:hidden; animation:fadeUp 0.6s ease forwards;}
        .left-panel { flex:1; background: linear-gradient(165deg, var(--primary) 0%, #a63240ff 50%, #350308 100%); color: var(--white); padding:64px 52px; clip-path: polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%); display:flex; flex-direction:column; justify-content:center; gap:18px; position:relative; overflow:hidden;}
        .left-panel::after { content:''; position:absolute; inset:0; background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 40%); pointer-events:none;}
        .logo { font-size:22px; font-weight:700; letter-spacing:0.5px; }
        .welcome-text h1 { font-size:32px; font-weight:700; margin:0 0 12px;}
        .welcome-text p { font-size:15px; line-height:1.7; opacity:0.95; margin:0; max-width:320px;}
        .right-panel { flex:1; padding:64px 52px; background: var(--card); display:flex; flex-direction:column; justify-content:center; animation: slideIn 0.6s ease 0.1s both;}
        .right-panel h2 { color:var(--white); font-size:26px; margin-bottom:8px; letter-spacing:-0.3px;}
        .right-panel p { font-size:14px; color:#b8bac7; margin-bottom:26px;}
        .input-group { margin-bottom:18px;}
        .input-group input { width:100%; padding:12px 14px; border-radius:10px; border:1.5px solid var(--border); font-size:14px; background:#0f1016; color:var(--white); transition:all 0.25s ease; box-shadow: inset 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 3px rgba(128,128,128,0.2), 0 4px 8px rgba(128,128,128,0.15), 0 2px 4px rgba(169,169,169,0.1);}
        .input-group input:focus { outline:none; border-color:var(--primary); transform:translateY(-2px);}
        .forgot-password { text-align:right; margin-top:-10px; margin-bottom:22px;}
        .forgot-password a { color:#e6e6e6; font-size:13px; text-decoration:none; }
        .forgot-password a:hover { color:var(--primary); text-decoration:underline;}
        button { width:100%; padding:13px; background:linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); border:none; border-radius:12px; color:var(--white); font-size:16px; font-weight:700; cursor:pointer; letter-spacing:0.3px; transition:all 0.25s ease; box-shadow:0 12px 28px rgba(177,18,38,0.32);}
        button:hover { background: linear-gradient(135deg, var(--primary-dark) 0%, #5c0a14 100%); transform:translateY(-2px);}
        .switch { margin-top:18px; text-align:center; font-size:14px; color:#c9c9d4;}
        .switch span { color:var(--primary); cursor:pointer; font-weight:600; margin-left:4px; }
        @media (max-width:900px) { .auth-container { flex-direction:column;} .left-panel { clip-path:none; padding:46px 34px; text-align:center; align-items:center;} .welcome-text p { max-width:100%;} .right-panel { padding:42px 32px 50px;} }
      `}</style>

      <div className="auth-container">
        <div className="left-panel">
          <div className="logo">EchoGaurd</div>
          <div className="welcome-text">
            <h1>Hello, welcome</h1>
            <p>Real-time incident monitoring, rapid alerts, and a unified safety dashboard—all in one secure place.</p>
          </div>
        </div>

        <div className="right-panel">
          <h2>Sign In</h2>
          <p>Access your safety dashboard</p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="input-group">
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="forgot-password">
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Forgot password clicked'); }}>Forgot Password?</a>
            </div>

            <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
          </form>

          {error && <div style={{ color:'#ffb3b3', marginTop:12, fontSize:13 }}>{error}</div>}

          <div className="switch">
            Don't have an account?
            <Link to="/signup" style={{ color:'var(--primary)', marginLeft:'4px' }}>Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signin;
