"""
Feature encoding shared by dataset generation, training, and inference.

Every option list here comes from ml/data/taxonomies/*.json — the same
source of truth used to generate the frontend's form options (see
sync_taxonomies.py). This guarantees the model never sees a skill/language/
interest the form couldn't actually produce, and vice versa.
"""

import json
from pathlib import Path

import numpy as np

TAXONOMY_DIR = Path(__file__).resolve().parent.parent / "data" / "taxonomies"


def _load(name):
    with open(TAXONOMY_DIR / f"{name}.json") as f:
        return json.load(f)


def _flatten_grouped(grouped: dict) -> list:
    seen, out = set(), []
    for items in grouped.values():
        for item in items:
            if item not in seen:
                seen.add(item)
                out.append(item)
    return out


TECHNICAL_SKILLS = _flatten_grouped(_load("technical_skills"))
SOFT_SKILLS = _load("soft_skills")
LANGUAGES = _flatten_grouped(_load("languages"))
INDUSTRIES = _load("industries")

# Real O*NET taxonomy (see scripts/extract_onet.py) — 41 Specific Interest
# Areas, each mapped to one or more of the 6 RIASEC Career Interest Types.
SPECIFIC_INTEREST_AREAS = _load("specific_interest_areas")["areas"]
INTEREST_AREAS = sorted(SPECIFIC_INTEREST_AREAS.keys())
RIASEC_TYPES = ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"]

CAREER_CLUSTERS = sorted(_load("career_clusters")["clusters"].keys())
CLUSTER_OCCUPATIONS = _load("career_clusters")["clusters"]

JOB_ROLES = _load("job_roles")
# Internships reuse the industries taxonomy — "which industry did you intern
# in" is the same question shape as "preferred industries", so one list
# serves both rather than maintaining a second near-duplicate.
INTERNSHIP_DOMAINS = INDUSTRIES

EDUCATION_LEVELS = ["high_school", "diploma", "bachelors", "masters", "phd", "other"]
STATUSES = ["student", "job_seeker", "employed", "freelancer", "career_switcher"]

# Fixed ordering for every multi-hot / one-hot block, so encode_row() always
# produces a vector with the same column meaning in the same position.
FEATURE_BLOCKS = [
    ("education", EDUCATION_LEVELS),
    ("status", STATUSES),
    ("technicalSkills", TECHNICAL_SKILLS),
    ("softSkills", SOFT_SKILLS),
    ("languages", LANGUAGES),
    ("careerInterests", INTEREST_AREAS),
    ("preferredIndustries", INDUSTRIES),
    ("internships", INTERNSHIP_DOMAINS),
    ("jobExperience", JOB_ROLES),
]


def feature_names() -> list:
    """Flat list of column names matching the vector encode_row() produces."""
    names = []
    for field, options in FEATURE_BLOCKS:
        if field in ("education", "status"):
            names.extend(f"{field}={opt}" for opt in options)
        else:
            names.extend(f"{field}:{opt}" for opt in options)
    return names


def encode_row(assessment: dict) -> np.ndarray:
    """
    assessment: dict shaped like the frontend's AssessmentForm payload, e.g.
        {
          "education": "bachelors", "status": "student",
          "technicalSkills": ["Python", "React"],
          "softSkills": ["Problem Solving"],
          "languages": ["English", "Urdu"],
          "careerInterests": ["Software Development", "Artificial Intelligence & Machine Learning"],
          "preferredIndustries": ["Technology / Software"],
        }
    Returns a fixed-length 0/1 numpy vector (single-select fields are one-hot,
    multi-select fields are multi-hot).
    """
    vec = []
    for field, options in FEATURE_BLOCKS:
        value = assessment.get(field)
        if field in ("education", "status"):
            vec.extend(1.0 if value == opt else 0.0 for opt in options)
        else:
            selected = set(value or [])
            vec.extend(1.0 if opt in selected else 0.0 for opt in options)
    return np.array(vec, dtype=np.float32)


def encode_dataset(rows: list) -> np.ndarray:
    return np.stack([encode_row(r) for r in rows])


if __name__ == "__main__":
    names = feature_names()
    print(f"Total input feature dimensions: {len(names)}")
    print(f"Output classes (career clusters): {len(CAREER_CLUSTERS)}")
    for c in CAREER_CLUSTERS:
        print(f"  - {c} ({len(CLUSTER_OCCUPATIONS[c])} occupations in KB)")
