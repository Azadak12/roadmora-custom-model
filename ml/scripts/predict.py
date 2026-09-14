"""
The inference-time prediction pipeline: assessment answers -> RIASEC vector
(from the trained PyTorch model) -> ranked real occupations (cosine
similarity against 923 real O*NET RIASEC profiles) -> the top match's real
knowledge-base content, shaped to match the frontend's expected response:

    {
      "career_field": str,
      "market_analysis": {"demand": str, "salary": str, "growth": str},
      "learning_roadmap": [str, ...],
    }

Import predict_career() from here in backend/main.py — see
ml/README.md "Wiring into the backend".
"""

import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics.pairwise import cosine_similarity

from features import RIASEC_TYPES, encode_row
from model_arch import RiasecMLP

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
OCCUPATIONS_PATH = RAW_DIR / "onet" / "occupation_riasec.json"
KNOWLEDGE_BASE_PATH = RAW_DIR / "onet" / "knowledge_base.json"
OCCUPATION_SKILLS_PATH = RAW_DIR / "onet" / "occupation_technical_skills.json"
BLS_WAGES_PATH = RAW_DIR / "bls" / "occupation_wages_growth.json"

_NOT_AVAILABLE = "Not available for this specific occupation (BLS data suppressed or not published)"

# RIASEC alone can't finely separate ~900 occupations — many unrelated jobs
# end up with near-identical similarity scores (see ml/README.md). Real
# per-occupation technology-skill tags (extract_onet_skills.py) give a much
# sharper secondary signal: a user who selected Python/React should not see
# Coroners next to Software Developers just because both scored similarly
# on 6 RIASEC dimensions. CANDIDATE_POOL_SIZE candidates are drawn by RIASEC
# similarity first (broad occupational-personality fit), then re-ranked by
# a weighted blend with real skill overlap (specific, concrete fit) so the
# final top-k is both RIASEC-plausible and thematically coherent.
CANDIDATE_POOL_SIZE = 120
RIASEC_WEIGHT = 0.35
SKILL_OVERLAP_WEIGHT = 0.65

# Below this many overlapping skills, the overlap coefficient (which
# normalizes by the SMALLER of the two skill sets) is unreliable: a user who
# selected just one common skill (e.g. "Microsoft Excel") gets a perfect 1.0
# against any occupation that merely lists it among dozens of tags, even
# when totally unrelated (Coroners, Airline Pilots, ...). Scaling by how
# many skills actually matched (capped at this threshold) requires a few
# real matches before the signal is trusted at full strength.
MIN_CONFIDENT_SKILL_MATCHES = 3


