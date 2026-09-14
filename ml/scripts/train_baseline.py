"""
Baseline classifiers for career-cluster prediction: majority-class,
logistic regression, and random forest. Run this before the neural net
(train_mlp.py) — it's the "number to beat" and gives feature-importance
output that's easy to explain in your report/defense.

Run:
    cd ml && python3 scripts/train_baseline.py
"""

import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder

from features import CAREER_CLUSTERS, encode_row, feature_names

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "raw" / "synthetic_assessments.jsonl"
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"


def load_dataset():
    rows, labels = [], []
    with open(DATA_PATH) as f:
        for line in f:
            row = json.loads(line)
            labels.append(row.pop("label"))
            rows.append(row)
    X = np.stack([encode_row(r) for r in rows])
    y = np.array(labels)
    return X, y


def main():
    X, y = load_dataset()
    print(f"Dataset: {X.shape[0]} rows, {X.shape[1]} features, {len(set(y))} classes")

    le = LabelEncoder()
    le.fit(CAREER_CLUSTERS)
    y_enc = le.transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.15, stratify=y_enc, random_state=42
    )

    print("\n=== Majority-class baseline ===")
    dummy = DummyClassifier(strategy="most_frequent")
    dummy.fit(X_train, y_train)
    print(f"Test accuracy: {dummy.score(X_test, y_test):.3f}")

    print("\n=== Logistic Regression ===")
    logreg = LogisticRegression(max_iter=1000, multi_class="multinomial")
    logreg.fit(X_train, y_train)
    logreg_acc = logreg.score(X_test, y_test)
    print(f"Test accuracy: {logreg_acc:.3f}")
    cv_scores = cross_val_score(logreg, X, y_enc, cv=5)
    print(f"5-fold CV accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")

    print("\n=== Random Forest ===")
    rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42)
    rf.fit(X_train, y_train)
    rf_acc = rf.score(X_test, y_test)
    print(f"Test accuracy: {rf_acc:.3f}")
    cv_scores = cross_val_score(rf, X, y_enc, cv=5)
    print(f"5-fold CV accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")

    y_pred = rf.predict(X_test)
    print("\n=== Random Forest classification report (test set) ===")
    print(classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))

    print("=== Top 15 most important features (Random Forest) ===")
    names = feature_names()
    importances = sorted(zip(names, rf.feature_importances_), key=lambda x: -x[1])[:15]
    for name, imp in importances:
        print(f"  {imp:.4f}  {name}")

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(rf, MODEL_DIR / "baseline_random_forest.joblib")
    joblib.dump(le, MODEL_DIR / "label_encoder.joblib")
    cm = confusion_matrix(y_test, y_pred)
    np.save(MODEL_DIR / "baseline_confusion_matrix.npy", cm)
    print(f"\nSaved model + label encoder + confusion matrix to {MODEL_DIR}")


if __name__ == "__main__":
    main()
