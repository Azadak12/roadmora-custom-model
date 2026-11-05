# 4.5 AI Model Training and Evaluation

This section presents the dataset preparation, training methodology, evaluation results, and final comparison of the AI experiments conducted for Roadmora AI.

## 4.5.1 Dataset Preparation

The O*NET 31.0 database published by the U.S. Department of Labor was used as the source dataset for the Roadmora AI career-recommendation task, together with employment and wage projections published by the U.S. Bureau of Labor Statistics (BLS). Nine hundred and twenty-three (923) real occupations were selected, each carrying its official RIASEC profile across six career-interest dimensions: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.

Because no real user-assessment responses existed before deployment, the training rows were generated per occupation. For each of the 923 occupations, sixty plausible assessment responses were sampled using the real O*NET interest-area crosswalk, weighted toward the RIASEC types on which that occupation scores highest, with controlled randomness applied to interests, technical skills, preferred industries, internships, and job experience so that the model could not memorise a fixed lookup table. The occupation's own real RIASEC vector was used as the training label. The respondents are therefore synthetic, while every supervision label is authoritative government data; this distinction is stated explicitly rather than presented as collected user data.

**Table 9: Dataset**

| Dataset Stage | Rows | Occupations | Respondents per Occupation |
|---|---|---|---|
| Generated dataset | 55,380 | 923 | 60 |
| Training split (85%) | 47,073 | 923 | — |
| Validation split (15%) | 8,307 | 923 | — |

Each assessment response is converted into a fixed-length numeric vector by the feature-encoding component shared with the production backend. Single-select fields (education level and current status) are one-hot encoded, while multi-select fields (technical skills, soft skills, languages, career interests, preferred industries, internship domains, and job experience) are multi-hot encoded. The concatenated input vector contains 376 dimensions and the output layer produces the 6 RIASEC dimensions. The dataset was divided into an 85% training and 15% validation split using a fixed random seed so that every reported result is reproducible.

## 4.5.2 Model 03 – RIASEC Multi-Layer Perceptron with Batch Normalization

For the final reporting structure, the experiment originally recorded as the sixth training iteration is treated as Model 03 and is reported under the name RIASEC Multi-Layer Perceptron (MLP) with Batch Normalization. The experiment achieved the best validation ranking performance among the recorded experiments, a mean percentile rank of 0.214. The model is a feed-forward neural network implemented in PyTorch with three hidden layers, batch normalization, and dropout regularisation. All weights are randomly initialised; no pretrained checkpoint, external language model, or third-party AI service is used at any stage of the pipeline.

**Table 10: Parameter**

| Parameter | Value |
|---|---|
| Input | 376-dimensional encoded assessment vector |
| Reported Model Name | RIASEC MLP with Batch Normalization |
| Architecture | 376 → 256 → 128 → 64 → 6 |
| Normalization | BatchNorm1d after each hidden layer |
| Activation | ReLU |
| Dropout | 0.2 / 0.15 / 0.1 |
| Output Classes (dimensions) | 6 (RIASEC) |
| Batch Size | 64 |
| Optimizer | Adam, learning rate 0.001, weight decay 0.00001 |
| Learning-Rate Schedule | ReduceLROnPlateau (halved after 8 epochs without improvement) |
| Loss | 0.2 × MSE + 0.8 × (1 − cosine similarity) |
| Early Stopping | 30 epochs patience (maximum 400 epochs) |
| Training Device | CPU |
| Best Epoch | 35 (early-stopped run) |
| Best Mean Percentile Rank | 0.213 (reproduction run); 0.214 recorded project best |

The loss function is a weighted blend of mean squared error and cosine-similarity loss. This combination was selected deliberately: the evaluation metric ranks occupations by cosine similarity, and the six RIASEC dimensions have very different variances across occupations, so plain MSE would cause the model to concentrate on the high-variance dimensions rather than on the ranking objective. The cosine term directs the predicted vector toward the correct orientation, while the smaller MSE term prevents the output magnitude from collapsing toward zero.

The primary evaluation metric is the mean percentile rank. For each validation example, the predicted RIASEC vector is compared by cosine similarity against all 923 real O*NET occupation profiles, the occupations are ranked, and the position of the true occupation within that ranking is recorded. A percentile rank of 0.0 indicates that the true occupation was ranked first, 0.5 corresponds to random guessing, and 1.0 is the worst possible result. This metric was selected instead of exact-match classification accuracy because a large number of real occupations have near-identical RIASEC profiles, which makes an exact top-one match an unreasonably strict target; the percentile rank instead measures whether the model consistently places the correct occupation near the top of a 923-way ranking.

