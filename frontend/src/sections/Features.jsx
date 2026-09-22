/* The features list/grid section on the homepage. Used on: HomePage. */
export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Platform Features</span>
          <h2 className="section-title">Explore career paths with<br /><span className="gradient-text">real occupation data</span></h2>
        </div>

        <div className="features-grid">
          <div className="feature-card feature-card--large reveal">
            <div className="fc-icon">🧠</div>
            <h3 className="fc-title">Ranked Career Matches</h3>
            <p className="fc-desc">A trained model estimates your career interests. Your selected skills, interests, experience, and industries help rank real O*NET occupations.</p>
            <ul className="fc-list">
              <li>Up to three occupation matches</li>
              <li>A match score for each result</li>
              <li>Results based on the answers you provide</li>
            </ul>
          </div>

          <div className="feature-card reveal">
            <div className="fc-icon">📋</div>
            <h3 className="fc-title">Structured Assessment</h3>
            <p className="fc-desc">Enter your education, current skills, work experience, career interests, and preferred industries in one five-step form.</p>
          </div>

          <div className="feature-card reveal">
            <div className="fc-icon">🗂️</div>
            <h3 className="fc-title">Occupation Details</h3>
            <p className="fc-desc">See available O*NET education, experience, training, and core-task information for each match.</p>
          </div>

          <div className="feature-card reveal">
            <div className="fc-icon">📊</div>
            <h3 className="fc-title">U.S. Market Data</h3>
            <p className="fc-desc">View available BLS median annual wage and projected employment growth for matched occupations.</p>
          </div>

          <div className="feature-card reveal">
            <div className="fc-icon">📁</div>
            <h3 className="fc-title">Saved Results</h3>
            <p className="fc-desc">Sign in to save the top result from each assessment and revisit it from your dashboard.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
