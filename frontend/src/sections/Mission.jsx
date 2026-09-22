/* Mission statement section on the homepage. Used on: HomePage. */
export default function Mission() {
  return (
    <section className="mission">
      <div className="container">
        <div className="mission-inner reveal">
          <div className="mission-text">
            <span className="section-eyebrow">Our Mission</span>
            <h2 className="section-title">Guidance that respects<br /><span className="gradient-text">your individuality.</span></h2>
            <p>We believe career guidance should account for the answers a person provides. Roadmora AI compares your interests, skills, experience, and preferences with real occupations and shows the strongest available matches.</p>
            <p style={{ marginTop: '1rem' }}>Roadmora AI does not guarantee employment or replace a professional counsellor. Wage and growth figures come from published U.S. BLS data and may not reflect your local market.</p>
          </div>
          <div className="mission-values">
            <div className="value-card">
              <span className="value-icon">🎯</span>
              <div>
                <strong>Personalization</strong>
                <p>Every recommendation is built from your data, not a template.</p>
              </div>
            </div>
            <div className="value-card">
              <span className="value-icon">🧱</span>
              <div>
                <strong>Structure</strong>
                <p>Consistent, organized outputs — not open-ended chatbot replies.</p>
              </div>
            </div>
            <div className="value-card">
              <span className="value-icon">🤝</span>
              <div>
                <strong>Honesty</strong>
                <p>We show when occupation or market data is unavailable.</p>
              </div>
            </div>
            <div className="value-card">
              <span className="value-icon">🚀</span>
              <div>
                <strong>Action</strong>
                <p>Each match includes available occupation and labor-market information.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
