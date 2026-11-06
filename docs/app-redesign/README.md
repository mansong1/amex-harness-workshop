# App redesign screenshots

Screenshots from the local dry run of the Member Dashboard workshop demo app.

| File | Shows |
|---|---|
| `home-stable-rewards.png` | Stable build, healthy, rewards tier from DB3 |
| `home-canary-rollback-banner.png` | Canary build with `SMOKE_FAIL=1`: smoke test failed, rolling back |
| `distribution.png` | Distribution Test after ~60s of simulated traffic with ~10% canary (target set to 10%) |
| `distribution-empty.png` | Distribution Test before Start test is pressed |

Colours: stable = brand blue `#006FCF`, canary = yellow `#FFC72C` with navy `#00175A` text; green/red are used only for health.

## New hooks labs must reference

| Hook | Detail |
|---|---|
| `GET /health` | Post-deploy smoke. `200` + `{ status: "ok", version, deployment_type }` (also at `/deploy/health`) |
| `GET /api/orders` | Lab 13 Canary Smoke Test. Default `200`; set env `SMOKE_FAIL=1` for **HTTP 500** |
| `GET /deploy/member` | Member profile. Includes **`rewards_tier`** only after the DB3 Liquibase column exists (or `DEMO_REWARDS_TIER` for demos) |
| Rollback banner | Home page shows "Orders service unavailable — canary will roll back" when `/api/orders` returns 500 |

`POST /deploy/create` now also returns `deployment_type`, `application_version` and `pod` (additive). Existing `/deploy/execution`, `/deploy/check/release`, `/deploy/create`, `/deploy/distribution`, `/deploy/distribution/bar` contracts are unchanged.
