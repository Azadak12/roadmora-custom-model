"""
Single source of truth for all option lists (skills, languages, interests, etc.)
lives in ml/data/taxonomies/*.json — both the frontend form and the model's
feature encoder read from the same data so they never drift apart.

Run this after editing any file in ml/data/taxonomies/ to regenerate the
frontend's JS module:

    cd ml && python3 scripts/sync_taxonomies.py
"""

import json
from pathlib import Path

TAXONOMY_DIR = Path(__file__).resolve().parent.parent / "data" / "taxonomies"
OUTPUT_PATH = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "data" / "taxonomies.js"


def load(name):
    with open(TAXONOMY_DIR / f"{name}.json") as f:
        return json.load(f)


def flatten_grouped(grouped: dict) -> list:
    """Flattens a {category: [items]} dict into a single sorted list of items."""
    seen = set()
    out = []
    for items in grouped.values():
        for item in items:
            if item not in seen:
                seen.add(item)
                out.append(item)
    return out


def main():
    technical_skills = flatten_grouped(load("technical_skills"))
    soft_skills = load("soft_skills")
    languages = flatten_grouped(load("languages"))
    industries = load("industries")
    interest_areas = sorted(load("specific_interest_areas")["areas"].keys())
    career_clusters = sorted(load("career_clusters")["clusters"].keys())
    job_roles = load("job_roles")

    js = f"""// AUTO-GENERATED from ml/data/taxonomies/*.json — do not edit by hand.
// Regenerate with: cd ml && python3 scripts/sync_taxonomies.py

export const TECHNICAL_SKILLS = {json.dumps(technical_skills, indent=2)};

export const SOFT_SKILLS = {json.dumps(soft_skills, indent=2)};

export const LANGUAGES = {json.dumps(languages, indent=2)};

export const INDUSTRIES = {json.dumps(industries, indent=2)};

export const INTEREST_AREAS = {json.dumps(interest_areas, indent=2)};

export const CAREER_CLUSTERS = {json.dumps(career_clusters, indent=2)};

export const JOB_ROLES = {json.dumps(job_roles, indent=2)};
"""

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(js)
    print(f"Wrote {OUTPUT_PATH}")
    print(f"  {len(technical_skills)} technical skills")
    print(f"  {len(soft_skills)} soft skills")
    print(f"  {len(languages)} languages")
    print(f"  {len(industries)} industries")
    print(f"  {len(interest_areas)} interest areas")
    print(f"  {len(career_clusters)} career clusters (model output classes)")
    print(f"  {len(job_roles)} job roles")


if __name__ == "__main__":
    main()
