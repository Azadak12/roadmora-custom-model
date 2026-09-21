/* The features list/grid section on the homepage. Used on: HomePage. */
export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Platform Features</span>
          <h2 className="section-title">Everything you need to<br /><span className="gradient-text">launch your career</span></h2>
        </div>

        <div className="features-grid">
          <div className="feature-card feature-card--large reveal">
            <div className="fc-icon">🧠</div>
            <h3 className="fc-title">AI Career Recommendation</h3>
            <p className="fc-desc">Our AI doesn't just name a career. It explains precisely why the recommendation fits your unique profile — your education, skills, experience, and interests.</p>
            <ul className="fc-list">
              <li>Primary career with match score</li>
              <li>Detailed fit explanation</li>
              <li>Alternative career options</li>
              <li>Possible challenges flagged</li>
            </ul>
          </div>

          <div className="feature-card reveal">
            <div className="fc-icon">🔍</div>
            <h3 className="fc-title">Skill-Gap Analysis</h3>
            <p className="fc-desc">Know exactly which skills you have, which you're missing, and which to prioritize first.</p>
          </div>

          <div className="feature-card reveal">
            <div className="fc-icon">🗺️</div>
            <h3 className="fc-title">Learning Roadmap</h3>
            <p className="fc-desc">Stage-by-stage plan: Foundation → Beginner → Intermediate → Advanced → Job Ready, with durations and tools.</p>
          </div>

          <div className="feature-card reveal">
            <div className="fc-icon">📊</div>
            <h3 className="fc-title">Market Insights</h3>
            <p className="fc-desc">Understand demand, job titles, industries hiring, remote opportunities, and career growth potential.</p>
          </div>

          <div className="feature-card reveal">
            <div className="fc-icon">📄</div>
            <h3 className="fc-title">Resume Builder</h3>
            <p className="fc-desc">Generate career-aligned resumes with AI-suggested summaries, skill ordering, and project descriptions.</p>
          </div>

          <div className="feature-card reveal">
            <div className="fc-icon">📁</div>
            <h3 className="fc-title">Personal Dashboard</h3>
            <p className="fc-desc">Save your results, track your progress, and revisit your roadmap anytime from your account.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
