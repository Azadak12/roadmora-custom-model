"""
Baseline regressor for the RIASEC-vector prediction task: given an
assessment, predict a 6-dim RIASEC score vector, then rank all 923 real
O*NET occupations by cosine similarity to find the best career matches.

The metric that matters here is NOT regression R^2 alone — it's top-k
retrieval accuracy: does the occupation the synthetic row was generated
from actually show up near the top when we rank all real occupations by
similarity to the model's prediction? That's the real task the deployed
system performs (rank careers, don't just output a number).

Run:
    cd ml && python3 scripts/train_riasec_baseline.py
"""

import json
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.metrics.pairwise import cosine_similarity
import joblib

from features import RIASEC_TYPES, encode_row

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
DATA_PATH = RAW_DIR / "synthetic_assessments.jsonl"
OCCUPATIONS_PATH = RAW_DIR / "onet" / "occupation_riasec.json"
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"


def load_dataset():
    rows, y, occ_codes = [], [], []
    with open(DATA_PATH) as f:
        for line in f:
            row = json.loads(line)
            riasec = row.pop("riasec_label")
            occ_codes.append(row.pop("onet_soc_code"))
            row.pop("occupation_title")
            y.append([riasec[t] for t in RIASEC_TYPES])
            rows.append(row)
    X = np.stack([encode_row(r) for r in rows])
    y = np.array(y, dtype=np.float32)
    return X, y, np.array(occ_codes)


def load_occupation_matrix():
    with open(OCCUPATIONS_PATH) as f:
        occupations = json.load(f)
    codes = [o["onet_soc_code"] for o in occupations]
    matrix = np.array([[o["riasec"][t] for t in RIASEC_TYPES] for o in occupations])
    return occupations, codes, matrix


def top_k_retrieval_accuracy(y_pred, true_codes, occ_codes, occ_matrix, k=10):
    """Strict metric: is the EXACT source occupation in the top-k? With ~900
    finely-grained, often-overlapping occupations this is a harsh bar — many
    occupations share near-identical RIASEC profiles, so use percentile_rank
    (below) as the primary metric and this as a secondary sanity check."""
    sims = cosine_similarity(y_pred, occ_matrix)
    hits = 0
    for i, true_code in enumerate(true_codes):
        top_k_idx = np.argsort(-sims[i])[:k]
        top_k_codes = {occ_codes[j] for j in top_k_idx}
        if true_code in top_k_codes:
            hits += 1
    return hits / len(true_codes)


def percentile_rank_metric(y_pred, true_codes, occ_codes, occ_matrix):
    """Primary metric: where does the TRUE source occupation land when all
    ~900 occupations are ranked by similarity to the prediction? 0.0 = ranked
    #1 (best possible), 0.5 = exactly what random guessing would give,
    1.0 = ranked last. Also reports mean direct cosine similarity between
    the prediction and the true occupation's own real RIASEC vector."""
    sims = cosine_similarity(y_pred, occ_matrix)
    code_to_idx = {c: i for i, c in enumerate(occ_codes)}
    ranks = []
    direct_sims = []
    for i, true_code in enumerate(true_codes):
        order = np.argsort(-sims[i])
        true_idx = code_to_idx[true_code]
        rank = int(np.where(order == true_idx)[0][0])
        ranks.append(rank / len(occ_codes))
        direct_sims.append(sims[i, true_idx])
    return {
        "mean_percentile_rank": float(np.mean(ranks)),
        "median_percentile_rank": float(np.median(ranks)),
        "mean_cosine_to_true_occupation": float(np.mean(direct_sims)),
    }


def main():
    X, y, occ_codes_per_row = load_dataset()
    print(f"Dataset: {X.shape[0]} rows, {X.shape[1]} input features, {y.shape[1]} RIASEC output dims")

    occupations, occ_codes, occ_matrix = load_occupation_matrix()
    print(f"Occupation knowledge base: {len(occupations)} real O*NET occupations")

    X_train, X_test, y_train, y_test, codes_train, codes_test = train_test_split(
        X, y, occ_codes_per_row, test_size=0.15, random_state=42
    )

    def report(name, pred):
        print(f"\n=== {name} ===")
        print(f"MAE per RIASEC dim: {mean_absolute_error(y_test, pred, multioutput='raw_values').round(3)}")
        print(f"R^2 (avg across dims): {r2_score(y_test, pred):.3f}")
        metrics = percentile_rank_metric(pred, codes_test, occ_codes, occ_matrix)
        print(f"Mean percentile rank of true occupation (0=best, 0.5=random, 1=worst): {metrics['mean_percentile_rank']:.3f}")
        print(f"Median percentile rank: {metrics['median_percentile_rank']:.3f}")
        print(f"Mean cosine similarity to true occupation's real RIASEC vector: {metrics['mean_cosine_to_true_occupation']:.3f}")
        for k in (10, 30):
            acc = top_k_retrieval_accuracy(pred, codes_test, occ_codes, occ_matrix, k=k)
            print(f"  (secondary, strict) exact-occupation top-{k} of {len(occ_codes)} accuracy: {acc:.3f}")

    ridge = Ridge(alpha=1.0)
    ridge.fit(X_train, y_train)
    report("Ridge Regression (linear baseline)", ridge.predict(X_test))

    rf = RandomForestRegressor(n_estimators=200, max_depth=14, random_state=42)
    rf.fit(X_train, y_train)
    report("Random Forest Regressor", rf.predict(X_test))

    mean_pred = np.tile(y_train.mean(axis=0), (len(y_test), 1))
    report("Sanity check: dataset-mean RIASEC vector for everyone", mean_pred)

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(rf, MODEL_DIR / "riasec_random_forest.joblib")
    print(f"\nSaved Random Forest regressor to {MODEL_DIR}")


if __name__ == "__main__":
    main()
