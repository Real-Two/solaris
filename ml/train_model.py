"""
SOLARIS — Step 2: Train the XGBoost SEU Risk Model
Trains a gradient-boosted classifier on the SPE dataset and saves
the model + scaler to disk as solaris_model.pkl.
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score
import xgboost as xgb

DATA_PATH  = os.path.join(os.path.dirname(__file__), "../data/spe_training_data.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../data/solaris_model.pkl")

FEATURES = [
    "proton_flux_pfu",
    "kp_index",
    "x_ray_class",
    "latitude",
    "altitude_fl",
    "hours_since_onset",
]
LABEL = "high_risk"


def train():
    print("=" * 55)
    print("  SOLARIS — XGBoost SEU Risk Model Training")
    print("=" * 55)

    # ── Load data ─────────────────────────────────────────────
    print("\n📂 Loading training data...")
    df = pd.read_csv(DATA_PATH)
    print(f"   {len(df)} samples loaded.")

    X = df[FEATURES].values
    y = df[LABEL].values

    # ── Train / test split ────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Scale features ────────────────────────────────────────
    # XGBoost doesn't strictly need scaling, but it helps with
    # SHAP value interpretation later.
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    # ── Train XGBoost ─────────────────────────────────────────
    print("\n🤖 Training XGBoost classifier...")
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=(y == 0).sum() / (y == 1).sum(),  # handle class imbalance
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
        verbosity=0,
    )
    model.fit(
        X_train_s, y_train,
        eval_set=[(X_test_s, y_test)],
        verbose=False,
    )

    # ── Evaluate ──────────────────────────────────────────────
    print("\n📊 Evaluation on held-out test set:")
    y_pred  = model.predict(X_test_s)
    y_proba = model.predict_proba(X_test_s)[:, 1]

    print(classification_report(y_test, y_pred, target_names=["Nominal", "High Risk"]))
    print(f"   ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")

    # ── Feature importance ────────────────────────────────────
    print("\n🔍 Feature importances (higher = more influential):")
    importances = model.feature_importances_
    for feat, imp in sorted(zip(FEATURES, importances), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"   {feat:<22} {bar} {imp:.3f}")

    # ── Save model bundle ─────────────────────────────────────
    bundle = {"model": model, "scaler": scaler, "features": FEATURES}
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(bundle, f)

    print(f"\n✅ Model saved to: {MODEL_PATH}")
    print("\n" + "=" * 55)
    print("  Training complete. SOLARIS model is ready.")
    print("=" * 55)


def quick_test():
    """Quick sanity check: score a simulated SPE aircraft vs quiet aircraft."""
    print("\n🧪 Quick sanity test:")
    with open(MODEL_PATH, "rb") as f:
        bundle = pickle.load(f)
    model  = bundle["model"]
    scaler = bundle["scaler"]

    samples = pd.DataFrame([
        # SPE scenario — high latitude, high altitude, high flux
        {"proton_flux_pfu": 4200, "kp_index": 8.0, "x_ray_class": 100,
         "latitude": 69, "altitude_fl": 390, "hours_since_onset": 3},
        # Quiet sun scenario
        {"proton_flux_pfu": 0.5, "kp_index": 1.2, "x_ray_class": 0.5,
         "latitude": 35, "altitude_fl": 350, "hours_since_onset": 0},
    ])

    X = scaler.transform(samples[FEATURES].values)
    proba = model.predict_proba(X)[:, 1]

    labels = ["✈️  JetBlue A320 (Oct 30 2025 scenario)", "✈️  Routine flight (quiet sun)"]
    for label, p in zip(labels, proba):
        risk_pct = p * 100
        tier = "🔴 HIGH RISK" if p > 0.6 else ("🟡 ELEVATED" if p > 0.3 else "🟢 NOMINAL")
        print(f"   {label}")
        print(f"      Risk score: {risk_pct:.1f}%  →  {tier}\n")


if __name__ == "__main__":
    train()
    quick_test()
