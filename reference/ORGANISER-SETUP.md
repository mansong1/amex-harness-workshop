# Organiser setup for the single-pipeline / HAR workshop

Do this **once per attendee project** (or in the project template) before Lab 1. Attendees should not create registries during the session.

## 1. Harness Artifact Registry per project (frontend)

HAR registry names must be unique across the whole account, whatever their scope ([HAR best practices](https://developer.harness.io/artifact-registry/troubleshooting-and-resources/ar-best-practices)), so each project's registry is named after the project: **`<project_id>-workshop`**.

1. In each of the 10 projects: **Artifact Registries** → **New Artifact Registry** → **Docker**

   | Field | Value |
   | --- | --- |
   | Name / Identifier | `<project_id>-workshop`, e.g. `cut1hws274-workshop` |
   | Format | Docker |
   | Upstream proxy | Off |

2. Confirm the pipeline Build step can list it (Registry Type = **Harness Artifact Registry**, Registry = `<project_id>-workshop`, Image / repo = `harness-workshop`).
3. Confirm CD services can use artifact source type **Artifact Registry** / `Har` with the same registry and `imagePath: harness-workshop`.
4. Remove attendee dependency on the personal Docker Hub repo `nikpap/harness-workshop` and on the `dockerhub` connector for this workshop (the connector may remain for other labs; Lab 1/3 no longer use it).

Reference YAML writes the registry as `registryRef: <+project.identifier>-workshop`. If the event account rejects an expression there, replace it with the literal name per project (or set it in the project template).

## 1b. Shared backend image (org scope, once per event org)

The backend is **not** built by attendees: the workshop CI only builds the frontend. Organisers build `backend/Dockerfile` once and every project in org **event_hws274** pulls it from an org-level HAR registry used only by this workshop.

| Item | Value |
| --- | --- |
| Registry | `workshop-shared` (Docker, **org** scope: Org `event_hws274` → Artifact Registries) |
| Image | `harness-workshop-backend` |
| Tag | Version, for example `1.1.0` (bump on every rebuild; don't rely on `latest`) |
| Used by | [`services/backend.yaml`](services/backend.yaml): `registryRef: workshop-shared`, `imagePath: harness-workshop-backend`, `tag: "1.1.0"` |

### Create the registry

1. Organization **event_hws274** → **Artifact Registries** → **New Artifact Registry** → **Docker**
2. Name / Identifier: `workshop-shared`. Leave upstream proxy off.

### Build and push (pick one)

**A. Harness CI (no local Docker needed).** Import [`backend-image-pipeline.yaml`](backend-image-pipeline.yaml) into one organiser project in the org. The codebase must point at a `harness-devsecops` repo that has the merged app code. Run it with `backend_tag` = the new version.

**B. Docker CLI from a laptop.** In the registry, open **Setup Client** and copy the exact login command and registry URL it shows. For Harness SaaS the image path is `pkg.harness.io/<account_id_lowercase>/workshop-shared/harness-workshop-backend:<tag>`, and the password is a Harness personal access token.

```bash
TAG=1.1.0
IMAGE=pkg.harness.io/<account_id_lowercase>/workshop-shared/harness-workshop-backend:$TAG
docker login pkg.harness.io -u <your-harness-email>   # paste the PAT when prompted
docker build --platform linux/amd64 -t "$IMAGE" backend/
docker push "$IMAGE"
```

### RBAC so project pipelines can pull it

Deployments pull the image as the person running the pipeline, so attendees need read access to the org registry:

1. Org **event_hws274** → **Access Control** → **Resource Groups** → new group `workshop-shared-registry` with resource scope **All (including all projects)** and resources **Artifact Registries → Specified → `workshop-shared`**
2. **Roles** → new org role `Workshop Registry Reader` with Artifact Registries **View** and **Download** (pull) permissions
3. **Role Assignments** → assign `Workshop Registry Reader` + `workshop-shared-registry` to the attendee user group (or `All Organization Users`)
4. Organisers who push (option A or B) also need **Upload** on that registry

### Point the 10 backend services at it (Terraform)

After the org's provisioning Terraform has run, apply [`terraform/backend-service/`](terraform/backend-service/). It imports each project's existing `backend` service and sets its artifact to `workshop-shared/harness-workshop-backend:<backend_tag>`. Read its README first: two Terraform states will own the same services.

### Rebuild whenever backend code changes

Rebuild and push a **new tag** whenever `backend/` changes (for example after `feat/amex-app-redesign` merges, which adds `/health`, `/api/orders`, `/deploy/member` and the release fields). Then update `tag` in `services/backend.yaml` and in the backend service already seeded in each project.

The app's release bar shows the backend image tag (`APPLICATION_VERSION` = `<+artifacts.primary.tag>`). Every attendee's stable and canary backend run the same organiser tag, so stable and canary show the same version. What differs per attendee run is the **Harness execution #** (`<+pipeline.sequenceId>`) and whether the pod is canary or stable.

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
| Registry | `<project_id>-workshop` (project) | `workshop-shared` (org, section 1b) |
| Image path | `harness-workshop` | `harness-workshop-backend` |
| Tag | `<+variable.username>-<+pipeline.sequenceId>` | organiser version, e.g. `1.1.0` |

Lab 3 still walks attendees through creating **frontend** when it isn't pre-seeded. Lab 4 selects **backend**; that service must already point at `workshop-shared/harness-workshop-backend`. Don't point it at the frontend image: that image is the Node frontend, not Django.
