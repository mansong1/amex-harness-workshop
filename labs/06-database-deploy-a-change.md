# Lab 6: Ship the Database Change With the App

## Key Outcomes
- Fold Database DevOps into the same `workshop` pipeline that deploys the app
- Apply schema changes to **DB3** as part of the backend stage
- Gate the release with a post-deploy smoke test on `/health`
- Trigger the pipeline when `changelog.yaml` changes in Git

## Overview
Part 1 left you with a single `workshop` pipeline that builds, scans and deploys the frontend and backend. In this lab you extend that **same** pipeline so a Liquibase changelog is applied to **DB3** inside the backend stage, then a post-deploy HTTP smoke test confirms the app is healthy. There is no second "Deploy DB Schema" pipeline and no new environments or infrastructure - the ten pre-provisioned projects already have DB3 and the `k8s-db` connector.

The teaching change adds a nullable `rewards_tier` column on `members` and seeds the sample member, Captain Canary, with the **Platinum** tier. The backend reads its member profile straight from the `members` table on DB3, so the tier shows up on the app's **Rewards** card as soon as the schema change lands. No new app image is needed.

> Depends on the app redesign (`feat/amex-app-redesign`), which adds `GET /health` on the backend. Use that endpoint for the smoke test.

---

## Walkthrough

### Step 1: Add a post-deploy smoke test
1. Open the existing **`workshop`** pipeline in Pipeline Studio
2. Select the **backend** stage
3. After **Rolling Deployment** (the last step of the backend execution, after the canary flow), click **+** and add an **HTTP** step. Depending on where you hover, the step lands inside or just after the **Primary Deployment** step group; either works

| Input | Value | Notes |
| --- | --- | --- |
| Name | <pre>`Smoke Test`</pre> | |
| URL | <pre>`https://<+variable.username>.backend.<+variable.lab_subdomain>.harnessevents.com/health`</pre> | Backend health endpoint from the app redesign |
| Method | GET | |
| Assertion | <pre>`<+httpResponseCode>==200`</pre> | Assertion failures are classified as **Unknown Errors** |

4. Open the step's **Advanced** tab → **Failure Strategy**
5. On failure of type **Unknown Errors**, perform action **Rollback Stage**
6. Click **Apply Changes**

This is the Amex-requested post-deploy smoke test. Lab 13 later adds a separate **Canary Smoke Test** template that intentionally fails on `/api/orders` to demonstrate automated rollback - leave that for Part 3.

---

### Step 2: Add the Database step group to the backend stage
1. Still in the **backend** stage, click **+** **before** the canary deployment steps (schema first, then app)
2. Select **Add Step Group**

| Input | Value | Notes |
| --- | --- | --- |
| Name | <pre>`DB`</pre> | |
| Enable container based execution | On | Label may read "Enable container based execution" |
| Kubernetes Cluster | <pre>`k8s-db`</pre> | Use **`k8s-db`**, not `k8s-prod`. The workshop service account cannot read secrets through `k8s-prod` |

3. Click **Apply Changes** / set up the step group

> If the UI will not let you add a containerized DB step group inside a Deploy stage, add a **Custom** stage named `database` immediately before `backend`, with the same step group on `k8s-db`. The reference YAML under [`reference/workshop-pipeline.yaml`](../reference/workshop-pipeline.yaml) shows the in-stage layout.

---

### Step 3: Add Apply Schema (DB3)
1. Inside the **DB** step group, click **Add Step** → **Apply Schema** (under DB DevOps)

| Input | Value | Notes |
| --- | --- | --- |
| Name | <pre>`Schema Apply`</pre> | |
| Container Registry | Leave the default | The UI may show it as **Harness GAR Connector** at **ACCOUNT** scope (older guides call it "Harness Image") |
| Migration Type | Liquibase | |
| Select DB Schema | <pre>`DB`</pre> | |
| Database Instance | <pre>`DB3`</pre> | Production instance only - no Dev→QA→Prod promotion in this lighter workshop |

2. Click **Apply Changes**, then **Save** the pipeline

---

