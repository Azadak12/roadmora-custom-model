/* Trust boxes + audience strip under the homepage hero. Used on: HomePage. */
const TRUST = [
  { title: '923 Occupations', sub: 'From O*NET 31.0' },
  { title: 'Self-Trained Model', sub: 'PyTorch, no chatbot API' },
  { title: 'Official U.S. Data', sub: 'O*NET + Bureau of Labor Statistics' },
];

export default function SocialProof() {
  return (
    <section className="social-proof">
      <div className="container">
        <div className="trust-boxes">
          {TRUST.map((t) => (
            <div className="trust-box" key={t.title}>
              <strong>{t.title}</strong>
              <span>{t.sub}</span>
            </div>
          ))}
        </div>
        <p className="sp-label">Designed for people who are ready to move forward</p>
        <div className="sp-tags">
          <span className="sp-tag">University Students</span>
          <span className="sp-tag">Fresh Graduates</span>
          <span className="sp-tag">Career Changers</span>
          <span className="sp-tag">Beginners in Tech</span>
          <span className="sp-tag">Freelancers</span>
          <span className="sp-tag">Aspiring Entrepreneurs</span>
        </div>
      </div>
    </section>
  );
}
