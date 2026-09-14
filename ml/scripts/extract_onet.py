"""
Extracts clean, real O*NET 31.0 data (public domain, U.S. Dept. of Labor) into
the JSON files the rest of the pipeline reads. Run once after downloading the
O*NET database (see ml/data/raw/onet/README.md for the source).

Produces:
  ml/data/taxonomies/specific_interest_areas.json
      The real 41 O*NET "Specific Interest Areas" and their crosswalk to the
      6 RIASEC "Career Interest Types" — replaces the earlier hand-built
      interest_areas.json with an authoritative, citable taxonomy.
  ml/data/raw/onet/occupation_riasec.json
      For each of ~1,016 real O*NET-SOC occupations: title, description, and
      its real 6-dimensional RIASEC profile (Realistic/Investigative/Artistic/
      Social/Enterprising/Conventional, 1-7 scale, "Occupational Interest"
      scale). This is the real knowledge base the trained model's predictions
      get matched against.

Run:
    cd ml && python3 scripts/extract_onet.py
"""

import json
from pathlib import Path

import pandas as pd

ONET_DIR = Path(__file__).resolve().parent.parent / "data" / "raw" / "onet" / "extracted" / "db_31_0_excel"
TAXONOMY_DIR = Path(__file__).resolve().parent.parent / "data" / "taxonomies"
RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw" / "onet"

RIASEC_TYPES = ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"]


def extract_specific_interest_areas():
    df = pd.read_excel(ONET_DIR / "Specific Interest Areas to Career Interest Types.xlsx")
    areas = {}
    for _, row in df.iterrows():
        name = row["Specific Interest Areas Element Name"]
        riasec = row["Career Interest Types Element Name"]
        areas.setdefault(name, []).append(riasec)

    out = {
        "_source": "O*NET 31.0 Database, 'Specific Interest Areas to Career Interest Types' "
                   "(National Center for O*NET Development, U.S. Dept. of Labor, public domain). "
                   "Some specific interest areas load onto more than one RIASEC type.",
        "areas": areas,
    }
    path = TAXONOMY_DIR / "specific_interest_areas.json"
    path.write_text(json.dumps(out, indent=2))
    print(f"Wrote {len(areas)} specific interest areas -> {path}")
    return areas


def extract_occupation_riasec():
    occ = pd.read_excel(ONET_DIR / "Occupation Data.xlsx")
    cit = pd.read_excel(ONET_DIR / "Career Interest Types.xlsx")

    # 'OI' = Occupational Interest scale (the real 1-7 numeric RIASEC score).
    # 'IH' rows are High-Point rank labels, not needed here.
    cit_oi = cit[(cit["Scale ID"] == "OI") & (cit["Element Name"].isin(RIASEC_TYPES))]

    profiles = {}
    for code, group in cit_oi.groupby("O*NET-SOC Code"):
        profiles[code] = dict(zip(group["Element Name"], group["Data Value"]))

    records = []
    for _, row in occ.iterrows():
        code = row["O*NET-SOC Code"]
        if code not in profiles:
            continue
        profile = profiles[code]
        if not all(t in profile for t in RIASEC_TYPES):
            continue
        records.append({
            "onet_soc_code": code,
            "title": row["Title"],
            "description": row["Description"],
            "riasec": {t: float(profile[t]) for t in RIASEC_TYPES},
        })

    out_path = RAW_DIR / "occupation_riasec.json"
    out_path.write_text(json.dumps(records, indent=2))
    print(f"Wrote {len(records)} real occupations with RIASEC profiles -> {out_path}")
    return records


def main():
    extract_specific_interest_areas()
    extract_occupation_riasec()


if __name__ == "__main__":
    main()
