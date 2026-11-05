import { useState } from 'react';

const FAQS = [
  { q: 'Is Roadmora AI free to use?', a: 'Yes. Roadmora AI is free during its current phase as a Final Year Project platform.' },
  { q: 'How long does the assessment take?', a: 'The career assessment typically takes 8–12 minutes to complete thoroughly.' },
  { q: 'Can I retake the assessment?', a: 'Yes. Logged-in users can retake the assessment and view all previous results from their dashboard.' },
  { q: 'Is my data stored securely?', a: 'All data is stored using Supabase, which provides secure, authenticated database access. Your information is not shared with third parties.' },
];

export default function Contact() {
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ fname: '', lname: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setForm({ fname: '', lname: '', email: '', subject: '', message: '' });
      setSending(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }, 1200);
  }

  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Get in Touch</span>
          <h2 className="section-title">We're here to<br /><span className="gradient-text">help you.</span></h2>
          <p className="section-sub">Have a question, feedback, or want to know more about Roadmora AI? Reach out — we'd love to hear from you.</p>
        </div>

        <div className="contact-grid">
          <div className="contact-form-wrap reveal">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="fname">First Name</label>
                  <input className="form-input" type="text" id="fname" placeholder="Ali" required
                    value={form.fname} onChange={(e) => setForm({ ...form, fname: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lname">Last Name</label>
                  <input className="form-input" type="text" id="lname" placeholder="Raza" required
                    value={form.lname} onChange={(e) => setForm({ ...form, lname: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input className="form-input" type="email" id="email" placeholder="you@example.com" required
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="subject">Subject</label>
                <select className="form-input form-select" id="subject"
                  value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Select a topic</option>
                  <option>General Question</option>
                  <option>Assessment Help</option>
                  <option>Technical Issue</option>
                  <option>Feature Request</option>
                  <option>Partnership</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="message">Message</label>
                <textarea className="form-input form-textarea" id="message" placeholder="Tell us how we can help…" rows="5" required
                  value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}></textarea>
              </div>
              <button type="submit" className="btn btn--primary btn--full" disabled={sending}>
                {sending ? 'Sending…' : 'Send Message'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
              <div className={`form-success${showSuccess ? ' visible' : ''}`}>
                ✓ Message sent! We'll get back to you within 24 hours.
              </div>
            </form>
          </div>

          <div className="contact-info reveal">
            <div className="ci-card">
              <div className="ci-icon">📬</div>
              <div>
                <strong>Email</strong>
                <p>hello@roadmora.ai</p>
              </div>
            </div>
            <div className="ci-card">
              <div className="ci-icon">🏫</div>
              <div>
                <strong>Academic Project</strong>
                <p>Roadmora AI is a Final Year Project developed as an academic research platform for AI-powered career guidance.</p>
              </div>
            </div>
            <div className="ci-card">
              <div className="ci-icon">⏰</div>
              <div>
                <strong>Response Time</strong>
                <p>We aim to respond to all messages within 24–48 hours during working days.</p>
              </div>
            </div>
            <div className="ci-faq">
              <h4 className="ci-faq-title">Common Questions</h4>
              {FAQS.map((faq, i) => (
                <div className="faq-item" key={faq.q}>
                  <div className={`faq-q${openFaq === i ? ' open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {faq.q}
                    <span className="faq-arrow">▾</span>
                  </div>
                  <div className={`faq-a${openFaq === i ? ' open' : ''}`}>{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
