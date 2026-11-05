/* About Us section on the homepage — plain text/mission blurb. Used on: HomePage. Edit the text directly below; styling comes from styles-site.css. */
export default function AboutSection() {
  return (
    <section className="about-hero" id="about">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">About Roadmora AI</span>
          <h2 className="section-title">Built to solve a<br /><span className="gradient-text">real problem.</span></h2>
          <p className="section-sub">Millions of students graduate every year with skills but no clear direction. Roadmora AI exists to change that.</p>
        </div>

        <div className="about-blocks">
          <div className="about-block reveal">
            <div className="ab-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01" /></svg></div>
            <h3>The Problem</h3>
            <p>Most career guidance online is generic. It doesn't account for who you are — your education, skills, experience, interests, or starting point. Students often don't know which questions to even ask a general chatbot, and end up with advice that doesn't apply to their situation.</p>
          </div>
          <div className="about-block reveal">
            <div className="ab-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z" /></svg></div>
            <h3>Our Solution</h3>
            <p>Roadmora AI collects structured answers, uses a trained PyTorch model to estimate career interests, and ranks real O*NET occupations. Each result includes available occupation details and U.S. labor-market data.</p>
          </div>
          <div className="about-block reveal">
            <div className="ab-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 9 10-5 10 5-10 5ZM6 11v5c3 2 9 2 12 0v-5" /></svg></div>
            <h3>Who We Help</h3>
            <p>University students choosing a specialization. Fresh graduates entering the workforce. Professionals switching fields. Beginners who are ready to learn but don't know where to start. If you're confused about your career, Roadmora AI is for you.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
