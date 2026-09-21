/* The 'Roadmora AI vs other tools' comparison table on the homepage. Used on: HomePage. Edit the comparison rows directly below. */
export default function Compare() {
  return (
    <section className="compare">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Why Roadmora AI?</span>
          <h2 className="section-title">Not a chatbot.<br /><span className="gradient-text">A career system.</span></h2>
        </div>
        <div className="compare-grid">
          <div className="compare-col compare-col--bad reveal">
            <div className="compare-col-header">
              <span className="compare-icon">💬</span>
              <h3>General AI Chatbot</h3>
            </div>
            <ul className="compare-list">
              <li className="bad">You must write the right prompt yourself</li>
              <li className="bad">Results vary based on how you phrase things</li>
              <li className="bad">No structured data collection</li>
              <li className="bad">Generic, non-personalized advice</li>
              <li className="bad">No skill-gap analysis</li>
              <li className="bad">No saved history or dashboard</li>
              <li className="bad">No roadmap or project guidance</li>
            </ul>
          </div>
          <div className="compare-col compare-col--good reveal">
            <div className="compare-col-header">
              <span className="compare-icon">◈</span>
              <h3>Roadmora AI</h3>
            </div>
            <ul className="compare-list">
              <li className="good">Structured assessment collects all relevant info</li>
              <li className="good">Consistent, predictable AI output every time</li>
              <li className="good">Analyzes 14+ career dimensions</li>
              <li className="good">Fully personalized to your profile</li>
              <li className="good">Detailed skill-gap breakdown</li>
              <li className="good">Dashboard with saved recommendations</li>
              <li className="good">Step-by-step roadmap + project guidance</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
