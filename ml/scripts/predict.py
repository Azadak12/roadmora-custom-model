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
import re
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
OCCUPATION_INTEREST_AREAS_PATH = RAW_DIR / "onet" / "occupation_interest_areas.json"
BLS_WAGES_PATH = RAW_DIR / "bls" / "occupation_wages_growth.json"

_NOT_AVAILABLE = "Not available for this specific occupation (BLS data suppressed or not published)"

# RIASEC alone can't finely separate ~900 occupations — many unrelated jobs
# end up with near-identical similarity scores (see ml/README.md). Real
# per-occupation technology-skill tags (extract_onet_skills.py) and interest
# tags (extract_onet_interest_areas.py) give sharper, more concrete secondary
# signals: a user who selected Python/React should not see Coroners next to
# Software Developers just because both scored similarly on 6 RIASEC
# dimensions, and a user who explicitly picked "Information Technology" as a
# career interest should have that count directly, not only flow in as one
# of many inputs to the RIASEC prediction. CANDIDATE_POOL_SIZE candidates are
# drawn by RIASEC similarity first (broad occupational-personality fit),
# then re-ranked by a weighted blend of RIASEC fit + real interest-area
# overlap + real skill overlap + industry relevance, so the final top-k
# reflects everything the user actually told us, not just their RIASEC shape.
CANDIDATE_POOL_SIZE = 120

# Base weights for the structured ranking signals. A signal a user left blank
# (no technicalSkills, no careerInterests, no preferredIndustries selected)
# is dropped and the remaining weights are renormalized to sum to 1 — see
# top_occupations() — so leaving an optional field empty never drags a
# genuinely strong match's score down by averaging in a forced zero.
#
# RIASEC gets the smallest structured-signal weight on purpose: it is a *model
# prediction* (the only signal here that can simply be wrong for a given
# profile — see ml/README.md's known limitation), while interest/skill/
# industry are literal overlaps against real O*NET/BLS data. A previous,
# more RIASEC-heavy version of these weights let a merely mediocre RIASEC
# prediction cap an occupation with a *perfect* concrete interest match at a
# middling score — a real user typing in Finance + IT interests saw their
# best real match (Business Intelligence Analysts, 100% interest overlap)
# held down by RIASEC to under 60%. RIASEC still counts, and still breaks
# ties among occupations that are otherwise concrete-evidence twins, but it
# can no longer single-handedly veto a strong direct match.
RIASEC_WEIGHT = 0.15
INTEREST_WEIGHT = 0.30
SKILL_WEIGHT = 0.35
INDUSTRY_WEIGHT = 0.20

# Technology-tag lists are intentionally broad: O*NET may associate Python,
# SQL, data analysis, and even machine learning with many neighboring IT jobs.
# When a selected skill is also stated directly in an occupation's official
# title/description, that is much stronger evidence of what the job actually
# centers on. Only reasonably rare description matches activate this signal,
# so generic terms cannot dominate the ranking.
CORE_SKILL_WEIGHT = 0.60
MAX_CORE_SKILL_OCCUPATIONS = 30

# A structured previous job title is substantially more precise than the
# synthetic model's broad personality estimate. It is especially important
# for common tools such as Excel, which occur in hundreds of occupations.
EXPERIENCE_WEIGHT = 0.55

# The current web form uses structured interests instead of a free-text goal.
# Keep goal intent as a backwards-compatible signal for older clients/saved
# payloads that may still send it. It only activates when we can identify an
# occupation phrase (or a deliberately listed common alias), so vague text
# does not perturb the evidence-based ranking.
GOAL_WEIGHT = 0.40

