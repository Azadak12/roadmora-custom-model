# Defense Prep — Model Training Q&A

Practice these out loud. The honest, specific answer is always stronger than a
polished but vague one — examiners can tell the difference immediately.

---

### "How did you train the model?"

"We trained a feed-forward neural network in PyTorch, from scratch — random
weight initialization, no pretrained weights, no external API. It takes the
assessment answers (skills, interests, languages, industries, experience) as
input and predicts a 6-dimensional RIASEC score — Realistic, Investigative,
Artistic, Social, Enterprising, Conventional. That's the same interest model
real career-interest inventories use, based on Holland's theory of vocational
personalities.

We used Adam as the optimizer, with dropout and batch normalization for
regularization, and a loss function that combines MSE with cosine similarity
— because our evaluation ranks occupations by cosine similarity, so we wanted
the training objective to match that directly instead of optimizing something
slightly different."

### "Where did your training data come from?"

"This is the part we're most careful to be precise about, because it's a
mix of real and synthetic.

The **labels are real**: we downloaded the O*NET 31.0 database — the U.S.
Department of Labor's public occupational database — which has genuine
RIASEC interest scores for 923 real occupations, measured from actual
workforce data.

The **respondents are synthetic**: no real user has filled out this
assessment yet, so we generated synthetic training examples — for each of
the 923 real occupations, we sampled 60 plausible assessment answers weighted
toward that occupation's real dominant interest types (55,380 rows total,
923 × 60), with randomness mixed in so the model can't just memorize a
lookup table. The occupation's real RIASEC vector becomes the training
target for every synthetic respondent generated from it.

So: real labels, synthetic respondents. We say that explicitly rather than
implying we collected real user data, because we didn't — that's an honest
limitation, not something to hide."

### "How do you know the model actually works?"

"We evaluate with a percentile-rank metric: for each test example, we rank
all 923 real occupations by similarity to the model's prediction, and check
where the *true* source occupation lands. 0.0 would mean it's always ranked
first; 0.5 is what random guessing gives you. Our deployed model gets 0.214
— meaningfully better than random, on unseen validation data.

We didn't use plain accuracy because it's the wrong metric for this task —
we actually made that mistake early on with a differently-scoped version of
the model and got 99.9% accuracy, which was a red flag, not a good result —
it turned out the synthetic data had accidentally leaked the answer into one
of the input fields. We caught that, fixed the data generation, and re-ran
before trusting any number after that."

### "Why not just use ChatGPT or an LLM API?"

"That was the explicit requirement — no external LLM or API, build and train
our own model. Beyond just satisfying the requirement, it also means the
model's behavior is fully inspectable: we know exactly what data trained it,
we can see why it makes a given prediction, and there's no dependency on a
third-party service that could change its behavior, cost money per request,
or go down."

### "What's the actual accuracy?"

"We report percentile rank, not raw accuracy, because this isn't a
classification problem — it's a ranking-and-recommendation problem: given
923 real occupations that often have very similar interest profiles, 'exact
match to one specific job title' is an unreasonably strict bar even for a
perfect model. Our best model (the from-scratch neural network) gets a mean
percentile rank of 0.214, beating a random-guessing baseline of ~0.5 by a
wide margin, and beating two other baselines we built for comparison (Ridge
Regression at 0.249, Random Forest at 0.325).

We'd rather report an honest, harder-to-inflate metric than a number that
looks impressive but doesn't mean anything."

### "How do you turn the model's output into an actual career recommendation?"

"Two stages. First, the model predicts a 6-dimensional interest vector.
Second, we compare that vector against all 923 real occupations' real
interest profiles and take the top matches.

We found that stage two alone wasn't enough — RIASEC space is only 6
dimensions, so hundreds of unrelated occupations can score almost identically
similar, and because all 6 scores are positive, plain cosine similarity
barely discriminates at all: almost everything comes out above 95% similar
to almost anything. We fixed part of this by row-centering before computing
cosine similarity, which turns it into a Pearson correlation across the 6
dimensions — sensitive to each profile's *shape* (which traits are
relatively higher or lower) instead of just 'points in a similar direction
because all values are positive.'

We also added a second, independent real signal: we extracted actual
technology tool tags per occupation from O*NET's own data — which
occupations really use Python, React, Docker, etc. — and re-rank candidates
by overlap between the user's selected skills and that occupation's real
tags. Early on this had a bug we caught by manual testing: the overlap
formula normalized by the *smaller* of the two skill sets, so a user who
picked just one common skill (e.g. 'Microsoft Excel') got a perfect 100%
overlap against any occupation that merely listed Excel among dozens of
tags — 'Coroners' and 'Airline Pilots' were showing up as top matches for
completely unrelated reasons. We fixed it by scaling the overlap score by
how many skills actually matched, requiring several real matches before
it's trusted at full strength. That's what makes the final top-3 list
coherent instead of being hijacked by one incidental skill match."

