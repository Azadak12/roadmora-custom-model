"""
Creates the two demo accounts used for the teacher/evaluator demo.

Run this yourself:
    cd backend
    .venv/bin/python seed_test_users.py

Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SEED_USER_PASSWORD in
backend/.env (already present; .env and this file are both gitignored).
Safe to re-run: skips any account that already exists.
"""

import os

from dotenv import load_dotenv

load_dotenv()

from supabase_client import supabase

PASSWORD = os.environ["SEED_USER_PASSWORD"]

ACCOUNTS = [
    {"email": "teacher.user@roadmora.test", "password": PASSWORD, "full_name": "Teacher (User)"},
    {"email": "admin@roadmora.test", "password": PASSWORD, "full_name": "Teacher (Admin)"},
]


def main():
    existing = {u.email for u in supabase.auth.admin.list_users(per_page=200)}

    for acct in ACCOUNTS:
        if acct["email"] in existing:
            print(f"skip (already exists): {acct['email']}")
            continue

        supabase.auth.admin.create_user(
            {
                "email": acct["email"],
                "password": acct["password"],
                "email_confirm": True,
                "user_metadata": {"full_name": acct["full_name"]},
            }
        )
        print(f"created: {acct['email']}")


if __name__ == "__main__":
    main()
