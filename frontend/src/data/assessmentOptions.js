// Specific form labels map to the existing trained vocabulary. Keep the base
// taxonomies unchanged: adding feature columns would invalidate saved weights.
import { TECHNICAL_SKILLS, INDUSTRIES, INTEREST_AREAS, JOB_ROLES } from './taxonomies.js';

const domains = {
  'Network Security': ['Technology / Software', 'Telecommunications'],
  'Cybersecurity': ['Technology / Software'],
  'AI / ML Development': ['Technology / Software'],
  'Data Science': ['Technology / Software'],
  'Cloud Computing': ['Technology / Software'],
};

export const ASSESSMENT_ALIASES = {
  technicalSkills: {
    'AI / ML Development': ['Machine Learning'],
    'Artificial Intelligence': ['Machine Learning'],
  },
  careerInterests: {
    'Network Security': ['Information Technology'],
    'Cybersecurity': ['Information Technology'],
    'AI / ML Development': ['Information Technology', 'Mathematics/Statistics'],
    'Data Science': ['Information Technology', 'Mathematics/Statistics'],
    'Cloud Computing': ['Information Technology'],
    'Software Development': ['Information Technology'],
  },
  internships: domains,
  preferredIndustries: domains,
  jobExperience: {
    'Network Security Specialist': ['IT Support Specialist'],
    'Cybersecurity Analyst': ['IT Support Specialist'],
    'AI / ML Developer': ['Software Developer'],
    'Machine Learning Engineer': ['Software Developer'],
    'Cloud Engineer': ['IT Support Specialist'],
  },
};

const extend = (base, field) => [...new Set([...base, ...Object.keys(ASSESSMENT_ALIASES[field])])];
export const ASSESSMENT_TECHNICAL_SKILLS = extend(TECHNICAL_SKILLS, 'technicalSkills');
export const ASSESSMENT_INTEREST_AREAS = extend(INTEREST_AREAS, 'careerInterests');
export const ASSESSMENT_INDUSTRIES = extend(INDUSTRIES, 'preferredIndustries');
export const ASSESSMENT_JOB_ROLES = extend(JOB_ROLES, 'jobExperience');

// Preserve the person's specific answer and add its broader trained categories.
// Only map within the same field: an interest must never imply a claimed skill.
export function prepareAssessmentPayload(formData) {
  const payload = { ...formData };
  for (const [field, aliases] of Object.entries(ASSESSMENT_ALIASES)) {
    payload[field] = [...new Set((formData[field] || []).flatMap(value => [value, ...(aliases[value] || [])]))];
  }
  return payload;
}
