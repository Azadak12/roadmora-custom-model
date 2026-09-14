# Replacing GPT-4/n8n with a Self-Trained Model — Implementation Plan

## 0. Critical first step: clarify scope with your supervisor

"No existing LLM or external API" can mean two very different things:

| Interpretation | What it allows | Feasibility for a student timeline |
|---|---|---|
| **A. No hosted/commercial API calls** (OpenAI, Anthropic, etc.) | You may download an open-weight model (e.g. DistilGPT2, TinyLlama) and fine-tune it locally — nothing ever leaves your machine | Realistic, higher-quality output |
| **B. Strictly from-scratch** — random weight initialization only, no pretrained weights of any kind | You train every parameter yourself from zero | Realistic only for a **classifier**, not a fluent text generator |

**Get this confirmed in writing before starting.** The plan below is built around Interpretation B (the strictest, safest reading) because it's guaranteed to satisfy either interpretation and is the more defensible academic claim ("we trained this model ourselves, nothing pretrained, nothing external").

## 1. Reframe the problem

Your current pipeline (n8n → OpenAI) actually produces three things per assessment:

1. **Career field prediction** — a label, e.g. "Data Analyst", "UX Designer"
2. **Market analysis** — demand / salary / growth for that career
3. **Learning roadmap** — steps and resources for that career

Only #1 needs to be "intelligent." #2 and #3 are **structured, factual, and reusable across every user who lands on the same career** — they don't need to be generated per request by a language model. They should live in a curated knowledge base, keyed by the predicted career field. This is not a shortcut — it's *more* defensible academically, because a supervisor can inspect every fact in the roadmap and market data instead of trusting an opaque generator.

So the system becomes:

```
User assessment answers
        ↓
[Your trained classifier]  ← the "AI" — this is what you build and train
        ↓
Predicted career field + confidence score
        ↓
[Curated knowledge base lookup]  ← market_analysis + learning_roadmap for that field
        ↓
Combined JSON response → same API contract your frontend already expects
```

## 2. Dataset collection and preparation

You need labeled data: **assessment answers → correct career field.**

**Primary source — O*NET (US Dept. of Labor, free, public domain):**
- https://www.onetcenter.org/database.html
- O*NET's **Interest Profiler** already maps RIASEC-style interest scores (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) to ~900 occupations — this is *exactly* the assessment-answers-to-career mapping you need, and it's a legitimately citable academic dataset.
- O*NET also publishes per-occupation Skills, Knowledge, Abilities, and Work Values tables — useful both as extra input features and as source material for your roadmap knowledge base.

**Supplementary sources:**
- Kaggle: search "career recommendation dataset," "student career prediction" — several exist with a few thousand labeled rows of interest/skill survey responses.
- U.S. Bureau of Labor Statistics (BLS) Occupational Outlook Handbook — median pay, projected growth %, and job outlook per occupation. Use this to populate the `market_analysis` knowledge base, not the model.

**Data augmentation (to get enough training rows):**
O*NET's ground-truth occupation-interest profiles can be sampled with added noise to synthetically generate thousands of realistic "assessment response" rows per career class. Document this clearly as "synthetic augmentation from O*NET ground-truth profiles" — this is a standard, citable technique, not a fabrication.

**Preparation steps:**
1. Map your existing assessment form's questions to RIASEC-style dimensions (you may need to add/rephrase a few questions so they align with O*NET's interest categories).
2. Encode categorical answers numerically (ordinal or one-hot).
3. If you keep any free-text answer (e.g., "what do you enjoy doing?"), keep it as a separate text feature — see architecture section below.
4. Clean, deduplicate, check class balance across career labels; if skewed, oversample minority classes or use class-weighted loss.
5. Split: 70% train / 15% validation / 15% test, stratified by career label.

## 3. Model architecture

Recommended: a **from-scratch PyTorch neural network**, not a transformer/LLM. This is genuinely a "model you trained," is fast to train on a laptop CPU, and is explainable.

**Baseline (build this first, always):**
- Logistic Regression or Random Forest (scikit-learn) on the encoded features.
- Purpose: gives you a number to beat, and feature-importance output that's easy to explain to your supervisor.

**Your actual model — a small feed-forward classifier (MLP):**
```
Input layer:      encoded RIASEC scores + demographic/skill features  (~20-50 dims)
Hidden layer 1:    Linear → ReLU → Dropout   (e.g. 64 units)
Hidden layer 2:    Linear → ReLU → Dropout   (e.g. 32 units)
Output layer:      Linear → Softmax over N career classes
```
Trained with cross-entropy loss, Adam optimizer, mini-batches, early stopping on validation loss.

**If you keep a free-text answer field**, add a second branch instead of using any pretrained language model:
- TF-IDF vectorization (scikit-learn) of the free-text answer — a classical, from-scratch NLP technique, no pretrained embeddings involved.
- Or train your own word embeddings via Word2Vec (gensim) on your own corpus, then feed averaged embeddings into a small feed-forward or BiLSTM layer.
- Concatenate this branch's output with the tabular branch before the final classification layer.

