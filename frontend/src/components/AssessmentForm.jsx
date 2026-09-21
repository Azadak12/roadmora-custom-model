/* The actual 5-step assessment form (Personal -> Education -> Skills -> Experience -> Interests). Used inside: sections/AssessmentSection.jsx. The dropdown OPTIONS (skills, industries, interests, etc.) come from data/taxonomies.js, which is auto-generated from the ML model's own taxonomy files — don't hand-edit those option lists here. */
import { useState } from 'react';
import MultiSelect from './MultiSelect.jsx';
import {
  TECHNICAL_SKILLS, SOFT_SKILLS, LANGUAGES, INDUSTRIES, INTEREST_AREAS, JOB_ROLES,
} from '../data/taxonomies.js';

const STEPS = [
  { label: 'Personal' },
  { label: 'Education' },
  { label: 'Skills' },
  { label: 'Experience' },
  { label: 'Interests' },
];

// Step numbers are 1-based to match the progress indicator. Only these fields
// block navigation; every other answer is optional for the model.
const REQUIRED_FIELDS_BY_STEP = {
  1: [],
  2: ['education', 'status'],
  3: [],
  4: [],
  5: ['careerInterests'],
};

const initialFormData = {
  fullName: '', email: '', phone: '', gender: '', dob: '',
  education: '', status: '',
  technicalSkills: [], softSkills: [], languages: [],
  internships: [], jobExperience: [],
  careerInterests: [], preferredIndustries: [],
};

