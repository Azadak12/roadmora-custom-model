"""
Single definition of the RIASEC-prediction network architecture, imported by
both train_mlp.py and predict.py. Keeping this in one place is deliberate —
a duplicated class definition in each file previously drifted out of sync
after a hyperparameter change and broke checkpoint loading with a shape
mismatch. Change the architecture here only.
"""

import torch.nn as nn


class RiasecMLP(nn.Module):
    def __init__(self, input_dim, output_dim=6):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256), nn.BatchNorm1d(256), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(256, 128), nn.BatchNorm1d(128), nn.ReLU(), nn.Dropout(0.15),
            nn.Linear(128, 64), nn.BatchNorm1d(64), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(64, output_dim),
        )

    def forward(self, x):
        return self.net(x)
