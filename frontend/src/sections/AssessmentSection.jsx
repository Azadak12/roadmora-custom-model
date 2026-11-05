/* The '5-step career assessment' section on the homepage. Handles: gating (must be logged in), submitting the form to the backend via postAssessment(), and showing ResultsSection once a response comes back. The actual form fields live in components/AssessmentForm.jsx, not here. */
import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuthModal } from '../context/AuthModalContext.jsx';
import { postAssessment } from '../lib/api.js';
import AssessmentForm from '../components/AssessmentForm.jsx';
import ResultsSection from '../components/ResultsSection.jsx';
import { assessmentFingerprint } from '../lib/assessmentDedup.js';

export default function AssessmentSection() {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);
  const submissionLocked = useRef(false);
  const completed = useRef(new Map());
  const [notice, setNotice] = useState('');

  // Submit the full form and show ranked matches below it when the API responds.
  async function handleSubmit(formData) {
    // Lock synchronously: a second click can arrive before React rerenders.
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    setSubmitting(true);
    setErrorMsg('');
    setNotice('');
    try {
      const fingerprint = await assessmentFingerprint(formData);
      const key = `roadmora-assessment:${user.id}:${fingerprint}`;
      let cached = completed.current.get(key);
      if (!cached) {
        try { cached = JSON.parse(sessionStorage.getItem(key)); } catch { /* Storage may be unavailable. */ }
      }
      if (cached?.top_matches?.length) {
        setResult(cached);
        setNotice('You have already submitted this information. Your existing career recommendations are shown below; no duplicate assessment was saved.');
        return;
      }
      const data = await postAssessment(formData);
      completed.current.set(key, data);
      try { sessionStorage.setItem(key, JSON.stringify(data)); } catch { /* In-memory protection remains active. */ }
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
      submissionLocked.current = false;
      setErrorMsg(err.message || 'Submission failed. Please check your connection and try again.');
    } finally {
      submissionLocked.current = false;
      setSubmitting(false);
    }
  }

  // Hide the result and bring the user back to the assessment section.
  function handleRetake() {
    submissionLocked.current = false;
    setErrorMsg('');
    setResult(null);
    setNotice('');
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

      {notice && <p className="container" role="status">{notice}</p>}
      {result && <ResultsSection result={result} onRetake={handleRetake} />}
    </>
  );
}