### Step 4: Trigger on changelog pushes
1. In Pipeline Studio, open the **Triggers** tab (top right, not the left menu)
2. Click **New Trigger** → **Harness**

| Input | Value | Notes |
| --- | --- | --- |
| Name | <pre>`Update`</pre> | |
| Repository | <pre>`db_changes`</pre> | |
| Event | Push | |

3. Click **Continue**. Under **Conditions**:

| Input | Operator | Value |
| --- | --- | --- |
| Branch name(s) | Equals | <pre>`main`</pre> |
| Changed File | Equals | <pre>`changelog.yaml`</pre> |

4. Continue. If the trigger asks for **primary artifacts** for the frontend and backend services, select the existing primary artifact for each
5. **Create Trigger**

A push to `changelog.yaml` now runs the full `workshop` pipeline (build, deploy, schema apply, smoke test), not a separate DB pipeline.

---

### Step 5: Push the `rewards_tier` changesets
Before this step, open your app (`https://<project_id>.static.harnessevents.com/home`). The **Rewards** card says *Your rewards tier appears after the DB3 schema change adds `rewards_tier`*.

1. Open the **Code Repository** module → repo **`db_changes`**
2. Edit `changelog.yaml`

> [!WARNING]
> The Harness Code editor auto-indents on paste and will break YAML. Paste with **Ctrl+Shift+V** (plain text), or replace the whole file with the contents of [`db/examples/changelog-with-rewards-tier.yaml`](../db/examples/changelog-with-rewards-tier.yaml).

> [!NOTE]
> If your `changelog.yaml` has no `create-members-table` changeset (for example it only holds a `vendors` changeset), replace the whole file with [`db/examples/changelog-with-rewards-tier.yaml`](../db/examples/changelog-with-rewards-tier.yaml) instead of appending.

3. Append these two changesets **after** the existing `create-members-table` entry (keep the file's existing indentation style). The first adds the column; the second inserts Captain Canary with a tier, and declares how to undo itself:

```yaml
  - changeSet:
      id: add-rewards-tier-column
      author: harness-lab
      changes:
        - addColumn:
            tableName: members
            columns:
              - column:
                  name: rewards_tier
                  type: varchar(50)
                  constraints:
                    nullable: true
  - changeSet:
      id: seed-captain-canary
      author: harness-lab
      comment: Sample member for the workshop app. Its rewards tier is what Lab 6 makes appear.
      changes:
        - insert:
            tableName: members
            columns:
              - column:
                  name: id
                  valueNumeric: 1
              - column:
                  name: first_name
                  value: Captain
              - column:
                  name: last_name
                  value: Canary
              - column:
                  name: email
                  value: captain.canary@example.com
              - column:
                  name: rewards_tier
                  value: Platinum
      rollback:
        - delete:
            tableName: members
            where: id = 1
```

4. Commit to `main`. The **Update** trigger should start a `workshop` run
5. When the run finishes, open **Database DevOps → Overview** and confirm both changesets are applied on **DB3**
6. Reload your app. The **Rewards** card now shows a **Platinum** chip tagged **New with DB update**. The app image didn't change; the backend reads the tier from DB3

> [!TIP]
> Your backend's `/deploy/member` endpoint (the Smoke Test URL from Step 1, with `/deploy/member` in place of `/health`) returns the raw profile. After this lab it includes `"rewards_tier": "Platinum"` and `"source": "db3"`. If `source` is `built-in`, the backend couldn't read a row from DB3.

You can also **Run** the pipeline manually (Branch: `main`) if you want to watch Schema Apply and Smoke Test in the same execution as the canary.

---

## Value Callouts

| Aspect | Description |
| :--- | :--- |
| **One pipeline** | App build, deploy, schema apply and smoke test share one release |
| **No new provisioning** | Reuses DB3 and `k8s-db` already present in each attendee project |
| **Git as source of truth** | Schema changes review and ship like application code |
| **Data, not just DDL** | The seed changeset carries its own rollback, so Lab 7 can undo it cleanly |
| **Health gate** | `/health` must return 200 or the stage rolls back |
