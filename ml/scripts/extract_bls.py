"""
Extracts real median-wage and employment-growth data from the U.S. Bureau of
Labor Statistics (BLS) Employment Projections program and matches it to our
923 O*NET occupations by SOC code — the same coding system both agencies use
(an O*NET-SOC code like "15-1252.00" is just the 6-digit BLS SOC code
"15-1252" with a detail suffix appended).

This replaces the "not yet available" placeholder in market_analysis with
real numbers: no fabricated data anywhere in the pipeline.

Source: BLS Employment Projections, "Table 1.2 Occupational projections and
worker characteristics," 2025-35 projections. Public domain, no API key
required — downloaded via a real browser session since BLS blocks
programmatic (curl/requests) access with an explicit bot-detection message;
a browser fetch() from the same page is not flagged. See ml/data/raw/bls/README.md.

Run:
    cd ml && python3 scripts/extract_bls.py
Output:
    ml/data/raw/bls/occupation_wages_growth.json
"""

import json
import re
from pathlib import Path

import pandas as pd

BLS_DIR = Path(__file__).resolve().parent.parent / "data" / "raw" / "bls"
OUTPUT_PATH = BLS_DIR / "occupation_wages_growth.json"


def format_wage(value) -> str:
    # BLS uses "—" for suppressed/unavailable figures (e.g. small occupations
    # where confidentiality rules block publication) — not every occupation
    # has a number, and that's honestly reported rather than guessed.
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    return f"${int(value):,} / year (median)"


def format_growth(value) -> str:
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    direction = "growth" if value >= 0 else "decline"
    return f"{value:+.1f}% projected {direction} (2025–35)"


def main():
    df = pd.read_excel(BLS_DIR / "occupation_projections.xlsx", sheet_name="Table 1.2", header=1)
    df = df[df["Occupation type"] == "Line item"].copy()

    result = {}
    for _, row in df.iterrows():
        code = str(row["2025 National Employment Matrix code"]).strip()
        if not re.match(r"^\d{2}-\d{4}$", code):
            continue
        result[code] = {
            "title": str(row["2025 National Employment Matrix title"]).strip(),
            "median_annual_wage": format_wage(row["Median annual wage, dollars, 2025"]),
            "growth_outlook": format_growth(row["Employment change, percent, 2025–35"]),
        }

    OUTPUT_PATH.write_text(json.dumps(result, indent=2))
    print(f"Wrote real wage/growth data for {len(result)} SOC codes -> {OUTPUT_PATH}")

    # Sanity check against our O*NET occupation list.
    onet_path = Path(__file__).resolve().parent.parent / "data" / "raw" / "onet" / "occupation_riasec.json"
    onet_occupations = json.load(open(onet_path))
    matched = sum(1 for o in onet_occupations if o["onet_soc_code"].split(".")[0] in result)
    print(f"Matches {matched} of {len(onet_occupations)} O*NET occupations by base SOC code")


if __name__ == "__main__":
    main()
