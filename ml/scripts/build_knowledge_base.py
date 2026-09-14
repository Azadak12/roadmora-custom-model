"""
Builds a real, non-fabricated per-occupation knowledge base from the O*NET
download: education/experience/training requirements (Job Zone Reference)
and real day-to-day task statements (Task Statements) for each of the 923
occupations the model can recommend.

No salary/demand/growth figures are included — O*NET does not publish wage
or employment-projection data (that's the U.S. Bureau of Labor Statistics,
a separate dataset, not yet integrated — see ml/README.md "Next steps").
Rather than fabricate those numbers, the API honestly reports them as
not-yet-available until BLS data is wired in.

Run:
    cd ml && python3 scripts/build_knowledge_base.py
Output:
    ml/data/raw/onet/knowledge_base.json
"""

import json
from pathlib import Path

import pandas as pd

ONET_DIR = Path(__file__).resolve().parent.parent / "data" / "raw" / "onet" / "extracted" / "db_31_0_excel"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "raw" / "onet" / "knowledge_base.json"


def main():
    job_zones = pd.read_excel(ONET_DIR / "Job Zones.xlsx")
    job_zone_ref = pd.read_excel(ONET_DIR / "Job Zone Reference.xlsx").set_index("Job Zone")
    tasks = pd.read_excel(ONET_DIR / "Task Statements.xlsx")

    # Prefer "Core" tasks (the most defining ones) if that column exists, else just take the first N.
    task_type_col = "Task Type" if "Task Type" in tasks.columns else None

    kb = {}
    for _, row in job_zones.iterrows():
        code = row["O*NET-SOC Code"]
        zone = row["Job Zone"]
        if pd.isna(zone) or int(zone) not in job_zone_ref.index:
            continue
        zone = int(zone)
        zref = job_zone_ref.loc[zone]

        occ_tasks = tasks[tasks["O*NET-SOC Code"] == code]
        if task_type_col:
            core = occ_tasks[occ_tasks[task_type_col] == "Core"]
            occ_tasks = core if len(core) > 0 else occ_tasks
        top_tasks = occ_tasks["Task"].head(5).tolist()

        kb[code] = {
            "job_zone": zone,
            "job_zone_name": zref["Name"],
            "education": zref["Education"],
            "experience": zref["Experience"],
            "job_training": zref["Job Training"],
            "core_tasks": top_tasks,
        }

    OUTPUT_PATH.write_text(json.dumps(kb, indent=2))
    print(f"Wrote knowledge base for {len(kb)} occupations -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
