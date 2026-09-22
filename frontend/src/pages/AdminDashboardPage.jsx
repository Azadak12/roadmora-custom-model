/* Admin-only dashboard: user counts, assessment stats, results list. Route: /admin. Access is gated by isAdmin from context/AuthContext.jsx (checks the logged-in email against VITE_ADMIN_EMAILS). */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getAdminStats, getAdminUsers, getAdminResults, updateAdminUser, deleteAdminUser, updateAdminResult, deleteAdminResult } from '../lib/api.js';
import RoadmapModal from '../components/RoadmapModal.jsx';
import AdminRecordDialog from '../components/AdminRecordDialog.jsx';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '◈' },
  { key: 'users', label: 'Users', icon: '◍' },
  { key: 'results', label: 'Assessments', icon: '▤' },
];
const PAGE_SIZE = 10;
const time = (value) => new Date(value).getTime() || 0;
const dateText = (value) => value && time(value)
  ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function downloadCsv(filename, headers, rows) {
  const cell = (value) => {
    const raw = String(value ?? '');
    const safe = /^\s*[=+@-]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const csv = [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function Pager({ page, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages === 1) return null;
  return <div className="admin-pager"><span>Page {page} of {pages} · {total} records</span><div>
    <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</button>
    <button type="button" disabled={page === pages} onClick={() => onChange(page + 1)}>Next</button>
  </div></div>;
}

export default function AdminDashboardPage() {
  const { user, session, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [openResult, setOpenResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userQuery, setUserQuery] = useState('');
  const [userSort, setUserSort] = useState('newest');
  const [userPage, setUserPage] = useState(1);
  const [resultQuery, setResultQuery] = useState('');
  const [resultPeriod, setResultPeriod] = useState('all');
  const [resultSort, setResultSort] = useState('newest');
  const [resultPage, setResultPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState('');

  // Fetch each admin panel together after the restored session passes the UI gate.
  // The API also enforces admin access on every endpoint.
  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin) {
      navigate('/admin/login');
      return;
    }
    let active = true;
    Promise.all([getAdminStats(), getAdminUsers(), getAdminResults()])
      .then(([s, u, r]) => {
        if (!active) return;
        setStats(s);
        setUsers(u);
        setResults(r);
        setLastUpdated(new Date());
        setError('');
      })
      .catch((err) => { if (active) setError(err.message || 'Failed to load admin data'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [loading, session, isAdmin, navigate, reloadKey]);

  if (loading || !session || !isAdmin) {
    return (
      <div className="admin-shell-loading">
        <div className="db-spinner"></div>
      </div>
    );
  }

  const ready = stats && users && results;
  const displayName = (user?.user_metadata?.full_name || user?.email || 'Admin').split(/[@\s]/)[0];
  const qUser = userQuery.trim().toLowerCase();
  const filteredUsers = (users || []).filter((u) =>
    `${u.email || ''} ${u.full_name || ''}`.toLowerCase().includes(qUser)
  ).sort((a, b) => userSort === 'active'
    ? (b.assessment_count || 0) - (a.assessment_count || 0)
    : userSort === 'name' ? (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '')
      : (userSort === 'oldest' ? 1 : -1) * (time(a.created_at) - time(b.created_at)));
  const qResult = resultQuery.trim().toLowerCase();
  const asOf = lastUpdated?.getTime() || 0;
  const cutoff = resultPeriod === 'all' ? 0 : asOf - Number(resultPeriod) * 86400000;
  const filteredResults = (results || []).filter((r) => time(r.created_at) >= cutoff &&
    `${r.user_email || ''} ${r.career_field || ''}`.toLowerCase().includes(qResult)
  ).sort((a, b) => resultSort === 'career'
    ? (a.career_field || '').localeCompare(b.career_field || '')
    : (resultSort === 'oldest' ? 1 : -1) * (time(a.created_at) - time(b.created_at)));
  const recent30 = (results || []).filter((r) => time(r.created_at) >= asOf - 30 * 86400000).length;
  const activeUsers = new Set((results || []).map((r) => r.user_id).filter(Boolean)).size;
  const careerCounts = (results || []).reduce((counts, r) => {
    const career = r.career_field || 'Unknown';
    counts[career] = (counts[career] || 0) + 1;
    return counts;
  }, {});
  const topCareers = Object.entries(careerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const visibleUserPage = Math.min(userPage, Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE)));
  const visibleResultPage = Math.min(resultPage, Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE)));
  const refresh = () => { setBusy(true); setReloadKey((key) => key + 1); };
  const openDialog = (kind, record, mode) => { setMutationError(''); setDialog({ kind, record, mode }); };
  const submitDialog = async (payload) => {
    if (!dialog) return;
    setSaving(true);
    setMutationError('');
    try {
      const { kind, record, mode } = dialog;
      if (kind === 'user' && mode === 'edit') {
        const updated = await updateAdminUser(record.id, payload);
        setUsers((current) => current.map((u) => u.id === record.id ? { ...u, ...updated } : u));
        setResults((current) => current.map((r) => r.user_id === record.id ? { ...r, user_email: updated.email } : r));
      } else if (kind === 'user') {
        await deleteAdminUser(record.id);
        setUsers((current) => current.filter((u) => u.id !== record.id));
        setResults((current) => current.filter((r) => r.user_id !== record.id));
        setStats((current) => ({ ...current, total_users: Math.max(0, current.total_users - 1),
          total_assessments: Math.max(0, current.total_assessments - (record.assessment_count || 0)) }));
      } else if (mode === 'edit') {
        const updated = await updateAdminResult(record.id, payload);
        setResults((current) => current.map((r) => r.id === record.id ? { ...r, ...updated } : r));
      } else {
        await deleteAdminResult(record.id);
        setResults((current) => current.filter((r) => r.id !== record.id));
        setUsers((current) => current.map((u) => u.id === record.user_id
          ? { ...u, assessment_count: Math.max(0, u.assessment_count - 1) } : u));
        setStats((current) => ({ ...current, total_assessments: Math.max(0, current.total_assessments - 1) }));
      }
      setOpenResult(null);
      setDialog(null);
      refresh();
    } catch (err) {
      setMutationError(err.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };
  const exportUsers = () => downloadCsv('roadmora-users.csv', ['Email', 'Name', 'Joined', 'Assessments'],
    filteredUsers.map((u) => [u.email, u.full_name, dateText(u.created_at), u.assessment_count]));
  const exportResults = () => downloadCsv('roadmora-assessments.csv',
    ['User', 'Career Match', 'Job Zone', 'U.S. Median Wage', 'U.S. Growth', 'Date'],
    filteredResults.map((r) => [r.user_email, r.career_field, r.market_analysis?.demand,
      r.market_analysis?.salary, r.market_analysis?.growth, dateText(r.created_at)]));

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="logo-icon">◈</span>
          <div>
            <div className="admin-sidebar__brand-name">Roadmora</div>
            <div className="admin-sidebar__brand-tag">SYSTEM ADMIN</div>
          </div>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Admin sections">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-current={section === item.key ? 'page' : undefined}
              className={`admin-sidebar__nav-item${section === item.key ? ' admin-sidebar__nav-item--active' : ''}`}
              onClick={() => setSection(item.key)}
            >
              <span className="admin-sidebar__nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__user-avatar">{displayName.charAt(0).toUpperCase()}</div>
            <div>
              <div className="admin-sidebar__user-name">{displayName}</div>
              <div className="admin-sidebar__user-role">Administrator</div>
            </div>
          </div>
          <button className="admin-sidebar__logout" onClick={async () => { await signOut(); navigate('/admin/login'); }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-main__header">
          <div><p className="admin-eyebrow">ADMIN CONSOLE</p><h1 className="admin-main__title">{NAV_ITEMS.find((i) => i.key === section)?.label}</h1></div>
          <div className="admin-header-actions">
            {lastUpdated && <span className="admin-updated">Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
            <button className="admin-action-btn" type="button" onClick={refresh} disabled={busy}>{busy ? 'Refreshing…' : '↻ Refresh'}</button>
          </div>
        </header>
        {error && ready && <div className="admin-alert" role="alert">{error} Showing previously loaded data.</div>}
        {!ready && !error ? (
          <div className="admin-shell-loading">
            <div className="db-spinner"></div>
          </div>
        ) : !ready && error ? (
          <div className="db-empty">
            <div className="db-empty-icon">⚠️</div>
            <p className="db-empty-title">Couldn't load admin data</p>
            <p className="db-empty-sub">{error}. Try refreshing the dashboard.</p>
          </div>
        ) : (
          <>
            {section === 'overview' && (
              <>
                <div className="admin-stat-grid admin-stat-grid--four">
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.total_users}</span>
                    <span className="admin-stat-card__label">Registered Users</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.total_assessments}</span>
                    <span className="admin-stat-card__label">Total Assessments</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{recent30}</span>
                    <span className="admin-stat-card__label">Assessments in 30 days</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{activeUsers}</span>
                    <span className="admin-stat-card__label">Users with assessments</span>
                  </div>
                </div>
                <div className="admin-overview-grid">
                <section className="admin-panel">
                  <div className="admin-panel__head"><h2>Most recommended careers</h2><span className="admin-panel__hint">In loaded assessments</span></div>
                  {topCareers.map(([career, count]) => (
                    <div className="admin-chart-row" key={career}>
                      <div className="admin-chart-row__label"><span title={career}>{career}</span><strong>{count}</strong></div>
                      <div className="admin-chart-track"><div style={{ width: `${count / topCareers[0][1] * 100}%` }} /></div>
                    </div>
                  ))}
                  {!topCareers.length && <p className="admin-muted">No career matches yet.</p>}
                </section>
                <div className="admin-panel">
                  <div className="admin-panel__head">
                    <h2>Recent Assessments</h2>
                    <button className="admin-link-btn" onClick={() => setSection('results')}>View all →</button>
                  </div>
                  {results.slice(0, 5).map((r, i) => (
                    <button className="admin-row" type="button" key={r.id ?? i} onClick={() => setOpenResult(r)}>
                      <div>
                        <div className="admin-row__title">{r.career_field || 'Unknown'}</div>
                        <div className="admin-row__sub">{r.user_email}</div>
                      </div>
                      <div className="admin-row__date">{dateText(r.created_at)}</div>
                    </button>
                  ))}
                  {!results.length && <p className="admin-muted">No assessments submitted yet.</p>}
                </div>
                </div>
              </>
            )}

            {section === 'users' && <>
              <div className="admin-toolbar">
                <label className="admin-search"><span className="sr-only">Search users</span><input type="search" placeholder="Search name or email" value={userQuery} onChange={(e) => { setUserQuery(e.target.value); setUserPage(1); }} /></label>
                <label className="admin-select">Sort <select value={userSort} onChange={(e) => { setUserSort(e.target.value); setUserPage(1); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="active">Most assessments</option><option value="name">Name A–Z</option></select></label>
                <button className="admin-action-btn" type="button" disabled={!filteredUsers.length} onClick={exportUsers}>Export CSV</button>
              </div>
              <p className="admin-results-count">Showing {filteredUsers.length} of {users.length} loaded users</p>
              {filteredUsers.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Joined</th>
                        <th>Assessments</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice((visibleUserPage - 1) * PAGE_SIZE, visibleUserPage * PAGE_SIZE).map((u) => (
                        <tr key={u.id}>
                          <td>{u.email}</td>
                          <td>{u.full_name || '—'}</td>
                          <td>{dateText(u.created_at)}</td>
                          <td><span className="admin-pill">{u.assessment_count}</span></td>
                          <td><div className="admin-row-actions">
                            <button type="button" onClick={() => openDialog('user', u, 'edit')}>Edit</button>
                            <button type="button" className="admin-row-actions__delete" disabled={u.is_admin} title={u.is_admin ? 'Admin accounts are protected' : `Delete ${u.email}`} onClick={() => openDialog('user', u, 'delete')}>Delete</button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="admin-empty-filter">{users.length ? 'No users match your search.' : 'No registered users yet.'}</div>}
              <Pager page={visibleUserPage} total={filteredUsers.length} onChange={setUserPage} />
            </>}

            {section === 'results' && <>
              <div className="admin-toolbar">
                <label className="admin-search"><span className="sr-only">Search assessments</span><input type="search" placeholder="Search user or career" value={resultQuery} onChange={(e) => { setResultQuery(e.target.value); setResultPage(1); }} /></label>
                <label className="admin-select">Period <select value={resultPeriod} onChange={(e) => { setResultPeriod(e.target.value); setResultPage(1); }}><option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label>
                <label className="admin-select">Sort <select value={resultSort} onChange={(e) => { setResultSort(e.target.value); setResultPage(1); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="career">Career A–Z</option></select></label>
                <button className="admin-action-btn" type="button" disabled={!filteredResults.length} onClick={exportResults}>Export CSV</button>
              </div>
              <p className="admin-results-count">Showing {filteredResults.length} of {results.length} loaded assessments</p>
              {filteredResults.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Career Match</th>
                        <th>Job Zone</th>
                        <th>U.S. Median Wage</th>
                        <th>U.S. Growth</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.slice((visibleResultPage - 1) * PAGE_SIZE, visibleResultPage * PAGE_SIZE).map((r, i) => {
                        const ma = r.market_analysis || {};
                        return (
                          <tr key={r.id ?? i} className="admin-table__row-clickable" tabIndex={0} onClick={() => setOpenResult(r)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpenResult(r); } }}>
                            <td>{r.user_email}</td>
                            <td>{r.career_field || 'Unknown'}</td>
                            <td>{ma.demand || '—'}</td>
                            <td>{ma.salary || '—'}</td>
                            <td>{ma.growth || '—'}</td>
                            <td>{dateText(r.created_at)}</td>
                            <td onClick={(e) => e.stopPropagation()}><div className="admin-row-actions">
                              <button type="button" onClick={() => openDialog('result', r, 'edit')}>Edit</button>
                              <button type="button" className="admin-row-actions__delete" onClick={() => openDialog('result', r, 'delete')}>Delete</button>
                            </div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <div className="admin-empty-filter">{results.length ? 'No assessments match these filters.' : 'No assessments submitted yet.'}</div>}
              <Pager page={visibleResultPage} total={filteredResults.length} onChange={setResultPage} />
            </>}
          </>
        )}
      </main>

      <RoadmapModal result={openResult} onClose={() => setOpenResult(null)} />
      {dialog && <AdminRecordDialog key={`${dialog.kind}-${dialog.record.id}-${dialog.mode}`} target={dialog} mode={dialog.mode}
        saving={saving} error={mutationError} onClose={() => setDialog(null)} onSubmit={submitDialog} />}
    </div>
  );
}
