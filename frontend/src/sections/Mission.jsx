/* Mission statement section on the homepage. Used on: HomePage. */
export default function Mission() {
  return (
    <section className="mission">
      <div className="container">
        <div className="mission-inner reveal">
          <div className="mission-text">
            <span className="section-eyebrow">Our Mission</span>
            <h2 className="section-title">Guidance that respects<br /><span className="gradient-text">your individuality.</span></h2>
            <p>We believe career guidance should be as unique as the person receiving it. That's why we don't give the same answer to everyone. Roadmora AI reads your complete picture before generating a single recommendation.</p>
            <p style={{ marginTop: '1rem' }}>We also believe in honesty. Roadmora AI does not guarantee employment, does not replace a professional counsellor, and does not pretend to have live market data unless it's connected. What it does deliver: clear thinking, structured output, and a practical starting point.</p>
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
                <p>We tell you what you need to hear, including the gaps and challenges.</p>
              </div>
            </div>
            <div className="value-card">
              <span className="value-icon">🚀</span>
              <div>
                <strong>Action</strong>
                <p>Every result ends with clear next steps — no vague inspiration.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
