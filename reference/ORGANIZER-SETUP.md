# Organizer setup for the single-pipeline / HAR workshop

Registries and RBAC are created by Terraform. Attendees should not create registries during the session.

## 1. Org HAR registry (frontend)

Each workshop org gets **one** Docker HAR registry for attendee frontend builds. Provisioning Terraform's registry-module creates it and the org RBAC; organizers do not create registries by hand.

| Item | Value |
| --- | --- |
| Registry | `<org_id>-workshop`, e.g. `event_hws274-workshop` (Docker, **org** scope) |
| Image | `harness-workshop` |
| Tag | `<+variable.username>-<+pipeline.sequenceId>` (username prefix keeps attendees' tags apart) |
| RBAC | Resource group `workshop_registry`, role `workshop_registry_user` (view / download / upload), assigned to `_organization_all_users` |

HAR registry names must be unique across the whole account ([HAR best practices](https://developer.harness.io/artifact-registry/troubleshooting-and-resources/ar-best-practices)), which is why the registry is named after the org.

Confirm after provisioning:

1. Org → **Artifact Registries** lists `<org_id>-workshop`.
2. Pipeline Build step can list it (Registry Type = **Harness Artifact Registry**, Registry = `<org_id>-workshop`, Image / repo = `harness-workshop`).
3. CD services can use artifact source type **Artifact Registry** / `Har` with the same registry and `imagePath: harness-workshop`.
4. Attendees no longer need the personal Docker Hub repo `nikpap/harness-workshop` or the `dockerhub` connector for this workshop (the connector may remain for other labs; Lab 1/3 no longer use it).

Reference YAML writes the registry as `registryRef: <+org.identifier>-workshop`. If the event account rejects an expression there, replace it with the literal name for that org (or set it in the project template).

## 1b. Shared backend image (account scope, once)

The backend is **not** built by attendees: the workshop CI only builds the frontend. Organizers build `backend/Dockerfile` once and every workshop project pulls it from an **account-level** HAR registry.

| Item | Value |
| --- | --- |
| Registry | `workshop-shared` (Docker, **account** scope) |
| Image | `harness-workshop-backend` |
| Tag | Version, for example `1.1.0` (bump on every rebuild; don't rely on `latest`) |
| Used by | Backend services set by provisioning Terraform: `registryRef: workshop-shared`, `imagePath: harness-workshop-backend`, `tag` from `backend_image_tag` (also `backend_registry_ref` / `backend_image_path`) |

### Create the registry and RBAC (one-time account Terraform)

Run the account-level Terraform once (not per workshop). It creates:

- Account HAR registry `workshop-shared`
- A resource group scoped to just that registry
- A role with `artifact_artregistry_view` and `artifact_artregistry_downloadartifact`
- A role assignment to `_account_all_users` (All Account Users)

Organizers who push also need **Upload** on that registry.

### Build and push (pick one)

**A. Harness CI (no local Docker needed).** Import [`backend-image-pipeline.yaml`](backend-image-pipeline.yaml) into one organizer project. The codebase must point at a `harness-devsecops` repo that has the merged app code. Run it with `backend_tag` = the new version.

**B. Docker CLI from a laptop.** In the registry, open **Setup Client** and copy the exact login command and registry URL it shows. For Harness SaaS the image path is `pkg.harness.io/<account_id_lowercase>/workshop-shared/harness-workshop-backend:<tag>`, and the password is a Harness personal access token.

```bash
TAG=1.1.0
IMAGE=pkg.harness.io/<account_id_lowercase>/workshop-shared/harness-workshop-backend:$TAG
docker login pkg.harness.io -u <your-harness-email>   # paste the PAT when prompted
docker build --platform linux/amd64 -t "$IMAGE" backend/
docker push "$IMAGE"
```

### Point backend services at it

Provisioning Terraform (the workshop org IaCM) sets each project's `backend` service artifact to `workshop-shared/harness-workshop-backend:<backend_image_tag>`. No separate post-provisioning import is needed. The older [`terraform/backend-service/`](terraform/backend-service/) helper is superseded.

### Rebuild whenever backend code changes

Rebuild and push a **new tag** whenever `backend/` changes (for example after `feat/amex-app-redesign` merges, which adds `/health`, `/api/orders`, `/deploy/member` and the release fields). Then set `backend_image_tag` in the provisioning Terraform variables and re-apply (or update the seeded backend service tag) so projects pick up the new version.

The app's release bar shows the backend image tag (`APPLICATION_VERSION` = `<+artifacts.primary.tag>`). Every attendee's stable and canary backend run the same organizer tag, so stable and canary show the same version. What differs per attendee run is the **Harness execution #** (`<+pipeline.sequenceId>`) and whether the pod is canary or stable.

## 2. Database (unchanged provisioning, new usage)

Already required per project:

- DB schema **`DB`**
- Instances **DB1**, **DB2**, **DB3** (workshop labs apply only to **DB3**)
- Repo **`db_changes`** with starting [`db/changelog.yaml`](../db/changelog.yaml)
- Connector **`k8s-db`** for containerized DB steps

Do **not** point DB step groups at `k8s-prod` for this event: workshop-sa cannot read secrets there (`secrets ... forbidden`).

## 3. App redesign dependency

Merge or mirror **`feat/amex-app-redesign`** into the attendee `harness-devsecops` repos **and rebuild the shared backend image (section 1b)** before the session so that:

- Backend serves **`GET /health`** (200 + JSON status) for the Lab 6 smoke test
- UI can show **`rewards_tier`** after the Lab 6 changeset
- Lab 13 can still force **`/api/orders`** → 500 for the canary smoke-test failure demo

## 4. Policy seed (optional)

[`harness-deploy/policies/block-destructive-sql.rego`](../harness-deploy/policies/block-destructive-sql.rego) matches Lab 8. You may pre-create the policy and the **Prevent Destructive Changes** policy set; attendees still attach it to Schema Apply in the lab.

## 5. Catch-up YAML

[`workshop-pipeline.yaml`](workshop-pipeline.yaml) and [`services/`](services/) are the intended end state after Labs 1–9. Template identifiers (`Compile_Application`, Fortify, OWASP) and the Verify step type (`Verify` vs `AIVerify`) may need adjusting to the exact templates and step library in the event account.

## 6. Services

If **frontend** / **backend** services are pre-seeded in the project template, set each primary artifact source to:

| Field | frontend | backend |
| --- | --- | --- |
| Type | Harness Artifact Registry (`Har`) | Harness Artifact Registry (`Har`) |
| Registry | `<org_id>-workshop` (org, section 1) | `workshop-shared` (account, section 1b) |
| Image path | `harness-workshop` | `harness-workshop-backend` |
| Tag | `<+variable.username>-<+pipeline.sequenceId>` | organizer version, e.g. `1.1.0` |

Lab 3 still walks attendees through creating **frontend** when it isn't pre-seeded. Lab 4 selects **backend**; that service must already point at `workshop-shared/harness-workshop-backend` (set by provisioning). Don't point it at the frontend image: that image is the Node frontend, not Django.