**Table 11: Validation Performance of the RIASEC MLP**

| Epoch | Train MSE | Mean Percentile Rank | Top-1 Acc. | Top-5 Acc. | Weighted F1 |
|---|---|---|---|---|---|
| 0 | 2.7458 | 0.227 | 0.006 | 0.026 | 0.002 |
| 10 | 1.2481 | 0.218 | 0.006 | 0.033 | 0.003 |
| 20 | 1.0285 | 0.224 | 0.005 | 0.036 | 0.003 |
| 30 | 0.9467 | 0.229 | 0.007 | 0.036 | 0.004 |
| Best checkpoint | — | 0.213 | 0.007 | 0.033 | 0.002 |

Training stopped early at epoch 35 after thirty epochs without improvement in the validation percentile rank, and the best-performing checkpoint was restored. A mean percentile rank of approximately 0.21 indicates that, on average, the model places the true occupation within the top 21% of all 923 occupations using only a person's assessment answers, which is clearly and consistently better than the 0.5 that random guessing would produce. The saved deployed checkpoint, trained over 40 recorded epochs on the original development machine, reached a best value of 0.202 at epoch 9; the documented project figure of 0.214 and the notebook reproduction value of 0.213 fall within the expected run-to-run variation caused by different hardware and library versions.

The top-1 accuracy, top-5 accuracy, and weighted F1-score are reported as supplementary metrics because they treat the task as a 923-way classification problem, which is a considerably stricter view than the ranking objective the model is optimised for. Random guessing over 923 classes would produce a top-1 accuracy of approximately 0.001, so the recorded value remains well above chance. The weighted F1-score is calculated over roughly nine validation examples per class and is therefore an inherently noisy measure; it is included for completeness and not treated as the headline result.

### 4.5.2.1 Baseline Model Preparation and Training

Three baseline experiments were conducted using scikit-learn to establish whether the encoded assessment features carry real predictive signal and to provide a measurable comparison for the deployed network. A mean-vector sanity baseline was used as a lower bound, in which the average RIASEC vector of the training set is predicted for every input. A Ridge Regression model and a Random Forest Regressor were then trained on the same encoded features, the same labels, and the same held-out validation split used by the neural network, so that all results remain directly comparable.

**Table 12: Parameter and Results of the Baseline Models**

| Model | Type | R² | Mean Percentile Rank | Mean Cosine Similarity |
|---|---|---|---|---|
| Mean-vector sanity baseline | Constant predictor | 0.000 | 0.496 (≈ random) | 0.916 |
| Ridge Regression | Linear regression | 0.309 | 0.249 | 0.946 |
| Random Forest | Ensemble of regression trees | 0.195 | 0.325 | 0.936 |

All three trained baselines clearly outperform the random-guessing level of 0.496, which confirms that the pipeline operates correctly end to end and that the encoded assessment features contain genuine signal. Ridge Regression produced the stronger of the two learned baselines at 0.249, while the Random Forest regressor reached 0.325. Both remained behind the RIASEC MLP, which recorded 0.214 on the same validation split.

The experiments were carried out as a sequence of individually justified changes, each measured against a fixed baseline rather than tuned to chase a single number. The recorded iteration history, measured as mean percentile rank on the same held-out validation split where a lower value is better, is as follows.

**Table 13: Iteration History of the RIASEC Model**

| Iteration | Change Introduced | Mean Percentile Rank |
|---|---|---|
| 1 | Initial two-layer MLP | 0.264 |
| 2 | Added internship and job-experience features | 0.257 |
| 3 | Stronger, less-diluted technical-skill signal in the data generator | 0.232 |
| 4 | Cosine-aligned loss function | 0.222 |
| 5 | Increased synthetic samples per occupation (25 → 60) | 0.216 |
| 6 | Three hidden layers with batch normalization (Model 03) | 0.214 |

One finding from this process is reported explicitly rather than omitted: the deeper architecture improved the aggregate validation metric but regressed one specific real test case, a programming and machine-learning oriented profile. The candidate pool used by the subsequent re-ranking stage was therefore widened to compensate. This divergence between an aggregate metric and individual case quality is recorded as a genuine experimental observation.

### 4.5.2.2 Baseline Integration Decision

