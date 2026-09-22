/* Admin-only dashboard: user counts, assessment stats, results list. Route: /admin. Access is gated by isAdmin from context/AuthContext.jsx (checks the logged-in email against VITE_ADMIN_EMAILS). */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getAdminStats, getAdminUsers, getAdminResults } from '../lib/api.js';
import RoadmapModal from '../components/RoadmapModal.jsx';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '◈' },
  { key: 'users', label: 'Users', icon: '◍' },
  { key: 'results', label: 'Assessments', icon: '▤' },
];

export default function AdminDashboardPage() {
  const { user, session, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [openIdx, setOpenIdx] = useState(null);

  // Fetch each admin panel together after the restored session passes the UI gate.
  // The API also enforces admin access on every endpoint.
  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin) {
      navigate('/admin/login');
      return;
    }
    Promise.all([getAdminStats(), getAdminUsers(), getAdminResults()])
      .then(([s, u, r]) => {
        setStats(s);
        setUsers(u);
        setResults(r);
      })
      .catch((err) => setError(err.message || 'Failed to load admin data'));
  }, [loading, session, isAdmin, navigate]);

  if (loading || !session || !isAdmin) {
    return (
      <div className="admin-shell-loading">
        <div className="db-spinner"></div>
      </div>
    );
  }

  const ready = stats && users && results;
  const displayName = (user.user_metadata?.full_name || user.email).split(/[@\s]/)[0];

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

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
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
          <button className="admin-sidebar__logout" onClick={() => { signOut(); navigate('/admin/login'); }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {!ready && !error ? (
          <div className="admin-shell-loading">
            <div className="db-spinner"></div>
          </div>
        ) : error ? (
          <div className="db-empty">
            <div className="db-empty-icon">⚠️</div>
            <p className="db-empty-title">Couldn't load admin data</p>
            <p className="db-empty-sub">{error}</p>
          </div>
        ) : (
          <>
            <header className="admin-main__header">
              <h1 className="admin-main__title">
                {NAV_ITEMS.find((i) => i.key === section)?.label}
              </h1>
              <span className="admin-main__badge">Live System Data</span>
            </header>

            {section === 'overview' && (
              <>
                <div className="admin-stat-grid">
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.total_users}</span>
                    <span className="admin-stat-card__label">Registered Users</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.total_assessments}</span>
                    <span className="admin-stat-card__label">Total Assessments</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">
                      {stats.total_users ? (stats.total_assessments / stats.total_users).toFixed(1) : '0'}
                    </span>
                    <span className="admin-stat-card__label">Avg. / User</span>
                  </div>
                </div>

                <div className="admin-panel">
                  <div className="admin-panel__head">
                    <h2>Recent Assessments</h2>
                    <button className="admin-link-btn" onClick={() => setSection('results')}>View all →</button>
                  </div>
                  {results.slice(0, 5).map((r, i) => (
                    <div className="admin-row" key={r.id ?? i} onClick={() => { setSection('results'); setOpenIdx(i); }}>
                      <div>
                        <div className="admin-row__title">{r.career_field || 'Unknown'}</div>
                        <div className="admin-row__sub">{r.user_email}</div>
                      </div>
                      <div className="admin-row__date">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {section === 'users' && (
              users.length === 0 ? (
                <div className="db-empty">
                  <div className="db-empty-icon">👤</div>
                  <p className="db-empty-title">No registered users yet</p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Joined</th>
                        <th>Assessments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.email}</td>
                          <td>{u.full_name || '—'}</td>
                          <td>{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td><span className="admin-pill">{u.assessment_count}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {section === 'results' && (
              results.length === 0 ? (
                <div className="db-empty">
                  <div className="db-empty-icon">🗺️</div>
                  <p className="db-empty-title">No assessments submitted yet</p>
                </div>
              ) : (
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
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => {
                        const ma = r.market_analysis || {};
                        return (
                          <tr key={r.id ?? i} className="admin-table__row-clickable" onClick={() => setOpenIdx(i)}>
                            <td>{r.user_email}</td>
                            <td>{r.career_field || 'Unknown'}</td>
                            <td>{ma.demand || '—'}</td>
                            <td>{ma.salary || '—'}</td>
                            <td>{ma.growth || '—'}</td>
                            <td>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </main>

      <RoadmapModal result={openIdx != null ? results?.[openIdx] : null} onClose={() => setOpenIdx(null)} />
    </div>
  );
}
