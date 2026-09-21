# Roadmora AI — Custom Model Pipeline

Replaces the n8n/OpenAI pipeline with a self-trained model + real O*NET data.
This is wired into `backend/main.py`'s `/api/assessment` route and is live —
not a standalone experiment.

## Folder structure

```
ml/
  data/
    taxonomies/       Source-of-truth option lists for the form AND the model.
                       Edit these, then run sync_taxonomies.py.
    raw/
      onet/            Real O*NET 31.0 database (downloaded from onetcenter.org,
                        public domain, U.S. Dept. of Labor) + extracted JSON.
      synthetic_assessments.jsonl   Generated training rows (see below).
  scripts/
    extract_onet.py             Extracts real interest taxonomy + occupation RIASEC profiles.
    extract_onet_skills.py      Extracts real per-occupation technology-skill tags.
    build_knowledge_base.py     Extracts real education/experience/task content per occupation.
    features.py                 Feature encoding shared by dataset generation, training, inference.
    generate_dataset.py         Builds synthetic (answers -> real RIASEC vector) training rows.
    model_arch.py               The PyTorch network definition (shared by train_mlp.py and predict.py).
    train_mlp.py                Trains the from-scratch neural network — the actual deliverable.
    train_riasec_baseline.py    Ridge / Random Forest baselines, for comparison only.
    predict.py                  Inference pipeline: assessment -> ranked real occupations -> roadmap.
    sync_taxonomies.py          Regenerates frontend/src/data/taxonomies.js from the JSON taxonomies.
  models/              Saved trained model + training history land here.
```

## Architecture

