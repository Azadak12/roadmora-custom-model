/* The '5-step career assessment' section on the homepage. Handles: gating (must be logged in), submitting the form to the backend via postAssessment(), and showing ResultsSection once a response comes back. The actual form fields live in components/AssessmentForm.jsx, not here. */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuthModal } from '../context/AuthModalContext.jsx';
import { postAssessment } from '../lib/api.js';
import AssessmentForm from '../components/AssessmentForm.jsx';
import ResultsSection from '../components/ResultsSection.jsx';

export default function AssessmentSection() {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  // Submit the full form and show ranked matches below it when the API responds.
  async function handleSubmit(formData) {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const data = await postAssessment(formData);
      setResult(data);
      // Wait for React to render ResultsSection before calculating its screen position.
      setTimeout(() => {
        const el = document.getElementById('results');
        const nav = document.getElementById('nav');
        if (el) {
          const navH = nav ? nav.offsetHeight : 0;
          const top = el.getBoundingClientRect().top + window.scrollY - navH - 24;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Hide the result and bring the user back to the assessment section.
  function handleRetake() {
    setResult(null);
    const el = document.getElementById('assessment');
    const nav = document.getElementById('nav');
    if (el) {
      const navH = nav ? nav.offsetHeight : 0;
      const top = el.getBoundingClientRect().top + window.scrollY - navH - 24;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  return (
    <>
      <section className="assessment" id="assessment">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Career Assessment</span>
            <h2 className="section-title">Tell us about <span className="gradient-text">yourself</span></h2>
            <p className="section-sub">Answer honestly so the occupation matches reflect your skills and interests.</p>
          </div>

          {!user ? (
            <div className="assess-gate">
              <div className="assess-gate-icon">🔒</div>
              <h3 className="assess-gate-title">Sign in to take the assessment</h3>
              <p className="assess-gate-sub">Create a free account or log in to see career matches. Your top result from each assessment is saved to your dashboard.</p>
              <div className="assess-gate-btns">
                <button className="btn assess-gate-signup-btn btn--lg" onClick={() => openAuth('signup')}>Create Free Account</button>
                <button className="btn assess-gate-login-btn btn--lg" onClick={() => openAuth('login')}>Log In</button>
              </div>
            </div>
          ) : (
            <AssessmentForm onSubmit={handleSubmit} submitting={submitting} errorMsg={errorMsg} />
          )}
        </div>
      </section>

      <ResultsSection result={result} onRetake={handleRetake} />
    </>
  );
}
