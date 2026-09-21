import os

from fastapi import Depends, Header, HTTPException

from supabase_client import supabase

ADMIN_EMAILS = {
    e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()
}


def get_current_user(authorization: str = Header(...)):
    """Validate a bearer token with Supabase and return its user."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not response or not response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return response.user


def get_current_admin(user=Depends(get_current_user)):
    """Require the authenticated email to appear in the server-side admin list."""
    if (user.email or "").lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
