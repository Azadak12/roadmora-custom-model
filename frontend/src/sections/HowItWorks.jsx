const STEPS = [
  { num: '01', icon: '📋', title: 'Complete the Assessment', desc: 'Answer structured questions about your education, skills, interests, personality, work preferences, and career goals.' },
  { num: '02', icon: '⚙️', title: 'AI Analyzes Your Profile', desc: 'Your data is sent securely to our AI engine via n8n. The model evaluates your complete profile against career requirements.' },
  { num: '03', icon: '🎯', title: 'Get Your Career Match', desc: 'Receive a primary career recommendation with match score, skill-gap analysis, alternative paths, and a market outlook.' },
  { num: '04', icon: '🗺️', title: 'Follow Your Roadmap', desc: "Get a step-by-step learning plan, recommended projects, job roles to target, and resume improvement tips — all personalized to you." },
];

export default function HowItWorks() {
  return (
    <section className="how" id="how">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Process</span>
          <h2 className="section-title">From confusion to clarity <br /><span className="gradient-text">in four steps</span></h2>
          <p className="section-sub">Roadmora AI follows a structured workflow — no vague advice, no generic chatbot responses.</p>
        </div>

        <div className="process-track">
          <div className="process-line"></div>
          <div className="process-steps">
            {STEPS.map((step) => (
              <div className="process-step reveal" key={step.num}>
                <div className="ps-number">{step.num}</div>
                <div className="ps-icon">{step.icon}</div>
                <h3 className="ps-title">{step.title}</h3>
                <p className="ps-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