### "What does the roadmap/market analysis content come from?"

"All real, no LLM-generated text. Education, experience, and training
requirements come from O*NET's Job Zone data. Day-to-day responsibilities
come from O*NET's real Task Statements for that occupation. Salary and
growth outlook come from the U.S. Bureau of Labor Statistics' Employment
Projections — matched to O*NET occupations by their shared 6-digit SOC code.
892 of the 923 O*NET occupations resolve to one of our 831 real BLS wage
records (several detailed O*NET codes share one 6-digit base SOC, so there
are fewer unique wage records than matched occupations); the remaining
occupations are honestly marked 'not available' because BLS itself didn't
publish a figure for those, rather than us guessing one."

### "What are the model's limitations?"

Be upfront about these — a panel respects a limitations section more than a
project that claims to have none:

1. **Synthetic respondents.** The training labels are real, but no actual
   user has taken this assessment yet. Real user data would likely reveal
   patterns our synthetic sampling didn't anticipate.
2. **RIASEC resolution limit.** Six dimensions can't perfectly separate 923
   occupations — some unrelated jobs will always look similar in that space.
   We mitigate this with the skill-overlap re-ranking, but it's a mitigation,
   not a complete fix, and it only helps when the user selects technical
   skills.
3. **Aggregate metrics can hide individual regressions.** We measured this
   directly during development — one architecture change improved the
   average percentile rank but made a specific real test case *worse*. We
   caught it by manually testing personas, not by trusting the aggregate
   number alone.
4. **Small evaluation set relative to real-world diversity.** Our validation
   split is drawn from the same synthetic generation process as training, so
   it validates the pipeline's internal consistency more than it validates
   real-world generalization.

### "Why does this architecture make sense for a final year project?"

"Given the constraint of building our own model rather than calling an LLM,
we needed something we could realistically train from scratch, evaluate
rigorously, and fully explain — not something that just runs, but something
where we can answer exactly why it does what it does. A small feed-forward
network on a well-defined, real, grounded interest taxonomy fits that: it's
genuinely from-scratch, it's fast enough to retrain and iterate on a laptop,
and every piece of data feeding it — labels, skill tags, wage data — traces
back to a real government source we can cite."

---

## If asked to demo the training live

```bash
cd /Users/abdulkalam/FYP-custom-model/ml
python3 scripts/train_mlp.py
```
Runs in under a minute, prints the loss curve and percentile-rank metric per
epoch live — a genuine, visible "watch it learn" moment.

## One-sentence answer if you only have 10 seconds

"We trained a PyTorch neural network from scratch to predict a real
psychological interest profile (RIASEC), then match it against 923 real
government-sourced occupations — no LLM, no external API, and every dataset
we used is a real, citable, public source."

---

# Defending against the base paper

Base paper: Mallick, Chakraborty, Sanyal, Brahma, Jagadev, Bhoi. "Machine
Learning-Based Career Recommendation System Using Academic and Behavioral
Analytics." 2026 International Conference on Emerging Systems and
Intelligent Computing (ESIC), Feb 2026. DOI: 10.1109/ESIC68176.2026.11495729.

**We have the full text**, not just the abstract, so every claim below is
verified against the actual Methodology/Results sections, not guessed.

What the base paper actually does, precisely:
- **Models**: Decision Tree, Random Forest, KNN, SVM — classical ML,
  compared against each other. No neural network, no deep learning.
- **Best result**: Random Forest, Accuracy 0.86 / Macro-F1 0.84 (Decision
  Tree 0.82/0.80, SVM 0.83/0.81, KNN 0.78/0.76).
- **Features**: academic stream (Science/Commerce/Arts), subject scores,
  hobbies/interests, working style, a self-reported personality label
  (introvert/extrovert/analytical/creative) — no RIASEC or other named
  psychological framework driving the feature set. They cite Holland's
  RIASEC in their references list [12] but don't use it in their model.
- **Label**: a small set of broad career categories (their own text example
  list: Engineering, Medicine, Business, Law, Design, Teaching, Data
  Science). Output is top-N categories ranked by predicted probability.
- **Occupation/wage data**: none. Their own Future Work section says O*NET
  integration is a *planned* future addition, confirming it isn't used now.
  No salary or growth data anywhere in the paper.
