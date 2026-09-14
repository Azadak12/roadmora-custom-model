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
the 923 real occupations, we sampled plausible assessment answers weighted
toward that occupation's real dominant interest types, with randomness mixed
in so the model can't just memorize a lookup table. The occupation's real
RIASEC vector becomes the training target.

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
Second, we compare that vector — cosine similarity — against all 923 real
occupations' real interest profiles, and take the top matches.

We found that stage two alone wasn't enough — RIASEC space is only 6
dimensions, so hundreds of unrelated occupations can score almost identically
similar. A user who selected Python and Machine Learning was getting
'Coroners' as a top match purely because it happened to share a similar
interest *shape*, not because it made sense. So we added a second real
signal: we extracted actual technology tool tags per occupation from O*NET's
own data — which occupations really use Python, React, Docker, etc. — and
re-rank candidates by overlap between the user's selected skills and that
occupation's real tags. That's what makes the final top-3 list coherent."

### "What does the roadmap/market analysis content come from?"

"All real, no LLM-generated text. Education, experience, and training
requirements come from O*NET's Job Zone data. Day-to-day responsibilities
come from O*NET's real Task Statements for that occupation. Salary and
growth outlook come from the U.S. Bureau of Labor Statistics' Employment
Projections — matched to O*NET occupations by their shared SOC code, with
892 of 923 occupations matched; the rest are honestly marked 'not available'
because BLS itself didn't publish a figure for those, rather than us
guessing one."

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
