# Organiser setup for the single-pipeline / HAR workshop

Do this **once per attendee project** (or in the project template) before Lab 1. Attendees should not create registries during the session.

## 1. Harness Artifact Registry (replaces Docker Hub)

1. In each project: **Artifact Registries** → **New Artifact Registry**
2. Create a **Docker** registry:

   | Field | Value |
   | --- | --- |
   | Name | `workshop` |
   | Identifier | `workshop` |
   | Format | Docker |

3. Confirm the pipeline Build step can list it (Registry Type = **Harness Artifact Registry**, Registry = `workshop`, Image / repo = `harness-workshop`).
4. Confirm CD services can use artifact source type **Artifact Registry** / `Har` with the same `registryRef: workshop` and `imagePath: harness-workshop`.
5. Remove attendee dependency on the personal Docker Hub repo `nikpap/harness-workshop` and on the `dockerhub` connector for this workshop (the connector may remain for other labs; Lab 1/3 no longer use it).

If HAR is licensed only at account/org scope, create one Docker registry per project still (identifier `workshop`) so the lab tables stay identical across the ten projects.

## 2. Database (unchanged provisioning, new usage)

Already required per project:

- DB schema **`DB`**
- Instances **DB1**, **DB2**, **DB3** (workshop labs apply only to **DB3**)
- Repo **`db_changes`** with starting [`db/changelog.yaml`](../db/changelog.yaml)
- Connector **`k8s-db`** for containerized DB steps

Do **not** point DB step groups at `k8s-prod` for this event: workshop-sa cannot read secrets there (`secrets ... forbidden`).

## 3. App redesign dependency

Merge or mirror **`feat/amex-app-redesign`** into the attendee `harness-devsecops` repos before the session so that:

- Backend serves **`GET /health`** (200 + JSON status) for the Lab 6 smoke test
- UI can show **`rewards_tier`** after the Lab 6 changeset
- Lab 13 can still force **`/api/orders`** → 500 for the canary smoke-test failure demo

## 4. Policy seed (optional)

[`harness-deploy/policies/block-destructive-sql.rego`](../harness-deploy/policies/block-destructive-sql.rego) matches Lab 8. You may pre-create the policy and the **Prevent Destructive Changes** policy set; attendees still attach it to Schema Apply in the lab.

## 5. Catch-up YAML

[`workshop-pipeline.yaml`](workshop-pipeline.yaml) and [`services/`](services/) are the intended end state after Labs 1–9. Template identifiers (`Compile_Application`, Fortify, OWASP) and the Verify step type (`Verify` vs `AIVerify`) may need adjusting to the exact templates and step library in the event account.

## 6. Services

If **frontend** / **backend** services are pre-seeded in the project template, set each primary artifact source to:

| Field | Value |
| --- | --- |
| Type | Harness Artifact Registry (`Har`) |
| Registry | `workshop` |
| Image path | `harness-workshop` |
| Tag | `<+variable.username>-<+pipeline.sequenceId>` |

Lab 3 still walks attendees through creating **frontend** when it is not pre-seeded. Lab 4 selects **backend**; that service must already use HAR (or attendees will pull from the old Docker Hub path).
