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
4. **Coherence re-ranking**: RIASEC alone can't finely separate ~900 occupations —
   many unrelated jobs land at near-identical similarity (a Python/ML profile's
   top RIASEC matches included things like "Telecommunications Engineering
   Specialists" mixed with "Occupational Health and Safety Specialists"). To fix
   this, the top-120 candidates by RIASEC similarity are re-ranked using a second
   real signal: overlap between the user's selected technical skills and that
   occupation's real O*NET technology tags (`extract_onet_skills.py`, sourced
   from the "Software Skills" table — actual tool names like "Python", "React",
   "Docker" tagged per occupation), using the *overlap coefficient*
   (intersection / smaller-set size) rather than Jaccard — Jaccard drowns a
   perfect match under an occupation's full 60+ tool tag list (3/66 ≈ 0.05),
   while the overlap coefficient correctly scores "all 3 of your skills are
   used here" close to 1.0 regardless of how many other tools that occupation
   also uses. Final score = `0.35 * RIASEC similarity + 0.65 * skill overlap`
   when the user selected any technical skills, falling back to RIASEC alone
   otherwise (see `predict.py`'s `top_occupations()`). This is what makes the
   final top-3 thematically coherent instead of scattered.
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
skill-overlap re-ranking step (see Architecture §4) fixes this for users who
select technical skills; for profiles with no technical skills (e.g. a
healthcare-leaning respondent), RIASEC similarity alone still drives the
ranking, which is appropriate since interest-only careers don't have an
analogous "tool" signal to check against.

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
