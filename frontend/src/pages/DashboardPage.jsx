import BrandLogo from '../components/BrandLogo.jsx';
import { uniqueCareerResults } from '../lib/assessmentDedup.js';
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
  const [search, setSearch] = useState('');
  const [jobZone, setJobZone] = useState('');
  const [period, setPeriod] = useState('');
  const [filterTime, setFilterTime] = useState(() => Date.now());
  const [sort, setSort] = useState('newest');

  function clearFilters() {
    setSearch('');
    setJobZone('');
    setPeriod('');
    setSort('newest');
  }

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
  const zones = [...new Set((results || []).map(r => r.market_analysis?.demand).filter(Boolean))].sort();
  const query = search.trim().toLowerCase();
  const cutoff = period ? filterTime - Number(period) * 86400000 : null;
  // Keep original indices so opening a filtered or sorted card shows the correct result.
  const uniqueResults = uniqueCareerResults(results || []);
  const visibleResults = uniqueResults
    .filter(({ result }) => {
      const details = Array.isArray(result.learning_roadmap) ? result.learning_roadmap : Object.values(result.learning_roadmap || {});
      const text = [result.career_field, result.market_analysis?.demand, ...details].join(' ').toLowerCase();
      return (!query || text.includes(query))
        && (!jobZone || result.market_analysis?.demand === jobZone)
        && (cutoff === null || new Date(result.created_at).getTime() >= cutoff);
    })
    .sort((a, b) => {
      if (sort === 'career') return (a.result.career_field || '').localeCompare(b.result.career_field || '');
      const difference = (Date.parse(a.result.created_at) || 0) - (Date.parse(b.result.created_at) || 0);
      return sort === 'oldest' ? difference : -difference;
    });

  return (
    <>
      <header className="topbar" id="topbar">
        <Link to="/" className="topbar__logo">
          <BrandLogo />
        </Link>
        <div className="topbar__right" style={{ display: 'flex' }}>
          <span className="topbar__user"><span className="topbar__avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>{displayName}</span>
          <Link to="/assessment" className="tb-btn db-topbar-new-assessment-btn">+ New Assessment</Link>
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
            <section className="db-hero">
              <div className="db-hero__row">
                <div>
                  <p className="db-hero__eyebrow">My Dashboard</p>
                  <h1 className="db-title">Welcome back, {name}</h1>
                  <p className="db-sub">Your saved career matches, all in one place.</p>
                </div>
                <Link to="/assessment" className="tb-btn db-hero-assessment-btn">Take a New Assessment</Link>
              </div>
              <div className="db-stats">
                <div className="db-stat">
                  <span className="db-stat-label">Assessments</span>
                  <span className="db-stat-val">{results ? results.length : '0'}</span>
                </div>
                <div className="db-stat">
                  <span className="db-stat-label">Latest Career</span>
                  <span className="db-stat-val">{latest ? latest.career_field || '—' : '—'}</span>
                </div>
                <div className="db-stat">
                  <span className="db-stat-label">Last Active</span>
                  <span className="db-stat-val">
                    {latest
                      ? new Date(latest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
              </div>
            </section>

            <div className="db-section">
              <div className="db-section-head">
                <h2 className="db-section-title">Your Career Results</h2>
              </div>

              {results?.length > 0 && (
                <>
                  <div className="db-filters" role="search" aria-label="Search saved career results">
                    <label className="db-filters__search">Search results
                      <input type="search" placeholder="Career name or keyword…" value={search} onChange={e => setSearch(e.target.value)} />
                    </label>
                    <label>Job zone
                      <select value={jobZone} onChange={e => setJobZone(e.target.value)}>
                        <option value="">All job zones</option>
                        {zones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                      </select>
                    </label>
                    <label>Assessment date
                      <select value={period} onChange={e => { setPeriod(e.target.value); setFilterTime(Date.now()); }}>
                        <option value="">All time</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                      </select>
                    </label>
                    <label>Sort by
                      <select value={sort} onChange={e => setSort(e.target.value)}>
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="career">Career name A–Z</option>
                      </select>
                    </label>
                  </div>
                  <div className="db-filter-summary">
                    <p role="status">Showing {visibleResults.length} of {uniqueResults.length} careers · latest assessment for each career</p>
                    {(search || jobZone || period || sort !== 'newest') && <button type="button" className="tb-btn db-topbar-logout-btn" onClick={clearFilters}>Clear filters</button>}
                  </div>
                </>
              )}

              {error ? <div className="db-empty" role="alert">{error}</div> : !results || results.length === 0 ? (
                <div className="db-empty">
                  <div className="db-empty-icon">🗺️</div>
                  <p className="db-empty-title">No assessments yet</p>
                  <p className="db-empty-sub">Complete your first career assessment to see your personalized roadmap here.</p>
                  <Link to="/assessment" className="tb-btn db-empty-state-assessment-btn">Take Assessment →</Link>
                </div>
              ) : visibleResults.length === 0 ? (
                <div className="db-empty">
                  <p className="db-empty-title">No matching results</p>
                  <p className="db-empty-sub">Try another keyword or clear your filters to see all assessments.</p>
                  <button type="button" className="tb-btn db-empty-state-assessment-btn" onClick={clearFilters}>Clear filters</button>
                </div>
              ) : (
                <div className="db-grid">
                  {visibleResults.map(({ result: r, index: i }) => {
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
                            <div className="db-card__date">Assessed {date}</div>
                          </div>
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

                        <button type="button" className="db-card__view" onClick={e => { e.stopPropagation(); setOpenIdx(i); }} aria-label={`View details for ${r.career_field || 'career result'}`}>View Details →</button>
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
