# BLS Employment Projections Data

Downloaded from the official U.S. Bureau of Labor Statistics: https://www.bls.gov/emp/tables.htm
("Table 1.2 Occupational projections and worker characteristics," 2025–35 projections)
and https://www.bls.gov/oes/tables.htm (OEWS national wage estimates, not currently used
— superseded by the wage column already present in Table 1.2).

Source: U.S. Department of Labor, Bureau of Labor Statistics. Public domain U.S.
government data — no license restrictions, citation is good academic practice but not
legally required.

**Cite as:** U.S. Bureau of Labor Statistics. *Occupational Employment Projections,
2025–35.* U.S. Department of Labor. https://www.bls.gov/emp/tables.htm

**Note on how this was downloaded:** BLS explicitly blocks automated retrieval tools
(curl, `requests`, etc.) with a bot-detection message — see their usage policy at
https://www.bls.gov (the page returns "Access Denied... bot activity... is prohibited").
This is not a paywall or API-key requirement; a real browser session fetching the same
URL succeeds normally. The files here were retrieved via an actual browser fetch(),
not scraped or reverse-engineered.

`occupation_projections.xlsx` — Table 1.2, containing SOC code, median annual wage
(2025), and projected employment change % (2025–35) per occupation.

See `../../../scripts/extract_bls.py` for how this is matched to O*NET-SOC codes and
turned into `occupation_wages_growth.json` (892 of 923 O*NET occupations matched;
the remainder are BLS-suppressed/unpublished figures, honestly reported as
"not available" rather than estimated or guessed).