# O*NET titles do not always use the name people naturally type.  Keep this
# small and explicit: the left side is a common goal phrase, and the right side
# contains the exact O*NET-SOC occupations that phrase is intended to mean.
# All other occupation names are matched automatically from the 923 O*NET
# titles, including singular/plural variants ("graphic designer" -> "Graphic
# Designers", "data scientist" -> "Data Scientists", etc.).
GOAL_OCCUPATION_ALIASES = {
    "software engineer": {"15-1252.00"},
    "software engineering": {"15-1252.00"},
    "software development": {"15-1252.00", "15-1254.00"},
    "ai engineer": {"15-2051.00", "15-1221.00"},
    "artificial intelligence engineer": {"15-2051.00", "15-1221.00"},
    "artificial intelligence": {"15-2051.00", "15-1221.00"},
    "machine learning engineer": {"15-2051.00", "15-1221.00"},
    "machine learning": {"15-2051.00", "15-1221.00"},
    "data science": {"15-2051.00"},
    "frontend developer": {"15-1254.00", "15-1255.00"},
    "front end developer": {"15-1254.00", "15-1255.00"},
    "backend developer": {"15-1252.00", "15-1254.00"},
    "back end developer": {"15-1252.00", "15-1254.00"},
    "full stack developer": {"15-1252.00", "15-1254.00"},
    "web development": {"15-1254.00", "15-1255.00"},
    "cybersecurity analyst": {"15-1212.00"},
    "cyber security analyst": {"15-1212.00"},
    "security analyst": {"15-1212.00"},
    "ui ux designer": {"15-1255.00"},
    "ux designer": {"15-1255.00"},
    "graphic design": {"27-1024.00"},
    "business analyst": {"13-1111.00", "15-2051.01"},
    "accounting": {"13-2011.00"},
    "auditing": {"13-2011.00"},
    "nursing": {"29-1141.00"},
}

# Single-word occupation titles are usually ambiguous in prose (for example,
# O*NET has an occupation literally named "Models").  Requiring at least two
# meaningful title tokens prevents "build machine-learning models" from being
# interpreted as a desire to work as a fashion model.  These familiar career
# words are safe exceptions when the goal uses them explicitly.
SAFE_SINGLE_WORD_GOAL_TITLES = {
    "accountant", "actor", "architect", "auditor", "chef", "dentist",
    "economist", "electrician", "firefighter", "lawyer", "nurse",
    "pharmacist", "photographer", "pilot", "psychologist", "teacher",
    "veterinarian", "writer",
}

TITLE_STOP_WORDS = {
    "and", "except", "including", "other", "all", "special", "first",
    "line", "workers", "worker", "specialists", "specialist",
}

# Floor for the renormalization denominator in top_occupations() — see the
# comment at its use site. Set to RIASEC_WEIGHT + max(the three structured
# evidence signals), i.e.
# exactly "RIASEC plus one strong optional signal" (currently 0.15 + 0.35 =
# 0.50): a profile that fills in just skills, or just interests, still gets
# full, unsuppressed renormalization when that one signal is a genuinely
# excellent match (a perfect skill overlap should be able to read as a
# strong match on its own), while RIASEC alone (weight 0.15) or industry
# alone (weight 0.20, the coarsest of the three) still fall well short of
# this floor and stay proportionally suppressed rather than inflated.
MIN_EVIDENCE_WEIGHT = RIASEC_WEIGHT + max(INTEREST_WEIGHT, SKILL_WEIGHT, INDUSTRY_WEIGHT)

# Below this many overlapping skills/interests, the overlap coefficient
# (which normalizes by the SMALLER of the two sets) is unreliable: a user who
# selected just one common skill (e.g. "Microsoft Excel") gets a perfect 1.0
# against any occupation that merely lists it among dozens of tags, even
# when totally unrelated (Coroners, Airline Pilots, ...). Scaling by how many
# actually matched (capped at this threshold) requires a few real matches
# before the signal is trusted at full strength.
MIN_CONFIDENT_SKILL_MATCHES = 3
MIN_CONFIDENT_INTEREST_MATCHES = 1

# A recommendation is only labeled a "strong match" (the ~>75% bar the UI
# highlights) once it clears this combined-score floor. top_occupations()
# still fills out the requested k results with the next-best candidates if
# fewer than k clear the bar, so a thin profile always gets *some*
# suggestions — but ranked first, and flagged, are the ones confidently
# above it.
STRONG_MATCH_THRESHOLD = 0.75