Although the Ridge Regression baseline achieved a reasonable ranking result, it was not adopted as the production model in the final Roadmora AI pipeline. The RIASEC MLP produced a better mean percentile rank on the same validation split, and the trained PyTorch checkpoint is the model that the inference script loads at runtime. Retaining two independent predictors in production would duplicate functionality and introduce additional model-loading, dependency, and runtime requirements without improving recommendation quality. The baseline models and their recorded metrics were therefore retained as documented experimental artifacts for comparison purposes, while the deployed inference path was kept unchanged. The saved baseline checkpoints remain available in the project's model directory and can be re-evaluated in future work if system requirements change.

It is also noted that the RIASEC prediction stage is only the first stage of the deployed pipeline. The predicted RIASEC vector is compared against all 923 real O*NET occupations by cosine similarity to produce a candidate pool, which is then re-ranked using real O*NET technology-skill tags, interest areas, and preferred-industry overlap, so that the final shortlist is both interest-plausible and concretely relevant to the skills the user actually selected. Salary and growth figures are taken from real BLS data and roadmap content from real O*NET education, experience, and task data; no part of the output is generated by a language model.

### 4.5.2.3 Relationship with the Base Paper

The base paper, a machine-learning-based career-recommendation system, provides a relevant reference architecture for Roadmora AI because it applies supervised learning to academic and behavioural attributes in order to recommend careers, and it evaluates several classical algorithms on the same task. The reported results of that study are a Decision Tree accuracy of 0.82 with a macro F1-score of 0.80, a Random Forest (n = 100) accuracy of 0.86 with a macro F1-score of 0.84, a K-Nearest Neighbors (k = 5) accuracy of 0.78 with a macro F1-score of 0.76, and a Support Vector Machine with an RBF kernel reaching an accuracy of 0.83 with a macro F1-score of 0.81. The study concludes that tree-based ensembles such as Random Forest offer the best trade-off between predictive accuracy and interpretability on small curated datasets.

Roadmora AI adopts the same general direction of supervised learning over an encoded profile of a user's skills, interests, education, and experience, while extending the investigation in two ways. First, the label space is not a small curated set of career classes but the full set of 923 real O*NET occupations, with authoritative Department of Labor RIASEC profiles used as the supervision signal. Second, the task is formulated as vector regression followed by ranking rather than direct multi-class classification, because occupations at this level of granularity overlap heavily and a single-label decision is not an appropriate output for the product, which presents a ranked shortlist. The Roadmora AI experiments therefore extend the model investigation beyond the classical classification approach used in the base paper.

It must be stated clearly that the accuracy figures reported in the base paper and the ranking figures reported for Roadmora AI are not measured on the same task, the same dataset, or the same metric. The base-paper accuracies describe multi-class classification over a small curated career dataset, while the Roadmora AI figures describe the position of the correct occupation within a 923-way ranking. The comparison below is therefore presented as a record of the reported results of each approach, not as a like-for-like accuracy competition.

# 4.6 Final Four-Model Comparison

The final comparison contains four reported results. The base paper is represented by the best reported testing accuracy among its evaluated algorithms, while the Roadmora AI models are represented by their best recorded validation ranking performance on the same held-out split, where a lower mean percentile rank indicates better performance and 0.496 corresponds to random guessing.

**Table 14: Comparison of Four Models**

| Model | Architecture | Representation | Metric | Result |
|---|---|---|---|---|
| Base Paper (Random Forest, n = 100) | Ensemble of decision trees | Academic and behavioural attributes | Reported Testing Accuracy | 86.00% |
| Roadmora AI Model 03 | MLP 376 → 256 → 128 → 64 → 6 | RIASEC vector regression with BatchNorm and dropout | Best Mean Percentile Rank | 0.214 |
| Roadmora AI Ridge Regression | Linear regression baseline | RIASEC vector regression | Best Mean Percentile Rank | 0.249 |
| Roadmora AI Random Forest | Ensemble of regression trees | RIASEC vector regression | Best Mean Percentile Rank | 0.325 |

**Figure 22: Final four-model comparison**

*(Suggested chart: a bar chart of the three Roadmora AI models' mean percentile rank with a dashed reference line at 0.496 marked "random guessing", captioned "Base paper: reported testing accuracy on a separate dataset | Roadmora AI: best validation mean percentile rank, lower is better".)*

Among the three Roadmora AI experiments, Model 03 recorded the best ranking performance at 0.214, followed by Ridge Regression at 0.249 and the Random Forest regressor at 0.325. All three improve substantially on the random-guessing level of 0.496, confirming that the encoded assessment features carry genuine predictive signal and that the trained network adds measurable value over the simpler baselines. The base-paper result is included for reference, with the reminder stated in Section 4.5.2.3 that it was obtained on a different dataset, a smaller label space, and a different evaluation metric, and is therefore not directly comparable with the ranking figures reported here.
