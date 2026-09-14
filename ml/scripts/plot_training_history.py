"""
Plots the training curves from the last train_mlp.py run — the single most
convincing artifact for a defense: it shows training loss falling, validation
rank improving then plateauing, and exactly which epoch got checkpointed
(the dip point), which is direct visual proof against "did you actually train
this or just say you did."

Run:
    cd ml && python3 scripts/plot_training_history.py
Output:
    ml/models/training_curve.png
"""

import json
from pathlib import Path

import matplotlib.pyplot as plt

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"


def main():
    with open(MODEL_DIR / "riasec_mlp_history.json") as f:
        history = json.load(f)

    epochs = [h["epoch"] for h in history]
    train_mse = [h["train_mse"] for h in history]
    val_rank = [h["val_mean_percentile_rank"] for h in history]
    best_epoch = min(range(len(val_rank)), key=lambda i: val_rank[i])

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5))

    ax1.plot(epochs, train_mse, color="#4f46e5", linewidth=2)
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Training MSE")
    ax1.set_title("Training loss (falls steadily)")
    ax1.grid(alpha=0.3)

    ax2.plot(epochs, val_rank, color="#059669", linewidth=2, label="Validation mean percentile rank")
    ax2.axhline(0.5, color="#9ca3af", linestyle="--", linewidth=1.5, label="Random guessing (0.5)")
    ax2.scatter([epochs[best_epoch]], [val_rank[best_epoch]], color="#dc2626", zorder=5,
                label=f"Checkpoint saved (epoch {epochs[best_epoch]}, rank {val_rank[best_epoch]:.3f})")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Mean percentile rank (lower = better)")
    ax2.set_title("Validation performance — note the dip then rise")
    ax2.legend(fontsize=8, loc="upper right")
    ax2.grid(alpha=0.3)

    fig.suptitle("Roadmora AI — RIASEC Model Training Curve", fontsize=13, fontweight="bold")
    fig.tight_layout()
    out_path = MODEL_DIR / "training_curve.png"
    fig.savefig(out_path, dpi=150)
    print(f"Saved {out_path}")
    print(f"Best checkpoint: epoch {epochs[best_epoch]}, val_mean_rank={val_rank[best_epoch]:.3f}")
    print(f"Training continued to epoch {epochs[-1]} before early stopping — validation rank got worse")
    print("after the checkpoint epoch, which is the overfitting point visible in the right-hand plot.")


if __name__ == "__main__":
    main()