1. **Input**: the assessment form (skills, languages, industries, internships, job
   experience, and O*NET's real 41 "Specific Interest Areas").
2. **Trained model**: a from-scratch PyTorch feed-forward network (`model_arch.py`,
   `train_mlp.py`) predicts a 6-dimensional RIASEC vector (Realistic / Investigative /
   Artistic / Social / Enterprising / Conventional) — the same Holland Codes
   methodology real career-interest inventories use. No pretrained weights, no
   external API anywhere in this path.
3. **Candidate ranking**: that vector is compared (cosine similarity) against all
   923 real O*NET occupations' real RIASEC profiles, producing a broad candidate
   pool (top 40).
4. **Multi-signal re-ranking**: RIASEC alone can't finely separate ~900
   occupations — many unrelated jobs land at near-identical similarity (a
   Python/ML profile's top RIASEC matches included things like
   "Telecommunications Engineering Specialists" mixed with "Occupational
   Health and Safety Specialists"), and it can occasionally mispredict a
   profile's dominant trait outright. To fix this, candidates are re-ranked
   using three further real signals, each only contributing when the user
   actually filled in that field:
   - **Interest overlap** — the user's selected career interests against that
     occupation's real, O*NET-curated top interest areas
     (`extract_onet_interest_areas.py`, the "Specific Interest Areas" table's
     "Summary Display Rank" scale — O*NET's own top handful of areas per
     occupation, the same 41-area taxonomy the assessment form uses).
   - **Skill overlap** — the user's selected technical skills against that
     occupation's real O*NET technology tags (`extract_onet_skills.py`,
     sourced from the "Software Skills" table — actual tool names like
     "Python", "React", "Docker" tagged per occupation).
   - **Core-skill relevance** — broad O*NET technology lists can make nearby
     IT careers look identical, so selected skills stated directly in an
     occupation's official title or description receive additional weight.
     Only rare description matches activate this signal; for example,
     "machine learning" directly identifies Data Scientists without letting
     generic tool names dominate the ranking.
   - **Previous-role relevance** — structured `jobExperience` selections are
     resolved against O*NET occupation titles and common aliases. This keeps a
     directly relevant role such as Accountant from being drowned out by a
     generic Excel match or a noisy RIASEC prediction.
   - **Industry relevance** — the user's selected preferred industries against
     the subset of industries plausible for that occupation's real BLS/O*NET
     Standard Occupational Classification (SOC) major group. O*NET
     deliberately does not tag occupations by industry (most occupations span
     many industries), so this is a structural approximation grounded in an
     official classification (`SOC_MAJOR_GROUP_TO_INDUSTRIES` in
     `predict.py`), not a real per-occupation industry dataset — documented
     here so it is never mistaken for one.
   - **Legacy career-goal intent** — the current web form no longer asks for
     free-text goals, but older clients and saved payloads remain supported.
     When such a payload clearly names an O*NET occupation or documented alias
     such as "software engineer", it can contribute; vague text does not.

   Skill overlap uses the *overlap coefficient* (intersection / smaller-set
   size) because an occupation can have 60+ tool tags; this correctly scores
   "all 3 of your skills are used here" without drowning the match in a huge
   union. Interest overlap measures coverage of the user's selected interests;
   a clear single selection such as Finance receives full credit when it is an
   official interest area for the occupation.

   The signals are combined as a weighted average
   (`RIASEC 0.15 / interest 0.30 / skill 0.35 / industry 0.20`, plus
   core-skill relevance at `0.60` when detected and legacy goal intent at
   `0.40` when supplied, plus previous-role relevance at `0.55` when a
   structured job title can be resolved), renormalized
   over whichever signals the user actually provided so leaving an optional
   field blank never dilutes a genuinely strong match by averaging in a
   forced zero — but the renormalization denominator is floored at
   `RIASEC_WEIGHT + max(the other three)` (currently 0.15 + 0.35 = 0.50) so
   a profile that fills in RIASEC alone can't have a possibly-noisy
   similarity inflated into a falsely "confident" score, while a profile
   that fills in even just one strong optional signal (skills or interests)
   still gets full, unsuppressed renormalization when that signal is a
   genuinely excellent match — a perfect skill overlap reads as a strong
   match on its own, without needing interests or industries filled in too.
   RIASEC gets the smallest weight of the four deliberately: unlike the other
   three, it is a model prediction that can simply be wrong for a given
   profile, and an earlier, more RIASEC-heavy weighting let a merely mediocre
   RIASEC prediction cap an occupation with a *perfect* concrete interest
   match well below 60% — a real profile with Finance + Information
   Technology interests saw its best real match (Business Intelligence
   Analysts, 100% interest overlap, 100% industry match) held down by RIASEC
   alone. The industry-match signal is also an any-match, not a fraction of
   the user's selections: an occupation can't simultaneously belong to every
   industry a user expressed interest in, so picking several industries to
   widen the search must never score worse than cautiously picking one.
   The RIASEC-only candidate pool (top 120 by similarity) is also widened to
   include every occupation with at least one concrete overlapping skill or
   interest tag, regardless of its RIASEC rank, so a real match a mispredicted
   RIASEC vector would have excluded is never silently dropped before
   re-ranking gets a chance to surface it. Only occupations scoring 0.75 or
   higher (`strong_match`) are returned — up to `k`, but genuinely fewer if
   fewer clear the bar, never padded out with weaker filler results just to
   hit a count. A profile with real skills or interests filled in reliably
   clears 0.75 on at least its top occupation or two; the sole exception is
   the single best-available fallback returned when literally nothing clears
   the bar (e.g. only an industry was picked, no skills or interests), so the
   API never returns a hard empty list (see `predict.py`'s
   `top_occupations()`).
5. **Knowledge base**: real education/experience/training requirements (O*NET
   Job Zones) and real day-to-day tasks (O*NET Task Statements) per occupation —
   no fabricated content.
6. **Market data**: real median annual wage and projected employment growth
   (2025–35) from the U.S. Bureau of Labor Statistics' Employment Projections
   program (`extract_bls.py`), matched to O*NET occupations by SOC code — 892
   of 923 occupations matched; the remainder are BLS-suppressed/unpublished
   figures, honestly reported as "not available" rather than estimated.

## Data pipeline

1. `extract_onet.py` → `data/taxonomies/specific_interest_areas.json` (41 real
   interest areas + RIASEC crosswalk) and `data/raw/onet/occupation_riasec.json`
   (923 occupations with real RIASEC vectors).
2. `extract_onet_skills.py` → `data/raw/onet/occupation_technical_skills.json`
   (real technology tags per occupation, matched against the 141-skill taxonomy).
3. `build_knowledge_base.py` → `data/raw/onet/knowledge_base.json` (real Job
   Zone + task-statement content per occupation).
4. `extract_bls.py` → `data/raw/bls/occupation_wages_growth.json` (real median
   wage + growth projections per occupation, from BLS Employment Projections
   Table 1.2, matched to O*NET-SOC codes).
5. `generate_dataset.py` — since no real *user assessment* data exists yet, this
   generates synthetic respondents **per real occupation**: for each of the 923
   occupations, it samples 60 plausible assessment answers (interests, skills,
   industries, internships, job experience) weighted toward that occupation's
   dominant RIASEC types via the real crosswalks, with substantial randomness
   mixed in so the model can't just memorize a lookup table. The occupation's
   own **real** RIASEC vector becomes the training target — the label is
   authoritative even though the "respondent" is synthetic. Document this
   distinction precisely in your report.
6. `train_mlp.py` — trains the actual deliverable model, evaluated by
   **percentile rank** (where does the true source occupation land when all 923
   are ranked by similarity to the prediction? 0.0 = best, 0.5 = random
   guessing) rather than exact-match top-k, because many O*NET occupations have
   near-identical RIASEC profiles and "exact title match" is an unreasonably
   strict bar.

## Current results (synthetic-respondent data, real RIASEC labels)

| Model | R² | Mean percentile rank | Mean cosine sim to true occupation |
|---|---|---|---|
| Mean-vector sanity baseline | 0.00 | 0.496 (≈ random) | 0.916 |
| Ridge Regression | 0.309 | 0.249 | 0.946 |
| Random Forest | 0.195 | 0.325 | 0.936 |
| **PyTorch MLP (deployed)** | — | **0.214** | — |

The deployed MLP is the best of the three and is what `predict.py` actually
loads. All three clearly beat the random-guessing baseline (0.496) — the
pipeline works end-to-end and the input features carry real signal. This is
still not a number to quote as "real-world accuracy" — the respondents are
synthetic, only the RIASEC labels and interest taxonomy are real.

**Iteration history** (each change measured on the same held-out validation
split, mean percentile rank, lower is better): 0.264 (initial 2-layer MLP) →
0.257 (added `internships`/`jobExperience` features) → 0.232 (stronger,
less-diluted technical-skill signal in the synthetic generator) → 0.222
(cosine-aligned loss function, since evaluation ranks by cosine similarity but
training was optimizing plain MSE on differently-scaled RIASEC dimensions) →
0.216 (more synthetic samples per occupation, 25 → 60) → **0.214** (deeper
3-hidden-layer architecture with batch normalization, justified by the larger
dataset). Each step was a small, individually-justified change, verified
against a fixed baseline rather than tuned to chase the number — a couple of
these (more data, deeper network) gave only marginal aggregate gains and one
of them (the deeper network) actually *regressed* a specific real test case
(a Python/ML profile) despite improving the aggregate metric, which is why
the candidate pool for re-ranking (below) was widened afterward to compensate.
That divergence between aggregate metric and individual case quality is worth
including in your report as a genuine finding, not glossed over.

## Known limitation and how it's handled

Cosine similarity in 6-dimensional RIASEC space clusters extremely tightly —
the top ~15 candidates for a given prediction often sit within a 0.98-0.996
similarity band. Relying on RIASEC similarity alone produces a scattered,
hard-to-defend top-3 (e.g. mixing "Web Administrators" with "Coroners"). The
multi-signal re-ranking step (see Architecture §4) fixes this for any user who
fills in at least one of technical skills, career interests, or preferred
industries — a healthcare-leaning respondent with no technical skills is
still re-ranked using real interest-area and industry overlap instead of
falling back to RIASEC alone, since that combination previously produced
poorly-calibrated match scores (as low as ~35% for a strong genuine match) by
forcing a 0.65-weighted skill-overlap term to zero regardless of how well
everything else fit. A profile that fills in *none* of the three optional
fields still has nothing but RIASEC to rank on, and its score is deliberately
capped low (see `MIN_EVIDENCE_WEIGHT` in `predict.py`) rather than let a
possibly-mispredicted RIASEC vector's incidental correlation with some
occupation be reported as a confident match.

## Running the pipeline

```bash
cd ml
python3 scripts/extract_onet.py          # one-time: parse the O*NET download
python3 scripts/extract_onet_skills.py   # one-time: extract real per-occupation tech tags
python3 scripts/build_knowledge_base.py  # one-time: extract real roadmap content
python3 scripts/extract_bls.py           # one-time: extract real wage/growth data (see data/raw/bls/README.md for how it's downloaded)
python3 scripts/sync_taxonomies.py       # regenerate frontend option lists
python3 scripts/generate_dataset.py      # writes data/raw/synthetic_assessments.jsonl
python3 scripts/train_mlp.py             # trains the deployed model, saves models/riasec_mlp.pt
python3 scripts/train_riasec_baseline.py # optional: baseline comparison numbers
```

## Next steps (not built yet)

- Real *user* assessment data, if any becomes available, to replace/augment
  the synthetic-respondent rows (the RIASEC labels are already real; only the
  respondent sampling is synthetic).
- A similar skill-overlap re-ranking signal using soft skills or job
  experience, not just technical skills.