export default function AssessmentForm({ onSubmit, submitting, errorMsg }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  // Keep all five steps in one payload and clear an error as soon as its field changes.
  function setField(name, val) {
    setFormData((f) => ({ ...f, [name]: val }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  // Validate the current step when moving forward; going back keeps the answers.
  function goToStep(dir) {
    if (dir === 1) {
      const required = REQUIRED_FIELDS_BY_STEP[step];
      const nextErrors = {};
      required.forEach((field) => {
        if (!String(formData[field] || '').trim()) nextErrors[field] = true;
      });
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
    }
    setStep((s) => s + dir);
  }

  // Recheck the final step before passing the complete assessment to its parent.
  function handleSubmit(e) {
    e.preventDefault();
    const required = REQUIRED_FIELDS_BY_STEP[step];
    const nextErrors = {};
    required.forEach((field) => {
      if (!String(formData[field] || '').trim()) nextErrors[field] = true;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(formData);
  }

  const borderStyle = (field) => (errors[field] ? { borderColor: 'var(--red)' } : undefined);

  return (
    <div className="assessment-card">
      <div className="assess-progress">
        <div className="ap-steps">
          {STEPS.map((s, i) => {
            const n = i + 1;
            return (
              <span key={s.label} style={{ display: 'contents' }}>
                <div className={`ap-step${n === step ? ' ap-step--active' : ''}${n < step ? ' ap-step--done' : ''}`} data-step={n}>
                  <div className="ap-step-circle">{n}</div>
                  <span className="ap-step-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`ap-connector${n < step ? ' ap-connector--done' : ''}`}></div>}
              </span>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="assess-step">
            <div className="assess-step-header">
              <div className="assess-step-icon">👤</div>
              <div><h3>Personal Information</h3><p>Let's start with the basics about you.</p></div>
            </div>
            <div className="assess-fields">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="e.g. Sara Ahmed"
                  style={borderStyle('fullName')} value={formData.fullName}
                  onChange={(e) => setField('fullName', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="you@example.com"
                    style={borderStyle('email')} value={formData.email}
                    onChange={(e) => setField('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" type="tel" placeholder="+92 300 0000000"
                    value={formData.phone} onChange={(e) => setField('phone', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input form-select" value={formData.gender}
                    onChange={(e) => setField('gender', e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not">Prefer not to say</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={formData.dob}
                    onChange={(e) => setField('dob', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="assess-step">
            <div className="assess-step-header">
              <div className="assess-step-icon">🎓</div>
              <div><h3>Education &amp; Status</h3><p>Tell us about your educational background and current situation.</p></div>
            </div>
            <div className="assess-fields">
              <div className="form-group">
                <label className="form-label">Highest Education Level <span className="req">*</span></label>
                <select className="form-input form-select" required style={borderStyle('education')}
                  value={formData.education} onChange={(e) => setField('education', e.target.value)}>
                  <option value="">Select education level</option>
                  <option value="high_school">High School</option>
                  <option value="diploma">Diploma</option>
                  <option value="bachelors">Bachelors</option>
                  <option value="masters">Masters</option>
                  <option value="phd">PhD</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Current Status <span className="req">*</span></label>
                <select className="form-input form-select" required style={borderStyle('status')}
                  value={formData.status} onChange={(e) => setField('status', e.target.value)}>
                  <option value="">Select your current status</option>
                  <option value="student">Student</option>
                  <option value="job_seeker">Job Seeker</option>
                  <option value="employed">Employed</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="career_switcher">Career Switcher</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="assess-step">
            <div className="assess-step-header">
              <div className="assess-step-icon">⚡</div>
              <div><h3>Skills</h3><p>Select all that apply — be honest about what you currently know.</p></div>
            </div>
            <div className="assess-fields">
              <div className="form-group">
                <label className="form-label">Technical Skills</label>
                <MultiSelect
                  name="technicalSkills"
                  placeholder="Select technical skills..."
                  searchable
                  options={TECHNICAL_SKILLS}
                  value={formData.technicalSkills}
                  onChange={(v) => setField('technicalSkills', v)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Soft Skills</label>
                <MultiSelect
                  name="softSkills"
                  placeholder="Select soft skills..."
                  searchable
                  options={SOFT_SKILLS}
                  value={formData.softSkills}
                  onChange={(v) => setField('softSkills', v)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Languages Known</label>
                <MultiSelect
                  name="languages"
                  placeholder="Select languages..."
                  searchable
                  options={LANGUAGES}
                  value={formData.languages}
                  onChange={(v) => setField('languages', v)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="assess-step">
            <div className="assess-step-header">
              <div className="assess-step-icon">💼</div>
              <div><h3>Experience</h3><p>Share your internship and work experience backgrounds.</p></div>
            </div>
            <div className="assess-fields">
              <div className="form-group">
                <label className="form-label">Internships</label>
                <MultiSelect
                  name="internships"
                  placeholder="Select internship domains..."
                  searchable
                  options={INDUSTRIES}
                  value={formData.internships}
                  onChange={(v) => setField('internships', v)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Job Experience</label>
                <MultiSelect
                  name="jobExperience"
                  placeholder="Select job roles..."
                  searchable
                  options={JOB_ROLES}
                  value={formData.jobExperience}
                  onChange={(v) => setField('jobExperience', v)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="assess-step">
            <div className="assess-step-header">
              <div className="assess-step-icon">🎯</div>
              <div><h3>Career Interests</h3><p>Select the fields and industries that interest you most.</p></div>
            </div>
            <div className="assess-fields">
              <div className="form-group">
                <label className="form-label">Career Interests <span className="req">*</span></label>
                <MultiSelect
                  name="careerInterests"
                  placeholder="Select career interests..."
                  searchable
                  options={INTEREST_AREAS}
                  value={formData.careerInterests}
                  onChange={(v) => setField('careerInterests', v)}
                  error={errors.careerInterests}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Industries</label>
                <MultiSelect
                  name="preferredIndustries"
                  placeholder="Select preferred industries..."
                  searchable
                  options={INDUSTRIES}
                  value={formData.preferredIndustries}
                  onChange={(v) => setField('preferredIndustries', v)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="assess-nav">
          <button type="button" className="btn assess-form-prev-btn" onClick={() => goToStep(-1)} disabled={step === 1}>← Previous</button>
          <span className="assess-counter">Step {step} of {STEPS.length}</span>
          {step < STEPS.length ? (
            <button type="button" className="btn assess-form-next-btn" onClick={() => goToStep(1)}>Next Step →</button>
          ) : (
            <button type="submit" className="btn assess-form-submit-btn" disabled={submitting}>
              {submitting ? 'Generating your roadmap…' : (
                <>
                  Get My Career Roadmap
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </>
              )}
            </button>
          )}
        </div>
        {errorMsg && (
          <div className="form-success visible" style={{ background: 'rgba(239,68,68,.08)', borderColor: 'rgba(239,68,68,.2)', color: 'var(--red)' }}>
            ✗ {errorMsg}
          </div>
        )}
      </form>
    </div>
  );
}
