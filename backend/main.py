import os
import sys
from pathlib import Path
from uuid import UUID

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from auth import ADMIN_EMAILS, get_current_admin, get_current_user
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


def _all_admin_users():
    """Supabase Auth pages users; a single list_users call stops at 200."""
    users = []
    page_size = 200
    page = 1
    while True:
        batch = supabase.auth.admin.list_users(page=page, per_page=page_size)
        users.extend(batch)
        if len(batch) < page_size:
            return users
        page += 1


def _all_admin_results(columns, newest_first=False):
    """Read beyond PostgREST's default 1,000-row response limit."""
    rows = []
    page_size = 1000
    while True:
        query = supabase.table("results").select(columns).order("id")
        batch = query.range(len(rows), len(rows) + page_size - 1).execute().data
        rows.extend(batch)
        if len(batch) < page_size:
            break
    if newest_first:
        rows.sort(key=lambda row: row.get("created_at") or "", reverse=True)
    return rows


class AdminUserUpdate(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    full_name: str = Field(max_length=120)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value):
        value = value.strip().lower()
        if value.count("@") != 1 or "." not in value.split("@", 1)[1] or any(c.isspace() for c in value):
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value):
        return value.strip()


class AdminUserCreate(AdminUserUpdate):
    password: str = Field(min_length=8, max_length=128, repr=False)


@app.post("/api/admin/users", status_code=201)
def admin_create_user(payload: AdminUserCreate, admin=Depends(get_current_admin)):
    """Create a regular account without replacing the administrator's session."""
    if payload.email in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin accounts cannot be created here")
    try:
        response = supabase.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {"full_name": payload.full_name},
        })
    except Exception as exc:
        code = getattr(exc, "code", "")
        if code in {"email_exists", "user_already_exists"}:
            raise HTTPException(status_code=409, detail="A user with this email already exists") from exc
        raise HTTPException(status_code=400, detail="Could not create user. Check the email and password requirements, then try again.") from exc
    if not response.user:
        raise HTTPException(status_code=502, detail="Account creation returned no user")
    user = response.user
    return {
        "id": user.id,
        "email": user.email,
        "full_name": (user.user_metadata or {}).get("full_name"),
        "is_admin": False,
        "created_at": user.created_at,
        "assessment_count": 0,
    }


class AdminAssessmentUpdate(BaseModel):
    career_field: str = Field(min_length=1, max_length=200)
    demand: str = Field(max_length=120)
    salary: str = Field(max_length=120)
    growth: str = Field(max_length=120)
    learning_roadmap: list[str] = Field(max_length=50)

    @field_validator("career_field", "demand", "salary", "growth")
    @classmethod
    def clean_text(cls, value):
        return value.strip()

    @field_validator("career_field")
    @classmethod
    def require_career(cls, value):
        if not value:
            raise ValueError("Career match is required")
        return value

    @field_validator("learning_roadmap")
    @classmethod
    def clean_roadmap(cls, steps):
        cleaned = [step.strip() for step in steps if step.strip()]
        if any(len(step) > 1000 for step in cleaned):
            raise ValueError("Roadmap steps must be at most 1,000 characters")
        return cleaned


def _admin_user_or_404(user_id):
    try:
        response = supabase.auth.admin.get_user_by_id(str(user_id))
    except Exception as exc:
        raise HTTPException(status_code=404, detail="User not found") from exc
    if not response.user:
        raise HTTPException(status_code=404, detail="User not found")
    return response.user


def _assessment_or_404(result_id):
    response = supabase.table("results").select("*").eq("id", str(result_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return response.data[0]


@app.get("/api/admin/stats")
async def admin_stats(admin=Depends(get_current_admin)):
    """Summarize registered users and saved assessments for an admin."""
    users = _all_admin_users()
    results = supabase.table("results").select("id", count="exact").execute()
    return {
        "total_users": len(users),
        "total_assessments": results.count or 0,
    }


@app.get("/api/admin/users")
async def admin_users(admin=Depends(get_current_admin)):
    """Attach each user's assessment count to their Supabase account record."""
    users = _all_admin_users()
    results = _all_admin_results("user_id")

    counts = {}
    for row in results:
        counts[row["user_id"]] = counts.get(row["user_id"], 0) + 1

    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": (u.user_metadata or {}).get("full_name"),
            "is_admin": (u.email or "").lower() in ADMIN_EMAILS,
            "created_at": u.created_at,
            "assessment_count": counts.get(u.id, 0),
        }
        for u in users
    ]


@app.get("/api/admin/results")
async def admin_results(admin=Depends(get_current_admin)):
    """Return all saved assessments with user emails for the admin table."""
    users = _all_admin_users()
    email_by_id = {u.id: u.email for u in users}

    results = _all_admin_results("*", newest_first=True)
    for row in results:
        row["user_email"] = email_by_id.get(row["user_id"], "unknown")
    return results


@app.patch("/api/admin/users/{user_id}")
async def admin_update_user(user_id: UUID, payload: AdminUserUpdate, admin=Depends(get_current_admin)):
    """Edit a user's public name and email without changing their auth role."""
    current = _admin_user_or_404(user_id)
    old_email = (current.email or "").lower()
    if old_email in ADMIN_EMAILS and payload.email != old_email:
        raise HTTPException(status_code=403, detail="Admin email addresses cannot be changed here")
    if payload.email in ADMIN_EMAILS and payload.email != old_email:
        raise HTTPException(status_code=403, detail="An admin email address cannot be assigned here")
    metadata = {**(current.user_metadata or {}), "full_name": payload.full_name}
    try:
        updated = supabase.auth.admin.update_user_by_id(str(user_id), {
            "email": payload.email,
            "user_metadata": metadata,
        })
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not update user. Check whether the email is already in use.") from exc
    return {
        "id": str(user_id),
        "email": updated.user.email,
        "full_name": (updated.user.user_metadata or {}).get("full_name"),
    }


@app.delete("/api/admin/users/{user_id}", status_code=204)
async def admin_delete_user(user_id: UUID, admin=Depends(get_current_admin)):
    """Delete an auth user, then remove any assessment rows left by the database."""
    current = _admin_user_or_404(user_id)
    if (current.email or "").lower() in ADMIN_EMAILS or str(user_id) == admin.id:
        raise HTTPException(status_code=403, detail="Admin accounts cannot be deleted here")
    try:
        supabase.auth.admin.delete_user(str(user_id))
    except Exception as exc:
        raise HTTPException(status_code=409, detail="Could not delete user. Check the results table's user deletion policy.") from exc
    # Covers installations without an ON DELETE CASCADE rule.
    supabase.table("results").delete().eq("user_id", str(user_id)).execute()


@app.patch("/api/admin/results/{result_id}")
async def admin_update_result(result_id: UUID, payload: AdminAssessmentUpdate, admin=Depends(get_current_admin)):
    """Edit the visible recommendation fields while preserving other market metadata."""
    current = _assessment_or_404(result_id)
    market = {**(current.get("market_analysis") or {}),
              "demand": payload.demand, "salary": payload.salary, "growth": payload.growth}
    response = (supabase.table("results").update({
        "career_field": payload.career_field,
        "market_analysis": market,
        "learning_roadmap": payload.learning_roadmap,
    }).eq("id", str(result_id)).execute())
    if not response.data:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return response.data[0]


@app.delete("/api/admin/results/{result_id}", status_code=204)
async def admin_delete_result(result_id: UUID, admin=Depends(get_current_admin)):
    """Remove one saved assessment."""
    _assessment_or_404(result_id)
    supabase.table("results").delete().eq("id", str(result_id)).execute()
