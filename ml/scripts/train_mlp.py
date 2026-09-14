"""
The actual "trained from scratch" deliverable: a small feed-forward neural
network (PyTorch, random weight initialization, no pretrained weights of any
kind) that predicts a 6-dim RIASEC vector from the assessment features.

Evaluated with the same percentile-rank metric as train_riasec_baseline.py
so the two are directly comparable in the report.

Run:
    cd ml && python3 scripts/train_mlp.py
"""

import json
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split

from features import RIASEC_TYPES, encode_row
from model_arch import RiasecMLP

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
DATA_PATH = RAW_DIR / "synthetic_assessments.jsonl"
OCCUPATIONS_PATH = RAW_DIR / "onet" / "occupation_riasec.json"
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"

torch.manual_seed(42)
np.random.seed(42)


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


def percentile_rank_metric(y_pred, true_codes, occ_codes, occ_matrix):
    sims = cosine_similarity(y_pred, occ_matrix)
    code_to_idx = {c: i for i, c in enumerate(occ_codes)}
    ranks, direct_sims = [], []
    for i, true_code in enumerate(true_codes):
        order = np.argsort(-sims[i])
        true_idx = code_to_idx[true_code]
        rank = int(np.where(order == true_idx)[0][0])
        ranks.append(rank / len(occ_codes))
        direct_sims.append(sims[i, true_idx])
    return float(np.mean(ranks)), float(np.median(ranks)), float(np.mean(direct_sims))


def main():
    X, y, occ_codes_per_row = load_dataset()
    occupations = json.load(open(OCCUPATIONS_PATH))
    occ_codes = [o["onet_soc_code"] for o in occupations]
    occ_matrix = np.array([[o["riasec"][t] for t in RIASEC_TYPES] for o in occupations])

    X_train, X_val, y_train, y_val, codes_train, codes_val = train_test_split(
        X, y, occ_codes_per_row, test_size=0.15, random_state=42
    )

    Xtr_t = torch.tensor(X_train, dtype=torch.float32)
    ytr_t = torch.tensor(y_train, dtype=torch.float32)
    Xval_t = torch.tensor(X_val, dtype=torch.float32)

    model = RiasecMLP(input_dim=X.shape[1])
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=8)

    def combined_loss(pred, target):
        # Evaluation ranks occupations by cosine similarity, not L2 distance,
        # and RIASEC dimensions have very different scales (Realistic std
        # ~1.9 vs Conventional std ~1.0) — plain MSE overweights the
        # high-variance dimensions instead of optimizing the actual ranking
        # objective. Cosine loss directly targets "point in the right
        # direction"; a small MSE term keeps magnitudes from collapsing.
        mse = F.mse_loss(pred, target)
        cos_loss = 1 - F.cosine_similarity(pred, target).mean()
        return 0.2 * mse + 0.8 * cos_loss, mse

    dataset = torch.utils.data.TensorDataset(Xtr_t, ytr_t)
    loader = torch.utils.data.DataLoader(dataset, batch_size=64, shuffle=True)

    best_val_rank = float("inf")
    patience, patience_counter = 30, 0
    history = []

    for epoch in range(400):
        model.train()
        epoch_loss = 0.0
        for xb, yb in loader:
            optimizer.zero_grad()
            pred = model(xb)
            loss, mse = combined_loss(pred, yb)
            loss.backward()
            optimizer.step()
            epoch_loss += mse.item() * len(xb)
        epoch_loss /= len(dataset)

        model.eval()
        with torch.no_grad():
            val_pred = model(Xval_t).numpy()
        mean_rank, median_rank, mean_sim = percentile_rank_metric(val_pred, codes_val, occ_codes, occ_matrix)
        history.append({"epoch": epoch, "train_mse": epoch_loss, "val_mean_percentile_rank": mean_rank})
        scheduler.step(mean_rank)

        if epoch % 10 == 0 or epoch == 199:
            lr = optimizer.param_groups[0]["lr"]
            print(f"epoch {epoch:3d}  train_mse={epoch_loss:.4f}  val_mean_rank={mean_rank:.3f}  val_median_rank={median_rank:.3f}  lr={lr:.1e}")

        if mean_rank < best_val_rank:
            best_val_rank = mean_rank
            patience_counter = 0
            torch.save(model.state_dict(), MODEL_DIR / "riasec_mlp.pt")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping at epoch {epoch} (no improvement for {patience} epochs)")
                break

    print(f"\nBest validation mean percentile rank: {best_val_rank:.3f}")
    print(f"(0.0 = perfect, 0.5 = random guessing, 1.0 = worst)")

    MODEL_DIR.mkdir(exist_ok=True)
    with open(MODEL_DIR / "riasec_mlp_history.json", "w") as f:
        json.dump(history, f, indent=2)
    with open(MODEL_DIR / "riasec_mlp_input_dim.json", "w") as f:
        json.dump({"input_dim": X.shape[1]}, f)
    print(f"Saved model weights, training history, and input_dim to {MODEL_DIR}")


if __name__ == "__main__":
    main()
