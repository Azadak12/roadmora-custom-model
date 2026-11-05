import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuthModal } from '../context/AuthModalContext.jsx';

export default function CtaSection() {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const navigate = useNavigate();

  function handleClick(e) {
    e.preventDefault();
    if (!user) {
      openAuth('login');
    } else {
      navigate('/assessment');
    }
  }

  return (
    <section className="cta-section" id="cta">
      <div className="container">
        <div className="cta-inner">
          <h2 className="cta-title">Take the career assessment that finds the careers you were built for.</h2>
          <p className="cta-sub">No experience needed. No right or wrong answers. Just honest inputs — and Roadmora AI does the rest.</p>
          <a href="/assessment" className="btn cta-section-btn btn--xl" onClick={handleClick}>
            Start Your Career Assessment
          </a>
          <p className="cta-note">Free to use · No credit card required</p>
        </div>
      </div>
    </section>
  );
}
