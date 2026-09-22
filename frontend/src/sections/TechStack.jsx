/* The homepage stack summary. Keep this aligned with the deployed FastAPI, PyTorch, and Supabase architecture. */
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
            <p>Python (FastAPI) handles assessment requests, runs career predictions, and saves results.</p>
          </div>
          <div className="tech-card reveal">
            <div className="tech-icon">🤖</div>
            <h4>Artificial Intelligence</h4>
            <p>A self-trained PyTorch model estimates career interests, then ranks real O*NET occupations using your skills and preferences.</p>
          </div>
          <div className="tech-card reveal">
            <div className="tech-icon">🗄️</div>
            <h4>Database & Auth</h4>
            <p>Supabase handles user authentication and stores assessment results for the dashboard.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