class CareerPredictor:
    """Loads the trained model + real O*NET data once; call .predict(assessment)."""

    def __init__(self):
        with open(MODEL_DIR / "riasec_mlp_input_dim.json") as f:
            input_dim = json.load(f)["input_dim"]
        self.model = RiasecMLP(input_dim=input_dim)
        self.model.load_state_dict(torch.load(MODEL_DIR / "riasec_mlp.pt", map_location="cpu", weights_only=True))
        self.model.eval()

        with open(OCCUPATIONS_PATH) as f:
            self.occupations = json.load(f)
        self.occ_codes = [o["onet_soc_code"] for o in self.occupations]
        self.occ_titles = {o["onet_soc_code"]: o["title"] for o in self.occupations}
        self.occ_matrix = np.array([[o["riasec"][t] for t in RIASEC_TYPES] for o in self.occupations])
        # Raw RIASEC scores are all positive (1-7), so plain cosine similarity
        # between them barely discriminates — almost every occupation ends up
        # >0.95 similar to any predicted profile. Row-centering before cosine
        # similarity turns it into a Pearson correlation across the 6
        # dimensions, which is sensitive to each profile's *shape* (which
        # traits are relatively higher/lower) rather than mostly reflecting
        # that all profiles point into the same positive octant.
        self.occ_matrix_centered = self.occ_matrix - self.occ_matrix.mean(axis=1, keepdims=True)

        with open(KNOWLEDGE_BASE_PATH) as f:
            self.knowledge_base = json.load(f)

        with open(OCCUPATION_SKILLS_PATH) as f:
            self.occupation_skills = json.load(f)

        with open(BLS_WAGES_PATH) as f:
            self.bls_data = json.load(f)

    def predict_riasec(self, assessment: dict) -> np.ndarray:
        x = torch.tensor(encode_row(assessment), dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            pred = self.model(x).numpy()
        return pred

    def _skill_overlap(self, user_skills: set, occ_code: str) -> float:
        """Overlap coefficient (intersection / smaller-set size) between the
        user's selected technical skills and this occupation's real O*NET
        technology tags. Occupations are tagged with dozens of tools, so
        plain Jaccard would drown a perfect match under a huge union (e.g.
        3/66) — normalizing by the user's (smaller) selection means picking
        skills that are ALL relevant to an occupation scores close to 1.0
        regardless of how many other tools that occupation also uses.
        0 if the user picked no technical skills (RIASEC alone then drives
        the ranking)."""
        if not user_skills:
            return 0.0
        occ_skills = set(self.occupation_skills.get(occ_code, []))
        if not occ_skills:
            return 0.0
        intersection = len(user_skills & occ_skills)
        if intersection == 0:
            return 0.0
        smaller = min(len(user_skills), len(occ_skills))
        overlap_coefficient = intersection / smaller
        confidence = min(intersection / MIN_CONFIDENT_SKILL_MATCHES, 1.0)
        return overlap_coefficient * confidence

    def top_occupations(self, assessment: dict, k: int = 5) -> list:
        pred = self.predict_riasec(assessment)
        pred_centered = pred - pred.mean(axis=1, keepdims=True)
        riasec_sims = cosine_similarity(pred_centered, self.occ_matrix_centered)[0]

        pool_size = min(CANDIDATE_POOL_SIZE, len(self.occ_codes))
        pool_idx = np.argsort(-riasec_sims)[:pool_size]

        user_skills = set(assessment.get("technicalSkills") or [])
        scored = []
        for i in pool_idx:
            code = self.occ_codes[i]
            riasec_sim = float(riasec_sims[i])
            skill_overlap = self._skill_overlap(user_skills, code)
            # Row-centering turns this into a Pearson correlation, which can
            # go negative for an opposite-shaped profile; floor it so an
            # anti-correlated RIASEC fit can't drag a real skill match's
            # score below zero (displayed to users as a % match).
            combined = RIASEC_WEIGHT * max(0.0, riasec_sim) + SKILL_OVERLAP_WEIGHT * skill_overlap
            scored.append((combined, riasec_sim, skill_overlap, i))

        scored.sort(key=lambda x: -x[0])
        top = scored[:k]
        return [
            {
                "onet_soc_code": self.occ_codes[i],
                "title": self.occ_titles[self.occ_codes[i]],
                "similarity": combined,
                "riasec_similarity": riasec_sim,
                "skill_overlap": skill_overlap,
            }
            for combined, riasec_sim, skill_overlap, i in top
        ]

    def _build_match(self, occ_code: str, title: str, similarity: float) -> dict:
        kb = self.knowledge_base.get(occ_code, {})
        # BLS uses 6-digit base SOC codes; O*NET-SOC codes append a 2-digit
        # detail suffix (e.g. "15-1252.00") — strip it to look up wage/growth.
        bls = self.bls_data.get(occ_code.split(".")[0], {})

        roadmap = []
        if kb.get("education"):
            roadmap.append(f"Education: {kb['education']}")
        if kb.get("experience"):
            roadmap.append(f"Experience: {kb['experience']}")
        if kb.get("job_training"):
            roadmap.append(f"Training: {kb['job_training']}")
        for task in kb.get("core_tasks", [])[:4]:
            roadmap.append(f"Core responsibility: {task}")
        if not roadmap:
            roadmap = ["Detailed roadmap data not available for this occupation yet."]

        return {
            "career_field": title,
            "similarity": round(similarity, 3),
            "market_analysis": {
                "demand": kb.get("job_zone_name", _NOT_AVAILABLE),
                "salary": bls.get("median_annual_wage") or _NOT_AVAILABLE,
                "growth": bls.get("growth_outlook") or _NOT_AVAILABLE,
            },
            "learning_roadmap": roadmap,
        }

    def predict(self, assessment: dict, k: int = 5) -> dict:
        """Returns a ranked list of top-k career matches (see ml/README.md
        for why a single hard "the" answer isn't a reliable framing for a
        6-dimensional RIASEC similarity match)."""
        matches = self.top_occupations(assessment, k=k)
        return {
            "top_matches": [
                self._build_match(m["onet_soc_code"], m["title"], m["similarity"])
                for m in matches
            ],
        }


if __name__ == "__main__":
    predictor = CareerPredictor()

    test_profiles = {
        "AI/Software-leaning": {
            "education": "bachelors", "status": "student",
            "technicalSkills": ["Python", "Machine Learning", "React"],
            "softSkills": ["Problem Solving", "Analytical Thinking"],
            "languages": ["English"],
            "careerInterests": ["Information Technology", "Mathematics/Statistics", "Engineering"],
            "preferredIndustries": ["Technology / Software"],
        },
        "Healthcare/Social-leaning": {
            "education": "bachelors", "status": "student",
            "technicalSkills": [],
            "softSkills": ["Communication", "Emotional Intelligence"],
            "languages": ["English", "Urdu"],
            "careerInterests": ["Health Care Service", "Social Service", "Teaching/Education"],
            "preferredIndustries": ["Healthcare & Pharmaceuticals"],
        },
        "Business/Sales-leaning": {
            "education": "bachelors", "status": "employed",
            "technicalSkills": ["Microsoft Excel"],
            "softSkills": ["Leadership", "Negotiation", "Public Speaking"],
            "languages": ["English"],
            "careerInterests": ["Business Initiatives", "Sales", "Management/Administration"],
            "preferredIndustries": ["Startups", "Consulting"],
        },
    }

    for name, profile in test_profiles.items():
        result = predictor.predict(profile)
        print(f"\n=== {name} ===")
        for m in result["top_matches"]:
            print(f"  {m['similarity']:.3f}  {m['career_field']}")
