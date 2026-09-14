# Running Roadmora AI Locally

Only 2 things need to be running: the backend and the frontend.
Supabase is cloud-hosted — nothing to start for it.

There is no Docker, n8n, or external LLM call in this project. Career
predictions come from the trained model at `ml/models/riasec_mlp.pt`,
loaded directly in-process by `backend/main.py` via `ml/scripts/predict.py`.

## 1. Start the backend (FastAPI)
```bash
cd /Users/abdulkalam/FYP-custom-model/backend && .venv/bin/uvicorn main:app --reload --port 8003
```
Leave running in its own terminal tab. Runs on `http://localhost:8003`.

## 2. Start the frontend (React/Vite)
```bash
cd /Users/abdulkalam/FYP-custom-model/frontend && npm run dev
```
Leave running in its own terminal tab. Runs on `http://localhost:5173`.

## 3. Open the app
- User site: http://localhost:5173
- Admin login: http://localhost:5173/admin/login

## Demo accounts
Created via `backend/seed_test_users.py` (password is in `backend/.env` as `SEED_USER_PASSWORD`):

| Role  | Email                          |
|-------|--------------------------------|
| User  | teacher.user@roadmora.test     |
| Admin | admin@roadmora.test            |

## Notes
- `frontend/.env` already points `VITE_API_BASE_URL` at `http://localhost:8003` for local dev.
- The backend's `.venv` needs both `backend/requirements.txt` and
  `ml/requirements-ml.txt` installed (torch, scikit-learn, joblib, etc.) since
  `main.py` imports `CareerPredictor` from `ml/scripts/predict.py` directly.
- `backend/.env.example` still lists `N8N_WEBHOOK_URL` — that's a leftover
  from before the migration to the self-trained model and is unused by the
  current code; safe to ignore or remove.
