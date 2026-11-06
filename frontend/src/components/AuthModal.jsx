import BrandLogo from './BrandLogo.jsx';
/* The login/signup popup. Its open/closed state is controlled globally by context/AuthModalContext.jsx, so it can be triggered from any page (e.g. the 'Login' button in Nav, or the assessment gate). */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuthModal } from '../context/AuthModalContext.jsx';
import PasswordInput from './PasswordInput.jsx';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

export default function AuthModal() {
  const { isOpen, tab, setTab, closeAuth } = useAuthModal();
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMsg, setLoginMsg] = useState({ text: '', type: '' });
  const [loginBusy, setLoginBusy] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupMsg, setSignupMsg] = useState({ text: '', type: '' });
  const [signupBusy, setSignupBusy] = useState(false);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  // Switching modes clears messages from the previous login or signup attempt.
  function switchTab(next) {
    setTab(next);
    setLoginMsg({ text: '', type: '' });
    setSignupMsg({ text: '', type: '' });
  }

  // A click inside the dialog must not close it.
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) closeAuth();
  }

  // Supabase updates AuthContext through its auth-state listener after sign-in.
  async function handleLogin(e) {
    e.preventDefault();
    setLoginBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoginBusy(false);

    if (error) {
      setLoginMsg({ text: error.message, type: 'error' });
    } else {
      closeAuth();
      navigate('/dashboard');
    }
  }

  // Store the display name in Supabase user metadata for the dashboards.
  async function handleSignup(e) {
    e.preventDefault();
    setSignupBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { data: { full_name: signupName } },
    });
    setSignupBusy(false);

    if (error) {
      setSignupMsg({ text: error.message, type: 'error' });
    } else {
      // With email confirmation off, Supabase signs the new user in straight away.
      if (data?.session) {
        closeAuth();
        navigate('/dashboard');
        return;
      }
      setSignupMsg({ text: '✓ Account created! You can now log in.', type: 'success' });
    }
  }

  return (
    <div className="auth-overlay open" id="authOverlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <button className="auth-close" onClick={closeAuth}>×</button>
        <div className="auth-brand">
          <BrandLogo />
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' auth-tab--active' : ''}`} onClick={() => switchTab('login')}>Login</button>
          <button className={`auth-tab${tab === 'signup' ? ' auth-tab--active' : ''}`} onClick={() => switchTab('signup')}>Sign Up</button>
        </div>

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" required
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordInput placeholder="Your password" required
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </div>
            {loginMsg.text && <div className={`auth-msg ${loginMsg.type}`}>{loginMsg.text}</div>}
            <button type="submit" className="btn authmodal-login-btn btn--full" disabled={loginBusy}>
              {loginBusy ? 'Logging in…' : 'Login'}
            </button>
            <p className="auth-switch">No account? <span onClick={() => switchTab('signup')}>Sign up free →</span></p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="Sara Ahmed" required
                value={signupName} onChange={(e) => setSignupName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" required
                value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordInput placeholder="Min 6 characters" required minLength={6}
                value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
            </div>
            {signupMsg.text && <div className={`auth-msg ${signupMsg.type}`}>{signupMsg.text}</div>}
            <button type="submit" className="btn authmodal-signup-btn btn--full" disabled={signupBusy}>
              {signupBusy ? 'Creating account…' : 'Create Account'}
            </button>
            <p className="auth-switch">Have an account? <span onClick={() => switchTab('login')}>Login →</span></p>
          </form>
        )}
      </div>
    </div>
  );
}
