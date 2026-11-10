import BrandLogo from '../components/BrandLogo.jsx';
/* Landing page for the password-reset email link. Route: /reset-password.
   Supabase parses the recovery token from the URL on load and starts a
   temporary session, which lets the user set a new password here. */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import PasswordInput from '../components/PasswordInput.jsx';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // The recovery link only grants a session once Supabase has parsed the URL.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMsg({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setBusy(true);
    setMsg({ text: '', type: '' });
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setMsg({ text: error.message, type: 'error' });
    } else {
      setDone(true);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="auth-brand">
          <BrandLogo />
        </div>
        <p className="admin-login-eyebrow">Reset Password</p>

        {done ? (
          <>
            <div className="auth-msg success">✓ Your password has been updated.</div>
            <button
              type="button"
              className="btn authmodal-login-btn btn--full"
              onClick={() => navigate('/dashboard')}
            >
              Continue to Dashboard
            </button>
          </>
        ) : !ready ? (
          <p className="auth-forgot-hint">Verifying your reset link…</p>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <PasswordInput placeholder="Min 6 characters" required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <PasswordInput placeholder="Re-enter password" required minLength={6}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            {msg.text && <div className={`auth-msg ${msg.type}`}>{msg.text}</div>}
            <button type="submit" className="btn authmodal-login-btn btn--full" disabled={busy}>
              {busy ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}

        <p className="admin-login-back"><Link to="/">← Back to Roadmora AI</Link></p>
      </div>
    </div>
  );
}
