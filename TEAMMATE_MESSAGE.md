Hey — quick but important update before you go further on the documentation. We made a major architecture change to Roadmora AI, and it affects almost every chapter of the doc, so wanted to explain the full picture before you keep editing.

## What we were doing

The AI part of the system used to work like this: the backend collected the assessment answers, forwarded them to **n8n** (a workflow automation tool), which called an **LLM (GPT-4/OpenAI)** with a prompt, and the LLM generated the career recommendation, market analysis, and roadmap as JSON text. All of the doc's current chapters (Requirements, System Design, Testing, Tools & Technologies, Conclusion, References, Appendix B) describe this n8n + LLM pipeline.

## What we're doing now

Our supervisor's requirement was explicit: **no external LLM or API — we have to train and build our own model.** So we replaced the whole n8n + GPT-4 pipeline with:

1. **Real government data, not an LLM.** We downloaded the actual O*NET 31.0 database (U.S. Dept. of Labor — 923 real occupations, each with a real 6-dimensional interest profile based on Holland's RIASEC theory), plus real BLS wage/growth projection data.
2. **A model we trained ourselves.** A PyTorch neural network, trained from scratch (random weight initialization, no pretrained weights, no API calls), that takes the assessment answers and predicts a 6-dimensional interest score.
3. **Real occupation matching.** That predicted score gets compared against all 923 real occupations' real interest profiles to rank the best career matches — same core idea as the actual O*NET Interest Profiler tool.
4. **Real content everywhere.** Market analysis (salary, growth) now comes from real BLS data, and the roadmap steps come from real O*NET education/task data — nothing is LLM-generated or made up.

n8n is completely gone from the system. There is no OpenAI/GPT/LLM call anywhere anymore.

## What needs to change in the doc

This touches nearly every chapter — here's the full list:

**Chapter 1 (Introduction)**
- §1.3 Constraints: remove the line about depending on "the underlying language model and prompt design."
- §1.4 Out-of-Scope: it currently lists *"Training a custom AI model from scratch"* as **out of scope** — that's now literally our main deliverable, so this needs to flip to in-scope. Also update the in-scope bullet that says the recommendation happens "via an n8n workflow."
- §1.5.3: change "FastAPI/Supabase/n8n integration" → "FastAPI/Supabase/PyTorch model" or similar.

**Chapter 2 (Requirement Analysis)**
- §2.1 Literature Review: needs new content about O*NET, Holland's RIASEC theory, and why we use real-data matching instead of an LLM prompt. I'll send you paragraph-level content for this if needed.
- §2.3/§2.4/§2.5 (FR3 and the RTM table): change "n8n workflow + AI model" → "PyTorch RIASEC model + O*NET occupation matching."
- §2.7 Agile justification: currently framed around "tuning the n8n prompt" — reframe around iterating on model training instead (we have a real iteration log with actual numbers if you want to use it).

**Chapter 3 (System Design)**
- All diagram descriptions (Activity, Sequence, Collaboration, DFD, Block Diagram) mention "n8n + AI workflow" — need to change to reflect: Assessment → Feature Encoding → PyTorch Model → Occupation Ranking → Knowledge Base. The diagrams themselves probably need redrawing too.

**Chapter 4 (System Testing)**
- §4.1.3: "AI Engine Unreachable (n8n webhook down)" test case doesn't apply anymore — nothing external to be unreachable. Replace with something like "model file missing at startup."
- §4.1.5: market_analysis test cases assumed fields could randomly be missing from an LLM response — now salary/growth are populated for basically every occupation (real BLS data), so this test case logic changes.
- §4.3: "FastAPI → n8n" integration test → "FastAPI → PyTorch model / O*NET data."

**Chapter 6 (Conclusion)**
- §6.1 "AI Response Consistency" problem — this was about the LLM/n8n returning inconsistent JSON. Since that's gone, we need a different real problem here — I can give you one (we actually hit a subtle bug where our first model looked 99.9% accurate, which turned out to be a red flag/data leak, not a good result — good story for this section).
- §6.2 Lessons Learned — currently about prompt tuning, needs replacing.
- §6.3 Project Summary — explicitly mentions n8n, needs full rewrite.
- §6.4 Future Work — item 3 says "connect market analysis to a live labour data source" — **this is done now**, move it out of Future Work into the summary as delivered.

**Chapter 7 (Timeline)** — Gantt task "Backend Setup (n8n + API)" needs renaming.

**Chapter 8 (Tools and Technologies)**
- Remove n8n entirely.
- Add: PyTorch, scikit-learn, pandas, NumPy.
- §8.4 AI Integration needs a full rewrite — no more "LLM orchestrated through n8n."

**Chapter 9 (References)** — see the updated list below, several old ones need removing.

**Appendix B (Source Code)** — B.1 shows the old n8n-calling backend code, needs replacing with the actual current endpoint code.

---

## Updated references — what to remove, what to add, and where to cite each

### Remove these two — they now contradict our "no external LLM" claim
- ~~[12] Vaswani et al., "Attention Is All You Need"~~
- ~~[13] OpenAI, "GPT-4 Technical Report"~~

### Remove this one — tool no longer used
- ~~[19] n8n, Official Documentation~~

### Add these new ones

**O*NET Database** — National Center for O*NET Development, *O\*NET 31.0 Database*, U.S. Dept. of Labor. https://www.onetcenter.org/database.html
→ Cite in Methodology/Dataset section and Literature Review, wherever we describe where our occupation and interest data comes from.

**Holland's RIASEC theory** — Holland, J. L. (1997). *Making Vocational Choices: A Theory of Vocational Personalities and Work Environments* (3rd ed.). Psychological Assessment Resources.
→ Cite right where we explain why the model predicts a 6-dimensional interest vector (Realistic/Investigative/Artistic/Social/Enterprising/Conventional).

**PyTorch** — Paszke, A. et al. (2019). "PyTorch: An Imperative Style, High-Performance Deep Learning Library." *NeurIPS 32*, 8024–8035. https://arxiv.org/abs/1912.01703
→ Cite in Tools & Technologies, wherever we name the framework the model is built in.

**scikit-learn** — Pedregosa, F. et al. (2011). "Scikit-learn: Machine Learning in Python." *JMLR*, 12, 2825–2830. https://www.jmlr.org/papers/volume12/pedregosa11a/pedregosa11a.pdf
→ Cite in Tools & Technologies, next to baseline models / cosine similarity mentions.

**Adam optimizer** — Kingma, D. P., & Ba, J. (2015). "Adam: A Method for Stochastic Optimization." *ICLR 2015*. https://arxiv.org/abs/1412.6980
→ Cite in Methodology, at the sentence naming the optimizer used to train the model.

**Dropout** — Srivastava, N. et al. (2014). "Dropout: A Simple Way to Prevent Neural Networks from Overfitting." *JMLR*, 15(56), 1929–1958.
→ Cite in Methodology, at the sentence about the dropout regularization layers.

**Batch Normalization** — Ioffe, S., & Szegedy, C. (2015). "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift." *ICML 2015*, PMLR 37, 448–456.
→ Cite in Methodology, at the sentence about batch normalization in the model architecture.

**pandas** — McKinney, W. (2010). "Data Structures for Statistical Computing in Python." *Proc. 9th Python in Science Conf.*, 56–61.
→ Cite in Tools & Technologies, wherever we mention processing the O*NET/BLS data files.

**NumPy** — Harris, C. R. et al. (2020). "Array Programming with NumPy." *Nature*, 585, 357–362.
→ Cite in Tools & Technologies, next to feature encoding.

**U.S. Bureau of Labor Statistics** — already in our list as [6] (Occupational Outlook Handbook), but now we should ALSO cite it specifically as: *Occupational Employment Projections, 2025–35.* https://www.bls.gov/emp/tables.htm
→ Cite in the Market Analysis section, since this is now actually integrated (real salary/growth data), not just referenced as background.

### Keep these unchanged — still fully relevant
- [1] World Economic Forum, Future of Jobs Report 2023 — Introduction motivation
- [2] OECD, Career Guidance for Adults report — Introduction motivation
- [3] Ricci, Rokach, Shapira, Recommender Systems Handbook — Literature Review (our system IS a recommender system, ranking by similarity)
- [4] McKinsey, Defining the Skills report — Introduction motivation
- [5] Pressman & Maxim, Software Engineering textbook — Methodology/SDLC section
- [7] LinkedIn Talent Solutions — Introduction motivation (double check this one's exact title, it was a bit of a paraphrase originally)
- [8][9][10][11] the four IEEE career-recommendation papers — Literature Review, framed as "prior systems predicted one category; ours ranks real occupations by similarity instead"
- [14] Holland's RIASEC (already listed — good, just make sure it's actually cited inline somewhere, not just in the list)
- [15] OWASP Top 10 — Non-functional requirements/security section
- [16][17][18] FastAPI, React, Supabase docs — Tools & Technologies
- [20] PostgreSQL docs — Tools & Technologies
- [21] ISO/IEC 25010 — Non-functional requirements section
- [22] IEEE ML-based career recommendation paper — Literature Review

Let me know which sections you want to tackle first and I can send over actual replacement paragraphs for anything — especially the Literature Review and Chapter 6 Conclusion, since those need the most substantial rewriting rather than just find-and-replace.