# O*NET deliberately does not tag occupations by industry (most occupations
# span many industries), so there is no real per-occupation industry dataset
# to match against directly. Instead this maps each real, government-defined
# BLS/O*NET Standard Occupational Classification (SOC) major group — the
# first two digits of every O*NET-SOC code — to the subset of the
# assessment's `preferredIndustries` options it plausibly belongs to. This is
# a structural approximation grounded in an official classification, not
# per-occupation employment data — documented here and in ml/README.md so it
# is never mistaken for a real industry crosswalk.
SOC_MAJOR_GROUP_TO_INDUSTRIES = {
    "11": ["Consulting", "Startups", "Government / Public Sector"],
    "13": ["Finance & Banking", "Consulting", "Insurance"],
    "15": ["Technology / Software", "Telecommunications"],
    "17": ["Real Estate & Construction", "Aerospace & Defense", "Automotive",
           "Manufacturing", "Energy & Utilities"],
    "19": ["Healthcare & Pharmaceuticals", "Agriculture", "Energy & Utilities"],
    "21": ["Non-Profit / NGO", "Government / Public Sector", "Education"],
    "23": ["Legal Services", "Government / Public Sector"],
    "25": ["Education"],
    "27": ["Media & Entertainment", "Marketing & Advertising", "Sports & Recreation",
           "Textile & Fashion"],
    "29": ["Healthcare & Pharmaceuticals"],
    "31": ["Healthcare & Pharmaceuticals"],
    "33": ["Government / Public Sector"],
    "35": ["Food & Beverage", "Hospitality & Tourism"],
    "37": ["Real Estate & Construction"],
    "39": ["Hospitality & Tourism", "Sports & Recreation"],
    "41": ["E-commerce & Retail", "Marketing & Advertising", "Consulting"],
    "43": ["Government / Public Sector", "Consulting"],
    "45": ["Agriculture"],
    "47": ["Real Estate & Construction", "Energy & Utilities"],
    "49": ["Automotive", "Manufacturing", "Energy & Utilities"],
    "51": ["Manufacturing", "Textile & Fashion", "Food & Beverage", "Automotive"],
    "53": ["Transportation & Logistics"],
    "55": ["Government / Public Sector"],
}


def _singularize_word(word: str) -> str:
    """Conservative singularization for comparing natural-language goals
    with plural O*NET titles; this is intentionally not a general stemmer."""
    if len(word) > 4 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 3 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def _normalized_words(text: str) -> list[str]:
    return [_singularize_word(w) for w in re.findall(r"[a-z0-9]+", (text or "").lower())]


