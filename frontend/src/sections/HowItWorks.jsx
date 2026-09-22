/* The homepage's four-step explainer. Edit STEPS to change the displayed process. */
const STEPS = [
  { num: '01', icon: '📋', title: 'Complete the Assessment', desc: 'Answer structured questions about your education, skills, experience, interests, and preferred industries.' },
  { num: '02', icon: '⚙️', title: 'AI Analyzes Your Profile', desc: 'Our PyTorch model estimates your career interests, then compares your profile with real O*NET occupations.' },
  { num: '03', icon: '🎯', title: 'Get Your Career Matches', desc: 'Explore ranked occupations with match scores, salary data, and growth outlooks.' },
  { num: '04', icon: '📋', title: 'Review Occupation Details', desc: 'Read available education, experience, training, and core-task information for each match.' },
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
