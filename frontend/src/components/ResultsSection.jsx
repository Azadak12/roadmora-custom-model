/* Renders the ranked career-match cards after a user submits the assessment (title, % match, expandable market analysis + roadmap). Used inside: sections/AssessmentSection.jsx, fed by the response from POST /api/assessment. */
import { useState } from 'react';

function MatchCard({ match, expanded, onToggle }) {
  const ma = match.market_analysis || {};
  // Accept both the current array roadmap and older object-shaped saved data.
  const roadmap = Array.isArray(match.learning_roadmap)
    ? match.learning_roadmap
    : Object.values(match.learning_roadmap || {});

  return (
    <div className={`res-match-card${expanded ? ' res-match-card--expanded' : ''}`}>
      <button className="res-match-header" onClick={onToggle}>
        <div>
          <span className="res-match-title">{match.career_field}</span>
          {typeof match.similarity === 'number' && (
            <span className={`res-match-score${match.strong_match === false ? ' res-match-score--weak' : ''}`}>
              {Math.round(match.similarity * 100)}% match
            </span>
          )}
          {match.strong_match === false && (
            <span className="res-match-weak-label">Closest available fit — below our usual 75% match bar</span>
          )}
        </div>
        <span className="res-match-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="res-match-body">
          <div className="res-block">
            <h3 className="res-block-title">📊 Market Analysis</h3>
            <div className="res-market-grid">
              <div className="res-market-item">
                <span className="res-market-label">Demand</span>
                <span className="res-market-val">{ma.demand || '—'}</span>
              </div>
              <div className="res-market-item">
                <span className="res-market-label">Avg. Salary</span>
                <span className="res-market-val">{ma.salary || '—'}</span>
              </div>
              <div className="res-market-item">
                <span className="res-market-label">Growth Outlook</span>
                <span className="res-market-val">{ma.growth || '—'}</span>
              </div>
            </div>
          </div>

          <div className="res-block">
            <h3 className="res-block-title">🗺️ Roadmap</h3>
            <ol className="res-roadmap-list">
              {roadmap.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultsSection({ result, onRetake }) {
  const [expandedIdx, setExpandedIdx] = useState(0);

  if (!result) return null;

  // Older single-match responses remain renderable alongside top_matches.
  const matches = Array.isArray(result.top_matches) ? result.top_matches : [result];

  return (
    <section className="results-section" id="results">
      <div className="container">
        <div className="results-card">
          <div className="res-career-header">
            <span className="section-eyebrow">AI Recommendation</span>
            <h2 className="res-career-title">Your top career matches</h2>
            <p className="res-career-sub">
              Ranked by fit to your interests and skills — explore each to see its roadmap.
            </p>
          </div>

          <div className="res-match-list">
            {matches.map((match, i) => (
              <MatchCard
                key={i}
                match={match}
                expanded={expandedIdx === i}
                onToggle={() => setExpandedIdx(expandedIdx === i ? -1 : i)}
              />
            ))}
          </div>

          <div className="res-actions">
            <button className="btn results-retake-btn" onClick={onRetake}>← Retake Assessment</button>
          </div>
        </div>
      </div>
    </section>
  );
}
