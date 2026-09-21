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
            <div className="ab-icon">❓</div>
            <h3>The Problem</h3>
            <p>Most career guidance online is generic. It doesn't account for who you are — your education, skills, experience, interests, or starting point. Students often don't know which questions to even ask a general chatbot, and end up with advice that doesn't apply to their situation.</p>
          </div>
          <div className="about-block reveal">
            <div className="ab-icon">💡</div>
            <h3>Our Solution</h3>
            <p>Roadmora AI uses a structured assessment to gather all the right information — then passes it to an AI model with a controlled, career-focused prompt. The result is consistent, personalized, and actionable guidance that works for beginners and experienced learners alike.</p>
          </div>
          <div className="about-block reveal">
            <div className="ab-icon">🎓</div>
            <h3>Who We Help</h3>
            <p>University students choosing a specialization. Fresh graduates entering the workforce. Professionals switching fields. Beginners who are ready to learn but don't know where to start. If you're confused about your career, Roadmora AI is for you.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
