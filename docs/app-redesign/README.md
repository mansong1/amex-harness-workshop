# App redesign screenshots

Screenshots from the local dry run of the workshop demo app: a fictional card-member app ("Member Dashboard · Workshop demo", neutral MD monogram, sample data) with a release bar for the workshop.

| File | Shows |
|---|---|
| `home-stable-rewards.png` | Stable build, healthy, rewards tier from DB3, orders loading from `/api/orders` |
| `home-canary-rollback-banner.png` | Canary build with `SMOKE_FAIL=1`: smoke test failed, rolling back, Recent orders panel broken |
| `distribution.png` | Distribution Test after ~60s of simulated traffic with ~10% canary ('Compare against' set to 10%) |
| `distribution-empty.png` | Distribution Test before Start test is pressed |

Screenshot env: home shots ran against the real Django backend with env vars set by hand (`APPLICATION_VERSION=cut1hws274-42/43`, `LAST_EXECUTION_ID=42/43`, `EXECUTION_URL`, `HOSTNAME`, `DEMO_REWARDS_TIER`, `SMOKE_FAIL`). The distribution shot used a small mock backend answering ~10% canary.

## Where each displayed value comes from

Nothing in the UI code has a fallback build or execution number. When a value is missing the app shows "build unknown" / "Harness execution unknown" and no link.

| UI | API field | Pod env | Set by (`harness-deploy/backend/values.yaml`) |
|---|---|---|---|
| Build (`STABLE · <tag>`) | `/deploy/execution` `application_version` | `APPLICATION_VERSION` | `<+artifacts.primary.tag>` (CI tags `<+variable.username>-<+pipeline.sequenceId>`) |
| Harness execution #N | `last_execution_id` | `LAST_EXECUTION_ID` (falls back to `HARNESS_BUILD`) | `<+pipeline.sequenceId>` |
| Execution link | `execution_url` | `EXECUTION_URL` | `<+pipeline.executionUrl>` |
| STABLE / CANARY | `deployment_type` | `HOSTNAME` (pod name) | Kubernetes; Harness canary pods are named `...-canary-...` |
| Distribution per-response tier/build/pod | `POST /deploy/create` `deployment_type`, `application_version`, `pod` | same as above | same as above |
| Rewards tier + "New with DB update" | `/deploy/member` `rewards_tier` | `DB_*` (DB3 connection, from `values.yaml` and the `db3` secret); `DEMO_REWARDS_TIER` locally | Lab 6 Liquibase change, not the image, so it shows on stable and canary alike |
| Health chip | `/health`, `/api/orders` | `SMOKE_FAIL` | not set by the pipeline (Lab 13 sets it) |

The backend treats empty, `null` or unresolved `<+...>` values as unset.

## New hooks labs must reference

| Hook | Detail |
|---|---|
| `GET /health` | Post-deploy smoke. `200` + `{ status: "ok", version, deployment_type }` (also at `/deploy/health`) |
| `GET /api/orders` | Lab 13 Canary Smoke Test. Default `200` with three fictional sample orders; set env `SMOKE_FAIL=1` for **HTTP 500** |
| `GET /deploy/member` | Member profile, read from the first row of the Liquibase `users` table on DB3 (`DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`; SQLite when `DB_HOST` is unset). Includes **`rewards_tier`** only when that column exists and has a value, i.e. after Lab 6's `add-rewards-tier-column` + `seed-captain-canary` (or `DEMO_REWARDS_TIER` for demos). `source` is `db3`, `local` or `built-in` |
| Rollback banner | Home shows "Smoke test failed: Orders service unavailable…" and the Recent orders panel errors when `/api/orders` returns 500 |

`POST /deploy/create` also returns `deployment_type`, `application_version` and `pod`, and `/deploy/execution` also returns `execution_url` and `pod` (both additive). Existing `/deploy/execution`, `/deploy/check/release`, `/deploy/create`, `/deploy/distribution`, `/deploy/distribution/bar` contracts are unchanged.

## Mascot

Captain Canary is Harness's mascot (trademark listed in https://www.harness.io/legal/trademark; named in the Harness Marketing Brand Guide 2025, https://cms.harness.io/pdf/Marketing_Brand_Guide_2025.pdf).
The image `frontend-app/harness-webapp/src/assets/captain-canary.png` is the unmodified `public/canary-working.png` from Harness's public, MIT-licensed Captain Canary Adventure app:
https://github.com/harness-community/captain-canary-adventure-app/blob/master/public/canary-working.png

## Style

Chrome and type follow the Harness Developer Hub (developer.harness.io and `src/css/custom.css` in harness/developer-hub):
- Inter body at 16px / 1.6 with Cal Sans headings.
- Near-black text `#1b1d20` and secondary text `#4f5162`.
- White surfaces with 1px `#d9dae5` borders and no drop shadows.
- A white header with a hairline.
- Harness primary blue `#0278d5`, used sparingly.
- 12px cards and pill buttons.
- Light tag chips `#e7eef6`.

The release colours stay fixed for the projector: stable = blue `#0278d5`, canary = yellow `#FFC72C` with navy `#00175A` text, and red/green only for health.
