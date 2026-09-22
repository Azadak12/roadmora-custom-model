/* Popup that shows one saved result's full learning roadmap in detail. Used on: pages/DashboardPage.jsx, when a user clicks into a past result. */
import { Link } from 'react-router-dom';

export default function RoadmapModal({ result, onClose }) {
  if (!result) return null;

  const ma = result.market_analysis || {};
  // Saved roadmaps may be arrays or objects, depending on when they were created.
  const roadmap = Array.isArray(result.learning_roadmap)
    ? result.learning_roadmap
    : Object.values(result.learning_roadmap || {});

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="rm-overlay open" onClick={handleOverlayClick}>
      <div className="rm-modal">
        <button className="rm-close" onClick={onClose}>×</button>
        <div className="rm-header">
          <p className="rm-eyebrow">AI Recommendation</p>
          <h2 className="rm-career">{result.career_field || '—'}</h2>
        </div>
        <div className="rm-body">
          <div className="rm-market">
            <div className="rm-market-item">
              <span className="rm-market-label">O*NET Job Zone</span>
              <span className="rm-market-val">{ma.demand || '—'}</span>
            </div>
            <div className="rm-market-item">
              <span className="rm-market-label">U.S. Median Annual Wage</span>
              <span className="rm-market-val">{ma.salary || '—'}</span>
            </div>
            <div className="rm-market-item">
              <span className="rm-market-label">U.S. Projected Growth</span>
              <span className="rm-market-val">{ma.growth || '—'}</span>
            </div>
          </div>
          <h3 className="rm-roadmap-title">Occupation Details</h3>
          <ol className="rm-roadmap-list">
            {roadmap.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
        <div className="rm-footer">
          <Link to="/#assessment" className="tb-btn db-modal-new-assessment-btn">← Take New Assessment</Link>
        </div>
      </div>
    </div>
  );
}
