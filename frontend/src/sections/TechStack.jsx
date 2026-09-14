export default function TechStack() {
  return (
    <section className="tech">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Technology</span>
          <h2 className="section-title">Built on a <span className="gradient-text">modern stack</span></h2>
        </div>
        <div className="tech-grid">
          <div className="tech-card reveal">
            <div className="tech-icon">🌐</div>
            <h4>Frontend</h4>
            <p>React (Vite) — responsive, accessible, and fast.</p>
          </div>
          <div className="tech-card reveal">
            <div className="tech-icon">🔄</div>
            <h4>Backend</h4>
            <p>Python (FastAPI) handles assessment requests, calls n8n for AI processing, and writes results to the database.</p>
          </div>
          <div className="tech-card reveal">
            <div className="tech-icon">🤖</div>
            <h4>Artificial Intelligence</h4>
            <p>A large language model analyzes your profile and returns structured JSON career guidance.</p>
          </div>
          <div className="tech-card reveal">
            <div className="tech-icon">🗄️</div>
            <h4>Database & Auth</h4>
            <p>Supabase powers user authentication, profile storage, and recommendation history.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
