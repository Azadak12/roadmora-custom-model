# O*NET 31.0 Database

Downloaded from the official O*NET Resource Center: https://www.onetcenter.org/database.html
Source: National Center for O*NET Development, sponsored by the U.S. Department of Labor,
Employment and Training Administration. Licensed under Creative Commons Attribution 4.0
International (CC BY 4.0) — free to use with attribution, including in academic work.

**Cite as:** National Center for O*NET Development. *O\*NET 31.0 Database.* U.S. Department
of Labor, Employment and Training Administration. https://www.onetcenter.org/database.html

`extracted/db_31_0_excel/` contains the full set of O*NET tables (skills, knowledge, tasks,
work context, education, job zones, etc.) as downloaded. This project currently uses only:

- `Occupation Data.xlsx` — 1,016 real occupation titles + descriptions
- `Career Interest Types.xlsx` — real RIASEC (Realistic/Investigative/Artistic/Social/
  Enterprising/Conventional) interest scores per occupation, "Occupational Interest" (OI) scale
- `Specific Interest Areas to Career Interest Types.xlsx` — the 41-area interest taxonomy
  and its crosswalk to the 6 RIASEC types

See `../../../scripts/extract_onet.py` for how these are turned into
`occupation_riasec.json` and `../../taxonomies/specific_interest_areas.json`.

The remaining un-used tables (`Task Statements.xlsx`, `Knowledge.xlsx`, `Education.xlsx`,
`Job Zone Reference.xlsx`, etc.) are kept on disk because they're the planned real-data
source for the per-occupation knowledge base (market analysis / learning roadmap content)
— see the "Next steps" section in `../../../README.md`.