def _contains_phrase(words: list[str], phrase: str) -> bool:
    phrase_words = _normalized_words(phrase)
    size = len(phrase_words)
    return bool(size) and any(words[i:i + size] == phrase_words for i in range(len(words) - size + 1))


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
        self.occ_goal_tokens = {
            o["onet_soc_code"]: [
                word for word in _normalized_words(o["title"].split(",", 1)[0])
                if word not in TITLE_STOP_WORDS
            ]
            for o in self.occupations
        }
        self.occ_core_words = {
            o["onet_soc_code"]: _normalized_words(f"{o['title']} {o.get('description', '')}")
            for o in self.occupations
        }
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

        with open(OCCUPATION_INTEREST_AREAS_PATH) as f:
            self.occupation_interest_areas = json.load(f)

        with open(BLS_WAGES_PATH) as f:
            self.bls_data = json.load(f)

    def predict_riasec(self, assessment: dict) -> np.ndarray:
        x = torch.tensor(encode_row(assessment), dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            pred = self.model(x).numpy()
        return pred

    @staticmethod
    def _overlap_coefficient(selected: set, tags: set, min_confident_matches: int) -> float:
        """Overlap coefficient (intersection / smaller-set size), scaled down
        when fewer than `min_confident_matches` items actually matched.
        Normalizing by the smaller set means a small, fully-relevant
        selection can score close to 1.0 regardless of how many other tags
        the occupation also carries — but with too few matches that same
        arithmetic lets one lucky/generic overlap (e.g. a single common
        skill) look like a perfect fit, so the confidence scale-down requires
        a few real matches before the signal is trusted at full strength.
        0 if either set is empty."""
        if not selected or not tags:
            return 0.0
        intersection = len(selected & tags)
        if intersection == 0:
            return 0.0
        smaller = min(len(selected), len(tags))
        overlap_coefficient = intersection / smaller
        confidence = min(intersection / min_confident_matches, 1.0)
        return overlap_coefficient * confidence

    def _skill_overlap(self, user_skills: set, occ_code: str) -> float:
        """Overlap between the user's selected technical skills and this
        occupation's real O*NET technology tags (extract_onet_skills.py).
        0 if the user picked no technical skills."""
        occ_skills = set(self.occupation_skills.get(occ_code, []))
        return self._overlap_coefficient(user_skills, occ_skills, MIN_CONFIDENT_SKILL_MATCHES)

    def _interest_overlap(self, user_interests: set, occ_code: str) -> float:
        """Overlap between the user's selected career interests (specific
        O*NET interest areas) and this occupation's real, O*NET-curated top
        interest areas (extract_onet_interest_areas.py, the "Summary Display
        Rank" scale — O*NET's own top handful of areas per occupation).
        0 if the user picked no career interests, or this occupation has no
        interest-area tags on file (~3% of occupations).

        Interest sets are short and curated, so score the fraction of the
        user's selected interests supported by the occupation. A user who
        selects one clear interest such as Finance should receive full credit
        when Finance is one of the occupation's official interest areas.
        """
        occ_areas = set(self.occupation_interest_areas.get(occ_code, []))
        if not user_interests or not occ_areas:
            return 0.0
        intersection = len(user_interests & occ_areas)
        if intersection == 0:
            return 0.0
        selected_coverage = intersection / len(user_interests)
        confidence = min(intersection / MIN_CONFIDENT_INTEREST_MATCHES, 1.0)
        return selected_coverage * confidence

    def _goal_scores(self, goal: str) -> dict[str, float]:
        """Return only occupations clearly named or aliased in the goal.

        This deliberately performs intent/phrase matching rather than broad
        bag-of-words similarity.  Broad similarity made phrases such as
        "mobile applications" prefer Mobile Home Installers and interpreted
        "machine-learning models" as the occupation Models.  A missing match
        means the goal signal is omitted entirely, not scored as zero.
        """
        goal_words = _normalized_words(goal)
        if not goal_words:
            return {}

        scores = {}
        for phrase, codes in GOAL_OCCUPATION_ALIASES.items():
            if _contains_phrase(goal_words, phrase):
                for code in codes:
                    if code in self.occ_titles:
                        scores[code] = max(scores.get(code, 0.0), 0.90)

        goal_word_set = set(goal_words)
        for code, title_words in self.occ_goal_tokens.items():
            meaningful = [w for w in title_words if len(w) > 2]
            if len(meaningful) >= 2 and _contains_phrase(goal_words, " ".join(meaningful)):
                scores[code] = 1.0
                continue

            # Allow an explicit, unambiguous profession word such as "nurse"
            # or "accountant" even when O*NET's title has qualifiers.
            safe_hits = goal_word_set & set(meaningful) & SAFE_SINGLE_WORD_GOAL_TITLES
            if safe_hits:
                scores[code] = max(scores.get(code, 0.0), 0.85)

        return scores

    def _core_skill_scores(self, user_skills: set[str]) -> dict[str, float]:
        """Match selected skills against official occupation descriptions.

        Only skills occurring in 1..MAX_CORE_SKILL_OCCUPATIONS descriptions
        are discriminative enough to count. Scores are coverage over those
        discriminative skills, not over every selected tool.
        """
        matches_by_skill = []
        for skill in user_skills:
            skill_words = _normalized_words(skill)
            if not skill_words or not any(len(word) > 1 for word in skill_words):
                continue
            matching_codes = {
                code for code, words in self.occ_core_words.items()
                if _contains_phrase(words, " ".join(skill_words))
            }
            if 0 < len(matching_codes) <= MAX_CORE_SKILL_OCCUPATIONS:
                matches_by_skill.append(matching_codes)

        if not matches_by_skill:
            return {}

        denominator = len(matches_by_skill)
        return {
            code: sum(code in matches for matches in matches_by_skill) / denominator
            for code in self.occ_codes
            if any(code in matches for matches in matches_by_skill)
        }

    def _experience_scores(self, job_experience: set[str]) -> dict[str, float]:
        """Resolve structured prior-job selections to O*NET occupations.

        The same conservative title/alias matcher used for legacy goals is
        safe here because these values come from the form's controlled job
        role taxonomy, not arbitrary prose. Any matching prior role provides
        supporting evidence; values such as "None" naturally match nothing.
        """
        scores = {}
        for role in job_experience:
            role_scores = self._goal_scores(role)
            if not role_scores:
                continue
            maximum = max(role_scores.values())
            for code, score in role_scores.items():
                scores[code] = max(scores.get(code, 0.0), score / maximum)
        return scores

    @staticmethod
    def _industry_match(user_industries: set, occ_code: str) -> float:
        """1.0 if at least one of the user's selected preferred industries
        falls under this occupation's real SOC major group, else 0.0 (see
        SOC_MAJOR_GROUP_TO_INDUSTRIES for why this is a structural
        approximation, not a real per-occupation industry dataset). This is
        deliberately an any-match, not a fraction of the user's selections —
        an occupation can't simultaneously belong to every industry a user
        expressed interest in, so a real user picking several industries
        (hoping to match any of them) should never be penalized versus a
        user who cautiously picked only one. 0 if the user picked no
        preferred industries."""
        if not user_industries:
            return 0.0
        major_group = occ_code.split("-")[0]
        plausible = set(SOC_MAJOR_GROUP_TO_INDUSTRIES.get(major_group, []))
        return 1.0 if user_industries & plausible else 0.0

    def top_occupations(self, assessment: dict, k: int = 5) -> list:
        pred = self.predict_riasec(assessment)
        pred_centered = pred - pred.mean(axis=1, keepdims=True)
        riasec_sims = cosine_similarity(pred_centered, self.occ_matrix_centered)[0]

        user_skills = set(assessment.get("technicalSkills") or [])
        user_interests = set(assessment.get("careerInterests") or [])
        user_industries = set(assessment.get("preferredIndustries") or [])
        job_experience = set(assessment.get("jobExperience") or [])
        goal_scores = self._goal_scores(assessment.get("goals") or "")
        core_skill_scores = self._core_skill_scores(user_skills)
        experience_scores = self._experience_scores(job_experience)

        pool_size = min(CANDIDATE_POOL_SIZE, len(self.occ_codes))
        pool_idx = set(np.argsort(-riasec_sims)[:pool_size].tolist())

        # The RIASEC model can mispredict a profile's dominant trait (e.g. it
        # sometimes calls a Python/React/ML profile "Realistic" instead of
        # "Investigative"), which would silently exclude a genuinely relevant
        # occupation from the pool above no matter how well its real O*NET
        # skill or interest tags match the user's selections — re-ranking
        # can't rescue a candidate the pool never included. So also pull in
        # every occupation with at least one concrete, real overlapping skill
        # or interest tag, regardless of where the RIASEC prediction placed
        # it; a candidate this specific isn't a false positive worth missing.
        if user_skills or user_interests:
            for i, code in enumerate(self.occ_codes):
                if i in pool_idx:
                    continue
                if user_skills and set(self.occupation_skills.get(code, [])) & user_skills:
                    pool_idx.add(i)
                elif user_interests and set(self.occupation_interest_areas.get(code, [])) & user_interests:
                    pool_idx.add(i)

        # An explicitly named goal must be eligible even if the noisy RIASEC
        # model placed it outside the initial candidate pool.
        code_to_idx = {code: i for i, code in enumerate(self.occ_codes)}
        pool_idx.update(code_to_idx[code] for code in goal_scores if code in code_to_idx)
        pool_idx.update(code_to_idx[code] for code in core_skill_scores if code in code_to_idx)
        pool_idx.update(code_to_idx[code] for code in experience_scores if code in code_to_idx)

        # RIASEC is always available (every assessment produces a predicted
        # profile), but interest/skill/industry signals only apply when the
        # user actually filled in that optional field. Dropping an absent
        # signal's weight and renormalizing the rest means leaving a field
        # blank never dilutes a genuinely strong match by averaging in a
        # forced zero for something the user was never asked to guess at.
        weights = {"riasec": RIASEC_WEIGHT}
        if user_interests:
            weights["interest"] = INTEREST_WEIGHT
        if user_skills:
            weights["skill"] = SKILL_WEIGHT
        if core_skill_scores:
            weights["core_skill"] = CORE_SKILL_WEIGHT
        if experience_scores:
            weights["experience"] = EXPERIENCE_WEIGHT
        if user_industries:
            weights["industry"] = INDUSTRY_WEIGHT
        if goal_scores:
            weights["goal"] = GOAL_WEIGHT
        # Renormalizing fully whenever only one or two fields are filled in
        # can badly overstate confidence: RIASEC alone can predict a
        # confidently-*shaped* profile that just happens to correlate with
        # some occupation without any concrete corroborating evidence, and
        # dividing that by RIASEC_WEIGHT alone (0.25) would inflate it to a
        # "100% match" reported to the user. Flooring the divisor at
        # MIN_EVIDENCE_WEIGHT means real expressiveness only kicks in once
        # there is enough actual evidence behind it (interpreted here as
        # "RIASEC plus one strong structured signal"); with every field
        # filled in this floor never engages and the score is exactly the
        # plain weighted average.
        weight_total = max(sum(weights.values()), MIN_EVIDENCE_WEIGHT)

        scored = []
        for i in pool_idx:
            code = self.occ_codes[i]
            # Row-centering turns this into a Pearson correlation, which can
            # go negative for an opposite-shaped profile; floor it so an
            # anti-correlated RIASEC fit can't drag a real match's score
            # below zero (displayed to users as a % match).
            riasec_sim = max(0.0, float(riasec_sims[i]))
            interest_overlap = self._interest_overlap(user_interests, code)
            skill_overlap = self._skill_overlap(user_skills, code)
            industry_match = self._industry_match(user_industries, code)
            goal_match = goal_scores.get(code, 0.0)
            core_skill_match = core_skill_scores.get(code, 0.0)
            experience_match = experience_scores.get(code, 0.0)

            weighted_sum = weights["riasec"] * riasec_sim
            if "interest" in weights:
                weighted_sum += weights["interest"] * interest_overlap
            if "skill" in weights:
                weighted_sum += weights["skill"] * skill_overlap
            if "core_skill" in weights:
                weighted_sum += weights["core_skill"] * core_skill_match
            if "experience" in weights:
                weighted_sum += weights["experience"] * experience_match
            if "industry" in weights:
                weighted_sum += weights["industry"] * industry_match
            if "goal" in weights:
                weighted_sum += weights["goal"] * goal_match
            combined = weighted_sum / weight_total

            scored.append((combined, riasec_sim, interest_overlap, skill_overlap, industry_match, goal_match, core_skill_match, experience_match, i))

        scored.sort(key=lambda x: -x[0])

        # Only ever return matches that actually clear the "strong match" bar
        # the product presents to users (a weaker padded-in result would
        # contradict the ">=75%" claim shown on screen) — this can genuinely
        # return fewer than k, which is correct: a thin profile (e.g. only
        # an industry picked, no skills or interests) may only have one or
        # two occupations it can confidently vouch for, and showing three
        # anyway by padding with a 68% "match" is worse than showing fewer,
        # honestly labeled ones. The single absolute fallback below exists
        # only so the API never returns a hard empty list for `best =
        # top_matches[0]` in main.py to crash on; it should be vanishingly
        # rare for any assessment where skills or interests were filled in.
        top = [row for row in scored if row[0] >= STRONG_MATCH_THRESHOLD][:k]
        if not top:
            top = scored[:1]

        return [
            {
                "onet_soc_code": self.occ_codes[i],
                "title": self.occ_titles[self.occ_codes[i]],
                "similarity": combined,
                "strong_match": combined >= STRONG_MATCH_THRESHOLD,
                "riasec_similarity": riasec_sim,
                "interest_overlap": interest_overlap,
                "skill_overlap": skill_overlap,
                "industry_match": industry_match,
                "goal_match": goal_match,
                "core_skill_match": core_skill_match,
                "experience_match": experience_match,
            }
            for combined, riasec_sim, interest_overlap, skill_overlap, industry_match, goal_match, core_skill_match, experience_match, i in top
        ]

    def _build_match(self, occ_code: str, title: str, similarity: float, strong_match: bool) -> dict:
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
            "strong_match": strong_match,
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
                self._build_match(m["onet_soc_code"], m["title"], m["similarity"], m["strong_match"])
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
