# App redesign screenshots

Screenshots from the local dry run of the Amex-inspired Member Card Dashboard.

## New hooks labs must reference

| Hook | Detail |
|---|---|
| `GET /health` | Post-deploy smoke. `200` + `{ status: "ok", version, deployment_type }` (also at `/deploy/health`) |
| `GET /api/orders` | Lab 13 Canary Smoke Test. Default `200`; set env `SMOKE_FAIL=1` for **HTTP 500** |
| `GET /deploy/member` | Member profile. Includes **`rewards_tier`** only after the DB3 Liquibase column exists (or `DEMO_REWARDS_TIER` for demos) |
| Rollback banner | Home page shows "Orders service unavailable — canary will roll back" when `/api/orders` returns 500 |

Existing `/deploy/execution`, `/deploy/check/release`, `/deploy/create`, `/deploy/distribution`, `/deploy/distribution/bar` contracts are unchanged.
