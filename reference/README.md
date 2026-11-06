# Reference pipeline (Labs 1–9)

Catch-up artifacts for the **single `workshop` pipeline** design:

| File | Purpose |
| --- | --- |
| [`workshop-pipeline.yaml`](workshop-pipeline.yaml) | Build (HAR) → frontend → backend (DB3 apply + canary + `/health` smoke test) |
| [`services/frontend.yaml`](services/frontend.yaml) | Frontend service with HAR artifact source |
| [`services/backend.yaml`](services/backend.yaml) | Backend service using the organizer-built image in the org-scoped `workshop-shared` HAR registry |
| [`backend-image-pipeline.yaml`](backend-image-pipeline.yaml) | One-off organizer pipeline that builds `backend/Dockerfile` and pushes it to `workshop-shared` |
| [`terraform/har-registry/`](terraform/har-registry/) | Start-time Terraform: create the org-scoped shared Docker registry and attendee reader RBAC |
| [`terraform/backend-service/`](terraform/backend-service/) | Post-provisioning Terraform: adopt and repoint the 10 backend services to the org HAR image |
| [`ORGANIZER-SETUP.md`](ORGANIZER-SETUP.md) | Pre-provision HAR registry and related event setup |

```mermaid
flowchart LR
  subgraph build [Build]
    TI[Test Intelligence]
    Compile[Compile]
    Fortify[Fortify]
    HAR[Push to HAR]
    OWASP[OWASP]
  end
  subgraph fe [frontend]
    Roll[Rolling Deployment]
  end
  subgraph be [backend]
    DB[DB step group: Schema Apply DB3]
    Canary[Canary + Verify + Approval]
    Rolling[Rolling Deployment]
    Smoke["HTTP Smoke Test /health"]
  end
  TI --> Compile --> Fortify --> HAR --> OWASP --> Roll --> DB --> Canary --> Rolling --> Smoke
  changelog[db_changes/changelog.yaml push] -.->|trigger Update| build
```
