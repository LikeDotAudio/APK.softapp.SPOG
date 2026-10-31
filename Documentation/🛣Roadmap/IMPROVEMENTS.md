# 🛣 Improvements — WEB.SPOG (from the 2026-10-30 architecture audit)

What this repo should change to meet the standard, most valuable first. Source: [🔍Audits/ARCHITECTURE-AUDIT.md](../%F0%9F%94%8DAudits/ARCHITECTURE-AUDIT.md).
← [Roadmap](INDEX.md)

Note: `Documentation/🔍Audits/*` is gitignored in this repository, so the source link resolves only in a working checkout.

| # | Improvement | Category | Effort (S/M/L) | Evidence |
|---|---|---|---|---|
| 1 | Needs owner: rotate the FTP credentials and purge SETUP/.env from history (it is in pushed history since cf3e76b). Also set the `FTP_*` / `SANDBOX_FTP_*` environment secrets — CI deployed with the tracked file until now, and the deploy aborts without them. (Untracking, `.env.example` and the env reader are delivered.) | Boundary Integrity | S | `git log -- SETUP/.env`; `SETUP/deploy/env.py` |
| 2 | Needs owner: publish a `v111` tag for the CHANGELOG cut (the cut itself is delivered). | Change management | S | `CHANGELOG.md` `[v111]` |

Everything else from the audit is delivered — see [🌍Publishing/DELIVERY.md](../%F0%9F%8C%8DPublishing/DELIVERY.md).
