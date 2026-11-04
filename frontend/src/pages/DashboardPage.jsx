/* Logged-in user's dashboard: lists their saved past assessment results, opens RoadmapModal for details. Route: /dashboard. */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getResults } from '../lib/api.js';
import RoadmapModal from '../components/RoadmapModal.jsx';

function compactMarketValue(value) {
  if (!value) return '—';
  if (/^not yet available/i.test(value)) return 'Not available';
  return value;
}

export default function DashboardPage() {
  const { user, session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [openIdx, setOpenIdx] = useState(null);

  // Wait for session restoration before redirecting or loading private results.
  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate('/');
      return;
    }
    getResults()
      .then(setResults)
      .catch((err) => setError(err.message || 'Failed to load results'));
  }, [loading, session, navigate]);

  // Escape closes the full-roadmap dialog from anywhere on the dashboard.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpenIdx(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  if (loading || !session) {
    return (
      <div className="db-loading">
        <div className="db-spinner"></div>
        <p>Loading…</p>
      </div>
    );
  }

  const displayName = (user.user_metadata?.full_name || user.email).split(/[@\s]/)[0];
  const name = user.user_metadata?.full_name?.split(' ')[0] || displayName;

  // The backend sorts newest first, so index zero drives the summary cards.
  const latest = results && results.length > 0 ? results[0] : null;

  return (
    <>
      <header className="topbar" id="topbar">
        <Link to="/" className="topbar__logo">
          <span className="logo-icon">◈</span> Roadmora<span className="logo-accent">AI</span>
        </Link>
        <div className="topbar__right" style={{ display: 'flex' }}>
          <span className="topbar__user">{displayName}</span>
          <Link to="/#assessment" className="tb-btn db-topbar-new-assessment-btn">+ New Assessment</Link>
          <button className="tb-btn db-topbar-logout-btn" onClick={() => { signOut(); navigate('/'); }}>Logout</button>
        </div>
      </header>

      <main className="db-main">
        {results === null && !error ? (
          <div className="db-loading">
            <div className="db-spinner"></div>
            <p>Loading…</p>
          </div>
        ) : (
          <div>
            <div className="db-header">
              <div>
                <h1 className="db-title">My Dashboard</h1>
                <p className="db-sub">Welcome back, <strong>{name}</strong></p>
              </div>
            </div>

            <div className="db-stats">
              <div className="db-stat">
                <span className="db-stat-val">{results ? results.length : '0'}</span>
                <span className="db-stat-label">Assessments</span>
              </div>
              <div className="db-stat">
                <span className="db-stat-val">{latest ? latest.career_field || '—' : '—'}</span>
                <span className="db-stat-label">Latest Career</span>
              </div>
              <div className="db-stat">
                <span className="db-stat-val">
                  {latest
                    ? new Date(latest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </span>
                <span className="db-stat-label">Last Active</span>
              </div>
            </div>

            <div className="db-section">
              <div className="db-section-head">
                <h2 className="db-section-title">Your Career Results</h2>
              </div>

              {!results || results.length === 0 ? (
                <div className="db-empty">
                  <div className="db-empty-icon">🗺️</div>
                  <p className="db-empty-title">No assessments yet</p>
                  <p className="db-empty-sub">Complete your first career assessment to see your personalized roadmap here.</p>
                  <Link to="/#assessment" className="tb-btn db-empty-state-assessment-btn">Take Assessment →</Link>
                </div>
              ) : (
                <div className="db-grid">
                  {results.map((r, i) => {
                    const date = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const ma = r.market_analysis || {};
                    // Normalize older object-shaped roadmaps before showing a short preview.
                    const roadmap = Array.isArray(r.learning_roadmap) ? r.learning_roadmap : Object.values(r.learning_roadmap || {});
                    const preview = roadmap.slice(0, 3);
                    const extra = roadmap.length - 3;

                    return (
                      <div className="db-card" key={r.id ?? i} onClick={() => setOpenIdx(i)}>
                        <div className="db-card__head">
                          <div>
                            <div className="db-card__career">{r.career_field || 'Unknown'}</div>
                            <div className="db-card__date">{date}</div>
                          </div>
                          {ma.demand && <span className="db-card__badge">{ma.demand}</span>}
                        </div>

                        <div className="db-card__stats">
                          <div className="db-card__stat">
                            <span className="db-card__stat-label">Job Zone</span>
                            <span className="db-card__stat-val">{ma.demand || '—'}</span>
                          </div>
                          <div className="db-card__stat">
                            <span className="db-card__stat-label">U.S. Median Wage</span>
                              <span className="db-card__stat-val">{compactMarketValue(ma.salary)}</span>
                          </div>
                          <div className="db-card__stat">
                            <span className="db-card__stat-label">U.S. Growth</span>
                              <span className="db-card__stat-val">{compactMarketValue(ma.growth)}</span>
                          </div>
                        </div>

                        {preview.length > 0 && (
                          <div className="db-card__preview">
                            <div className="db-card__preview-label">Occupation Details</div>
                            <div className="db-card__steps">
                              {preview.map((step, si) => (
                                <div className="db-card__step" key={si}>
                                  <span className="db-card__step-num">{si + 1}</span>
                                  <span className="db-card__step-text">{step}</span>
                                </div>
                              ))}
                              {extra > 0 && <div className="db-card__more">+{extra} more steps →</div>}
                            </div>
                          </div>
                        )}

                        <div className="db-card__view">View Details →</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <RoadmapModal result={openIdx != null ? results[openIdx] : null} onClose={() => setOpenIdx(null)} />
    </>
  );
}