This hybrid (tabular + self-trained text features) gives you a genuinely custom architecture worth describing in your report, while staying fully within "no pretrained/external model" constraints.

## 4. Tools and frameworks

| Purpose | Tool |
|---|---|
| Model + training loop | PyTorch |
| Baselines / metrics | scikit-learn |
| Text features (no pretrained embeddings) | scikit-learn TF-IDF, or gensim Word2Vec trained on your own corpus |
| Data handling | pandas, numpy |
| Training environment | Jupyter notebook or Google Colab (free CPU is enough for this scale; free T4 GPU only needed if you go beyond an MLP) |
| Experiment tracking | matplotlib for loss/accuracy curves; a simple CSV log is enough — no need for heavyweight tooling |
| Serving | Your existing FastAPI backend — load the trained model with `torch.load()` at startup and run inference in-process |

**Hardware:** A normal laptop CPU is genuinely sufficient for this scale of model and dataset (thousands of rows, an MLP with a few thousand parameters). Training will take seconds to a few minutes per run. You do not need a GPU or cloud compute for this plan.

## 5. Evaluation

- **Metrics:** accuracy, macro-averaged precision/recall/F1 (macro because career classes may be imbalanced), confusion matrix.
- **Cross-validation:** k-fold (e.g. k=5) on the training set for a more robust reported number — expected for FYP rigor.
- **Baseline comparison table:** majority-class baseline vs. logistic regression vs. your MLP — shows the trained model adds measurable value, which is exactly what a defense panel wants to see.
- **Qualitative check:** run 5-10 realistic sample assessments through the model and sanity-check the predicted career against what a human would expect.
- **Explainability artifact:** feature-importance chart (from the Random Forest baseline) or a table of which input dimensions most influenced each career class — strong "demonstrate how it works" material.

## 6. Deployment

Replace the n8n/OpenAI call in `backend/main.py`'s `/api/assessment` route:

```python
# Before: forwards to n8n webhook → OpenAI
# After:
model = load_model_at_startup()          # torch.load(...) once, on app startup
knowledge_base = load_career_kb()        # JSON or DB table: career_field -> market_analysis + roadmap

@app.post("/api/assessment")
async def submit_assessment(payload: dict, user=Depends(get_current_user)):
    features = encode_assessment(payload)
    career_field, confidence = model.predict(features)
    result = {
        "career_field": career_field,
        "confidence": confidence,
        "market_analysis": knowledge_base[career_field]["market_analysis"],
        "learning_roadmap": knowledge_base[career_field]["learning_roadmap"],
    }
    supabase.table("results").insert({**result, "user_id": user.id}).execute()
    return result
```

Benefits beyond satisfying the requirement: this also permanently retires the Cloudflare-tunnel/n8n dependency that's been breaking every time your machine restarts — one less moving part in production.

The frontend needs **no changes** — same request/response shape, so `ProductsPage`/assessment UI, admin dashboard, etc. keep working untouched.

## 7. Documenting the training process for your supervisor

Produce these artifacts (this is what actually gets graded):

1. **A Jupyter notebook** showing the full pipeline top to bottom: load raw data → clean/encode → train/val/test split → train baseline → train your MLP → evaluate → save model file. This is your strongest proof that the model was genuinely trained by you.
2. **A short "Model Card" document**: architecture diagram, input feature list, output classes, dataset source and size, hyperparameters used, final metrics table, confusion matrix image, and known limitations.
3. **Loss/accuracy curve plots** (matplotlib) saved as figures for your report.
4. **A live retraining demo** you can run in front of your supervisor — a few epochs, watch the loss drop in real time. This single artifact does more to prove "we didn't just call an API" than anything else.
5. Add a new report chapter: "Custom Model Development" — replaces/supplements whatever the doc currently says about the n8n/AI architecture (see `RUN_LOCALLY.md`'s companion doc and your existing FYP Word doc's system architecture section).

## Suggested timeline (6–8 weeks)

| Week | Work |
|---|---|
| 1 | Get scope clarification from supervisor (Interpretation A vs B above). Download O*NET + BLS data, set up `ml/` folder and Python environment. |
| 2 | Clean data, encode features, exploratory data analysis, finalize train/val/test split. |
| 3 | Build and train baseline models (logistic regression, random forest). Record baseline metrics. |
| 4 | Build and train your PyTorch MLP (+ text branch if used). Tune hyperparameters. |
| 5 | Full evaluation: cross-validation, confusion matrix, ablation table, error analysis. Write the Model Card. |
| 6 | Build the career knowledge base (market data + roadmap templates per career field). Wire the trained model into FastAPI, replacing the n8n call. |
| 7 | End-to-end integration testing through the real frontend; retire n8n/Cloudflare tunnel; regression-test admin dashboard and auth flows. |
| 8 | Write the report chapter, prepare the live-retraining demo, polish, buffer for supervisor feedback. |

Compress or stretch this to match your actual defense date.
