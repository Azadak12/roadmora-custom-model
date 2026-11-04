import { useEffect, useState } from 'react';

export default function AdminRecordDialog({ target, mode, saving, error, onClose, onSubmit }) {
  const { kind, record } = target;
  const isUser = kind === 'user';
  const market = record.market_analysis || {};
  const roadmap = Array.isArray(record.learning_roadmap)
    ? record.learning_roadmap : Object.values(record.learning_roadmap || {});
  const [form, setForm] = useState(isUser
    ? { email: record.email || '', full_name: record.full_name || '', password: '' }
    : { career_field: record.career_field || '', demand: market.demand || '',
      salary: market.salary || '', growth: market.growth || '', roadmap: roadmap.join('\n') });
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saving, onClose]);
  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (mode === 'delete') return onSubmit();
    if (isUser) return onSubmit({ email: form.email.trim(), full_name: form.full_name.trim(), ...(mode === 'create' ? { password: form.password } : {}) });
    return onSubmit({ career_field: form.career_field.trim(), demand: form.demand.trim(),
      salary: form.salary.trim(), growth: form.growth.trim(),
      learning_roadmap: form.roadmap.split('\n').map((step) => step.trim()).filter(Boolean) });
  };

  return <div className="admin-dialog-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
      <form onSubmit={submit}>
        <div className="admin-dialog__head">
          <div><p className="admin-eyebrow">{isUser ? 'USER ACCOUNT' : 'SAVED ASSESSMENT'}</p>
            <h2 id="admin-dialog-title">{mode === 'delete' ? `Delete ${isUser ? 'user' : 'assessment'}?` : mode === 'create' ? 'Add user' : `Edit ${isUser ? 'user' : 'assessment'}`}</h2></div>
          <button className="admin-dialog__close" type="button" aria-label="Close" onClick={onClose} disabled={saving}>×</button>
        </div>
        {mode === 'delete' ? <p className="admin-dialog__warning">
          {isUser ? <>Permanently delete <strong>{record.email}</strong> and their {record.assessment_count || 0} saved assessment(s)?</>
            : <>Permanently delete the <strong>{record.career_field || 'Unknown'}</strong> assessment for {record.user_email}?</>}
          {' '}This action cannot be undone.
        </p> : <div className="admin-dialog__fields">
          {isUser ? <>
            <label>Full name<input autoFocus type="text" maxLength={120} value={form.full_name} onChange={setField('full_name')} /></label>
            <label>Email<input type="email" maxLength={254} required disabled={record.is_admin} value={form.email} onChange={setField('email')} /></label>
            {mode === 'create' && <>
              <label>Password<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={form.password} onChange={setField('password')} /></label>
              <p className="admin-muted">Use at least 8 characters. This account can sign in immediately. Verify the email belongs to the user before creating the account. No email is sent.</p>
            </>}
            {record.is_admin && <p className="admin-muted">Admin email is protected because it controls admin access.</p>}
          </> : <>
            <label>Career match<input autoFocus type="text" maxLength={200} required value={form.career_field} onChange={setField('career_field')} /></label>
            <div className="admin-dialog__field-grid">
              <label>Job zone<input type="text" maxLength={120} value={form.demand} onChange={setField('demand')} /></label>
              <label>U.S. median wage<input type="text" maxLength={120} value={form.salary} onChange={setField('salary')} /></label>
            </div>
            <label>U.S. growth<input type="text" maxLength={120} value={form.growth} onChange={setField('growth')} /></label>
            <label>Roadmap steps <span className="admin-muted">(one per line)</span>
              <textarea rows={6} value={form.roadmap} onChange={setField('roadmap')} /></label>
          </>}
        </div>}
        {error && <p className="admin-dialog__error" role="alert">{error}</p>}
        <div className="admin-dialog__actions">
          <button className="admin-action-btn" type="button" autoFocus={mode === 'delete'} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={`admin-action-btn ${mode === 'delete' ? 'admin-action-btn--danger' : 'admin-action-btn--primary'}`} type="submit" disabled={saving}>
            {saving ? 'Working…' : mode === 'delete' ? 'Delete permanently' : mode === 'create' ? 'Create user' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  </div>;
}
