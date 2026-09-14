"""
Extracts real per-occupation technology-skill tags from O*NET's
"Software Skills.xlsx" (specific tools/technologies real workers report
using, e.g. "Python", "React", "Docker") and matches them against our
TECHNICAL_SKILLS taxonomy. This is the missing link between "user selected
Python + Machine Learning" and "which of the 923 occupations actually use
those skills" — RIASEC alone can't tell IT roles apart from unrelated
technical/scientific roles that happen to share a similar personality
profile; real technology tags can.

Run:
    cd ml && python3 scripts/extract_onet_skills.py
Output:
    ml/data/raw/onet/occupation_technical_skills.json
"""

import json
import re
from pathlib import Path

import pandas as pd

from features import TECHNICAL_SKILLS

ONET_DIR = Path(__file__).resolve().parent.parent / "data" / "raw" / "onet" / "extracted" / "db_31_0_excel"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "raw" / "onet" / "occupation_technical_skills.json"

# Map each taxonomy skill to search terms that appear in O*NET's "Workplace
# Example" text (which uses full/verbose names, e.g. "Structured query
# language SQL" for "SQL"). Skills not listed here are matched by their own
# name as a case-insensitive substring.
ALIASES = {
    "SQL": ["structured query language sql", r"\bsql\b"],
    # O*NET's software list tags specific ML tools, never the phrase "machine
    # learning" itself — treat presence of any major ML/data-science tool as
    # evidence the occupation does ML-adjacent work.
    "Machine Learning": ["tensorflow", "pytorch", "scikit-learn", "keras", r"\bspss\b"],
    "Deep Learning": ["tensorflow", "pytorch", "keras"],
    "Data Analysis": ["tableau", "power bi", "spss", "sas\\b"],
    "Web Development": ["web platform development", "web page creation"],
    "Cloud Computing": ["cloud software", "cloud computing"],
    "Excel": ["microsoft excel"],
    "C++": [r"c\+\+"],
    "C#": [r"c#"],
    "React": [r"\breact\b(?! native)"],
    "React Native": ["react native"],
    "Node.js": ["node.js", "nodejs"],
    "HTML/CSS": ["cascading style sheets", "hypertext markup"],
    "AWS": ["amazon web services", r"\baws\b"],
    "Microsoft Azure": ["azure"],
    "Google Cloud Platform": ["google cloud"],
    "PostgreSQL": ["postgresql"],
    "MySQL": ["mysql"],
    "Microsoft SQL Server": ["microsoft sql server"],
    "PyTorch": ["pytorch"],
    "TensorFlow": ["tensorflow"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes"],
    "Git": ["git\\b"],
    "Linux Administration": ["linux"],
    "Microsoft Word": ["microsoft word"],
    "Microsoft PowerPoint": ["microsoft powerpoint"],
    "AutoCAD": ["autocad"],
    "SolidWorks": ["solidworks"],
    "Adobe Photoshop": ["adobe photoshop"],
    "Adobe Illustrator": ["adobe illustrator"],
    "Adobe Premiere Pro": ["premiere pro"],
    "Salesforce": ["salesforce"],
    "SAP": [r"\bsap\b"],
    "QuickBooks": ["quickbooks"],
    "Jira": ["jira"],
}


def build_patterns():
    """Every term gets word-boundary wrapping — without it, short skill names
    like 'C', 'R', 'Go' match as substrings inside unrelated words (e.g. 'Go'
    inside 'Google', 'Storage'), producing false positives for occupations
    that have nothing to do with those languages."""
    patterns = {}
    for skill in TECHNICAL_SKILLS:
        terms = ALIASES.get(skill, [re.escape(skill.lower())])
        wrapped = [t if t.startswith(r"\b") else rf"\b{t}\b" for t in terms]
        patterns[skill] = re.compile("|".join(wrapped), re.IGNORECASE)
    return patterns


def main():
    df = pd.read_excel(ONET_DIR / "Software Skills.xlsx")
    patterns = build_patterns()

    result = {}
    for code, group in df.groupby("O*NET-SOC Code"):
        examples = " | ".join(group["Workplace Example"].astype(str))
        matched = [skill for skill, pat in patterns.items() if pat.search(examples)]
        if matched:
            result[code] = matched

    OUTPUT_PATH.write_text(json.dumps(result, indent=2))
    print(f"Wrote real technical-skill tags for {len(result)} occupations -> {OUTPUT_PATH}")
    avg = sum(len(v) for v in result.values()) / len(result)
    print(f"Average {avg:.1f} matched skills per occupation")


if __name__ == "__main__":
    main()
