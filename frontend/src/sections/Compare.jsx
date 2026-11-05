const CHATBOT = [
  'Answers depend on how you word your prompt',
  'No structured way to describe your profile',
  'Can invent job titles, salaries, or statistics',
  'Not linked to an official occupation database',
  'Results are not saved to a dashboard',
];

const ROADMORA = [
  'Five-step assessment collects the right details',
  'Self-trained model gives the same result for the same answers',
  'Ranks 923 real O*NET occupations',
  'Wage and growth figures come from the U.S. BLS',
  'Top result saved to your dashboard when signed in',
];

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
              {CHATBOT.map((t) => <li className="bad" key={t}>{t}</li>)}
            </ul>
          </div>
          <div className="compare-col compare-col--good reveal">
            <div className="compare-col-header">
              <span className="compare-icon">◈</span>
              <h3>Roadmora AI</h3>
            </div>
            <ul className="compare-list">
              {ROADMORA.map((t) => <li className="good" key={t}>{t}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
