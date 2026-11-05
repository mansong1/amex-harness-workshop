# Lab 9: Confirm the Unified Release

## Key Outcomes
- See app deploy + DB3 schema + smoke test in one execution
- Read Database DevOps Overview for DB3
- Know what this lighter design deliberately skips

## Overview
Labs 6–8 folded Database DevOps into the `workshop` pipeline against **DB3** only. This short lab is a clean end-to-end confirmation - not a Dev→QA→Prod promotion.

DB1 and DB2 remain in the project for exploration, but **this workshop does not deploy to them**. Promoting the same changelog across multiple instances would need extra stages and still fit on `k8s-db`, yet it would complicate the ten pre-provisioned projects. The Amex session keeps the lighter shape: one apply to DB3 inside the backend stage.

---

## Walkthrough

### Step 1: Start from a clean changelog
1. Open `db_changes` → `changelog.yaml`
2. Ensure it matches [`db/examples/changelog-with-rewards-tier.yaml`](../db/examples/changelog-with-rewards-tier.yaml): `create-users-table` plus `add-rewards-tier-column` only
3. In Database DevOps → **Overview**, remove any failed Lab 7 / Lab 8 changesets still listed on **DB3**

### Step 2: Run the full workshop pipeline
1. Open **`workshop`** → **Run**
2. Branch: `main`
3. Approve any gates you already added in earlier labs (none required yet if you are still in Part 2)
4. Watch the **backend** stage:
   - **DB** step group → **Schema Apply** on DB3 (no-op if `rewards_tier` is already applied)
   - Canary → Verify / Approval → Canary Delete
   - **Smoke Test** against `/health` → 200

### Step 3: Verify Overview
1. Database DevOps → **Overview**
2. **DB3** shows the rewards_tier changeset as applied
3. Optionally hit the app UI and confirm the member field that reads `rewards_tier` (from the app redesign) is present

---

## What you are not building (yet)
| Heavier design | This workshop |
| --- | --- |
| Separate Deploy DB Schema pipeline | One `workshop` pipeline |
| Dev / QA / Prod DB stages (DB1→DB2→DB3) | DB3 only |
| Policy "only in prod" via Rego `environments` | Policy on the Schema Apply step that targets DB3 |
| New namespaces or infrastructures | Existing `k8s-db` + DB3 |

Catch-up YAML for the merged pipeline (HAR build, HAR services, DB step group, smoke test) lives in [`reference/`](../reference/).

---

## Value Callouts

| Aspect | Description |
| :--- | :--- |
| **Unified release** | One execution tells the story from commit to healthy app + schema |
| **Provisioning-safe** | Fits the ten event projects without new environments |
| **Room to grow** | Multi-instance promotion can return later without undoing this lab |
