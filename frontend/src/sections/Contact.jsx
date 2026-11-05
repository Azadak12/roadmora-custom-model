import { useState } from 'react';
import { CONTACT_EMAIL } from '../lib/site.js';

const FAQS = [
  { q: 'Is Roadmora AI free to use?', a: 'Yes. Roadmora AI is free to use during its current phase as a Final Year Project platform.' },
  { q: 'Do I need an account?', a: 'Yes. You need a free account to take the assessment, so your top result can be saved to your dashboard.' },
  { q: 'Does Roadmora AI use ChatGPT or another chatbot?', a: 'No. Career matches come from a PyTorch model trained by the project team and official O*NET occupation data. No external AI service is called.' },
  { q: 'Are the salaries for my country?', a: 'Wage and growth figures come from the U.S. Bureau of Labor Statistics. Treat them as a general guide and check local sources before deciding.' },
  { q: 'Can I retake the assessment?', a: 'Yes. Retake it as often as you like. The top result from each attempt is saved to your dashboard.' },
  { q: 'Where is my data stored?', a: 'Accounts and saved results are stored in Supabase and are used only to show your results and dashboard.' },
];

const SUBJECTS = ['General Question', 'Assessment Help', 'Technical Issue', 'Feature Request', 'Academic Inquiry'];

const EMPTY_FORM = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const [openFaq, setOpenFaq] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [opened, setOpened] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const subject = `[Roadmora AI] ${form.subject || 'General Question'}`;
    const body = `${form.message}\n\n— ${form.name} (${form.email})`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-form-wrap reveal">
            <h2 className="contact-form-title">Send us a message</h2>
            <p className="contact-form-sub">This opens your email app with your message ready to send.</p>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <input className="form-input" type="text" id="name" placeholder="Your name" required
                    value={form.name} onChange={update('name')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input className="form-input" type="email" id="email" placeholder="you@example.com" required
                    value={form.email} onChange={update('email')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="subject">Subject</label>
                <select className="form-input form-select" id="subject" value={form.subject} onChange={update('subject')}>
                  <option value="">Select a topic</option>
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="message">Message</label>
                <textarea className="form-input form-textarea" id="message" placeholder="Tell us how we can help…" rows="5" required
                  value={form.message} onChange={update('message')}></textarea>
              </div>
              <button type="submit" className="btn contact-submit-btn btn--full">
                Compose Email
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
              <div className={`form-success${opened ? ' visible' : ''}`}>
                Your email app should open now. If it didn't, write to us at {CONTACT_EMAIL}.
              </div>
            </form>
          </div>

          <div className="contact-info reveal">
            <div className="ci-card">
              <div className="ci-icon">📬</div>
              <div>
                <strong>Email</strong>
                <p><a className="ci-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
              </div>
            </div>
            <div className="ci-card">
              <div className="ci-icon">🏫</div>
              <div>
                <strong>Academic Project</strong>
                <p>Roadmora AI is a Final Year Project and academic research platform for career guidance.</p>
              </div>
            </div>
            <div className="ci-card">
              <div className="ci-icon">⏰</div>
              <div>
                <strong>Response Time</strong>
                <p>We aim to reply within 2–3 working days.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="faq-block">
          <div className="section-header">
            <span className="section-eyebrow">FAQ</span>
            <h2 className="section-title">Frequently asked <span className="gradient-text">questions</span></h2>
          </div>
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div className={`faq-item${openFaq === i ? ' is-open' : ''}`} key={faq.q}>
                <button
                  type="button"
                  className={`faq-q${openFaq === i ? ' open' : ''}`}
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <span className="faq-arrow" aria-hidden="true">+</span>
                </button>
                <div className={`faq-a${openFaq === i ? ' open' : ''}`}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
