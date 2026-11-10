import BrandLogo from '../components/BrandLogo.jsx';
/* Separate login screen for the admin route. Route: /admin/login. */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState({ text: '', type: '' });
  const [forgotBusy, setForgotBusy] = useState(false);

  if (isAdmin) {
    navigate('/admin');
    return null;
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setForgotBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotBusy(false);

    if (error) {
      setForgotMsg({ text: error.message, type: 'error' });
    } else {
      setForgotMsg({ text: '✓ Check your email for a password reset link.', type: 'success' });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ text: '', type: '' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setBusy(false);
      setMsg({ text: error.message, type: 'error' });
      return;
    }

    // Reject a valid Supabase login here if it is not configured as an admin.
    // Protected API routes independently enforce their own ADMIN_EMAILS list.
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (!adminEmails.includes((data.user.email || '').toLowerCase())) {
      await supabase.auth.signOut();
      setBusy(false);
      setMsg({ text: 'This account does not have admin access.', type: 'error' });
      return;
    }

    navigate('/admin');
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="auth-brand">
          <BrandLogo />
        </div>
        <p className="admin-login-eyebrow">Admin Sign In</p>

        {!forgot ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordInput
                placeholder="Your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {msg.text && <div className={`auth-msg ${msg.type}`}>{msg.text}</div>}
            <button type="submit" className="btn admin-login-submit-btn btn--full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In to Admin'}
            </button>
            <p className="auth-switch">
              <span onClick={() => { setForgot(true); setForgotMsg({ text: '', type: '' }); }}>Forgot password?</span>
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleForgotPassword}>
            <p className="auth-forgot-hint">Enter your admin email and we'll send you a link to reset your password.</p>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input className="form-input" type="email" placeholder="admin@example.com" required
                value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </div>
            {forgotMsg.text && <div className={`auth-msg ${forgotMsg.type}`}>{forgotMsg.text}</div>}
            <button type="submit" className="btn admin-login-submit-btn btn--full" disabled={forgotBusy}>
              {forgotBusy ? 'Sending…' : 'Send Reset Link'}
            </button>
            <p className="auth-switch"><span onClick={() => setForgot(false)}>← Back to sign in</span></p>
          </form>
        )}

        <p className="admin-login-back"><Link to="/">← Back to Roadmora AI</Link></p>
      </div>
    </div>
  );
}