- **Stack**: Flask backend, React frontend, scikit-learn models. No LLM.
- **Dataset size**: not stated as a headline number, but the only concrete
  count shown (an education-level chart) sums to roughly ~195 records —
  small, and of unstated/unclear provenance (not shown to be from a real
  institution or a public dataset).

## Opening pitch — say this before anyone asks

Don't wait to be asked how you compare. Lead with this, confidently, in
this order — strongest, most concrete point first:

> "We picked this base paper because it tackles the same core problem we
> do — recommending a career from a student's profile using machine
> learning. We built on it in four concrete ways.
>
> **One — real, government-grounded data.** The base paper's dataset is
> small — about 195 records, and the paper doesn't say where they came
> from. Every piece of data in our system — the RIASEC interest profiles,
> the 923 occupations, the salary and growth numbers — comes from the
> real O*NET 31.0 database and U.S. Bureau of Labor Statistics, publicly
> documented and citable.
>
> **Two — a real theoretical foundation.** Their model predicts a career
> category from stream, subject scores, and a self-labeled personality
> type, with no named psychological framework behind it. Ours is built on
> Holland's RIASEC theory — an established model of vocational interests
> — so every prediction has a real conceptual grounding, not just
> pattern-matching.
>
> **Three — far finer-grained output.** Their system classifies into a
> handful of broad categories like 'Engineering' or 'Business.' We rank
> against 923 real, specific occupations — a materially harder and more
> useful recommendation problem, which is exactly why we don't use plain
> accuracy as our metric — at that resolution, it isn't a meaningful bar.
>
> **Four — a complete output, not just a label.** Their system returns a
> predicted category. Ours returns a ranked list of real occupations, each
> with real salary and growth data, a real education/task-based learning
> roadmap, and a persistent dashboard — a full career-guidance pipeline,
> not a single classification.
>
> And throughout, everything is reproducible: our data, our training
> pipeline, and our evaluation are all in a public notebook anyone can
> run."

Say this once, early, and you've pre-empted almost every comparison
question below — the Q&A section is there for follow-ups, not to replace
this opening.

### "The base paper also uses supervised learning on academic/behavioral data — how is yours actually different?"

"Four concrete differences:

**Scale and grounding of the label space.** They classify into a small,
example-style set of broad career categories on what looks like a
few-hundred-row dataset. We rank against 923 real O*NET occupations, each
with a government-measured interest profile — a materially harder and more
useful problem.

**Theoretical grounding.** They don't drive their model with a named
psychological framework — features are stream, subjects, hobbies, a
self-reported personality label. We use Holland's RIASEC explicitly: every
training label is a real, documented six-dimensional RIASEC score from
O*NET, not an arbitrary class.

**Market grounding.** They have no occupation or wage database — O*NET is
explicitly their *future work*, not something they built. Every result we
show — matched occupation, salary, growth outlook, education path — traces
to real O*NET or BLS data today, not a roadmap item.

**Model type.** They compare four classical algorithms (best: Random
Forest, 86% accuracy on their dataset). We trained a from-scratch PyTorch
neural network — a different, harder engineering exercise for an FYP scope,
evaluated with a metric suited to ranking rather than classification."

### "Their Random Forest got 86% accuracy — isn't that better than your 0.214?"

"Those numbers aren't comparable, and it's worth explaining exactly why
rather than dodging it. 86% accuracy is a *classification* metric over a
small set of broad categories (a handful of classes like 'Engineering' or
'Data Science') — with few classes, high accuracy is easier to reach. We
report *mean percentile rank* over 923 fine-grained real occupations,
where even a genuinely strong model can't hit 'accuracy' in that sense,
because dozens of real occupations legitimately share near-identical
interest profiles — getting the *exact* one right by classification
accuracy would be an unreasonably strict, almost meaningless bar at that
resolution. That's precisely why we didn't use plain accuracy: it would
either be undefined at our scale or misleadingly easy on a coarser one.
Our 0.214 mean percentile rank means the true occupation lands in roughly
the top fifth of 923 candidates on average — evaluated against two
baselines we built ourselves (Ridge 0.249, Random Forest 0.325) for a fair
internal comparison, which is the correct way to contextualize this metric,
not a cross-paper number that isn't measuring the same thing."

### "Isn't this just a reimplementation of their idea?"

"The problem framing is similar — that's expected, it's the same general
task. But nothing was copied: we never had their code or data. The actual
system differs in every layer — label space (923 real occupations vs. a
handful of broad categories), theory (RIASEC vs. none), data grounding
(real O*NET/BLS vs. none currently, per their own future-work section),
and model family (from-scratch neural network vs. classical scikit-learn
models)."
