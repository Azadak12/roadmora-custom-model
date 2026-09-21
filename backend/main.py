import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_admin, get_current_user
from supabase_client import supabase

load_dotenv()

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

# The trained model + real O*NET data live in ../ml — see ml/README.md for
# the full pipeline (feature encoding, training, evaluation) that produced
# ml/models/riasec_mlp.pt and the occupation knowledge base this imports.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ml" / "scripts"))
from predict import CareerPredictor  # noqa: E402

app = FastAPI(title="Roadmora AI Backend")
# Load the model and its occupation data once when the API process starts.
predictor = CareerPredictor()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/assessment")
async def submit_assessment(payload: dict, user=Depends(get_current_user)):
    """Predict matches for an authenticated user and save the top match."""
    try:
        result = predictor.predict(payload, k=3)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    top_matches = result["top_matches"]
    best = top_matches[0]

    insert_result = (
        supabase.table("results")
        .insert(
            {
                "user_id": user.id,
                "career_field": best["career_field"],
                "market_analysis": best["market_analysis"],
                "learning_roadmap": best["learning_roadmap"],
            }
        )
        .execute()
    )
    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to save results")

    return {"top_matches": top_matches}


@app.get("/api/results")
async def list_results(user=Depends(get_current_user)):
    """Return only this user's saved assessments, newest first."""
    result = (
        supabase.table("results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@app.get("/api/admin/stats")
async def admin_stats(admin=Depends(get_current_admin)):
    """Summarize registered users and saved assessments for an admin."""
    users = supabase.auth.admin.list_users(per_page=200)
    results = supabase.table("results").select("id", count="exact").execute()
    return {
        "total_users": len(users),
        "total_assessments": results.count or 0,
    }


@app.get("/api/admin/users")
async def admin_users(admin=Depends(get_current_admin)):
    """Attach each user's assessment count to their Supabase account record."""
    users = supabase.auth.admin.list_users(per_page=200)
    results = supabase.table("results").select("user_id").execute()

    counts = {}
    for row in results.data:
        counts[row["user_id"]] = counts.get(row["user_id"], 0) + 1

    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": (u.user_metadata or {}).get("full_name"),
            "created_at": u.created_at,
            "assessment_count": counts.get(u.id, 0),
        }
        for u in users
    ]


@app.get("/api/admin/results")
async def admin_results(admin=Depends(get_current_admin)):
    """Return all saved assessments with user emails for the admin table."""
    users = supabase.auth.admin.list_users(per_page=200)
    email_by_id = {u.id: u.email for u in users}

    results = (
        supabase.table("results")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    for row in results.data:
        row["user_email"] = email_by_id.get(row["user_id"], "unknown")
    return results.data
