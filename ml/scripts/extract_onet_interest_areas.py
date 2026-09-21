"""
Extracts each real O*NET occupation's own top-ranked Specific Interest Areas
(the "Summary Display Rank" scale, DS) from the O*NET 31.0 database — the
same 41-area taxonomy already used as the assessment form's `careerInterests`
options (see data/taxonomies/specific_interest_areas.json).

This is the per-occupation counterpart to extract_onet_skills.py: that script
gives each occupation its real technology-skill tags; this one gives each
occupation its real interest-area tags, so a user's selected career interests
can be matched against genuine O*NET data instead of only flowing through
the RIASEC prediction indirectly.

Run:
    cd ml && python3 scripts/extract_onet_interest_areas.py
Output:
    ml/data/raw/onet/occupation_interest_areas.json
"""

import json
from pathlib import Path

import pandas as pd

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw" / "onet"
SOURCE_XLSX = RAW_DIR / "extracted" / "db_31_0_excel" / "Specific Interest Areas.xlsx"
OUTPUT_PATH = RAW_DIR / "occupation_interest_areas.json"


def main():
    df = pd.read_excel(SOURCE_XLSX)

    # Scale ID "DS" = O*NET's own "Summary Display Rank" -- the small,
    # curated set of interest areas O*NET itself highlights as this
    # occupation's top areas (rank 1 = strongest). A value of 0 means
    # "not one of this occupation's top areas" and is dropped.
    ranked = df[(df["Scale ID"] == "DS") & (df["Data Value"] > 0)]

    result = {}
    for soc_code, group in ranked.groupby("O*NET-SOC Code"):
        areas = group.sort_values("Data Value")["Element Name"].tolist()
        result[soc_code] = areas

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(result, f, indent=2)

    n_areas = sum(len(v) for v in result.values())
    print(f"Wrote {len(result)} occupations ({n_areas} occupation-area tags) to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
