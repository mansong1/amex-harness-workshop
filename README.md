<p align="center">
  <img src="images/harness-logo.svg#gh-light-mode-only" alt="Harness" width="220">
  <img src="images/harness-logo-white.svg#gh-dark-mode-only" alt="Harness" width="220">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="images/amex-logo.svg" alt="American Express" width="120">
</p>

<h1 align="center">American Express &times; Harness DevSecOps Workshop</h1>

<p align="center">
  Continuous Integration &bull; DevSecOps &bull; Continuous Delivery &bull; Continuous Verification &bull; Database DevOps &bull; Governance &bull; ServiceNow Change Management &bull; AI Worker Agents
</p>

---

Welcome to the hands-on workshop prepared for **American Express**. Over the following labs you will take a change all the way to production the way a regulated financial institution needs it done: build and scan it, deploy it behind a canary with automated verification, move the database schema with the same discipline, and wrap the whole release in change control - policy as code, ServiceNow change requests, production guardrails, automated rollback, and an AI agent that explains a failure when one happens. Guardrails without roadblocks: compliance as code, not compliance as a bottleneck.

## How the workshop fits together

One journey in three parts on a **single `workshop` pipeline**. Within each part, every lab builds on the pipeline state from the one before it, so run the labs in order. Part 2 folds Database DevOps (DB3) and a `/health` smoke test into that same pipeline - there is no second DB pipeline. Complete Part 1 before Part 2; Part 3 continues from there.

| | Lab | You will |
| --- | --- | --- |
| | [Primer](labs/00-workshop-primer.md) | Get oriented: projects, modules, and your pre-provisioned environment |
| **Part 1** | **Ship the application** | |
| | [Lab 1: Build](labs/01-build.md) | Create a CI pipeline that tests, builds and pushes a deployable artifact |
| | [Lab 2: DevSecOps](labs/02-devsecops.md) | Add enforced Fortify and OWASP security scanning to the build |
| | [Lab 3: Continuous Deploy - Frontend](labs/03-continuous-deploy-frontend.md) | Deploy the frontend to Kubernetes with a rolling strategy |
| | [Lab 4: Continuous Deploy - Backend](labs/04-continuous-deploy-backend.md) | Deploy the backend as a canary, then replace manual approval with continuous verification |
| | [Lab 5: Validate the Release](labs/05-validate-release.md) | Watch canary traffic and let Harness validate the release automatically |
| **Part 2** | **Ship the database change with the app** | |
| | [Lab 6: Ship the Database Change With the App](labs/06-database-deploy-a-change.md) | Add DB3 Schema Apply and a `/health` smoke test to the backend stage; trigger on `changelog.yaml` |
| | [Lab 7: Roll Back a Failed Schema Change](labs/07-database-roll-back-a-change.md) | Recover automatically from a breaking schema change on DB3 |
| | [Lab 8: Block Destructive Schema Changes](labs/08-database-governance-and-policy.md) | Block destructive SQL with policy as code on Schema Apply |
| | [Lab 9: Confirm the Unified Release](labs/09-database-orchestrate-environments.md) | Run the full pipeline once and verify Overview for DB3 |
| **Part 3** | **Govern and protect production** | |
| | [Lab 10: Policy as Code](labs/10-policy-as-code.md) | Require approvals in production pipelines with OPA policies |
| | [Lab 11: Change Management with ServiceNow](labs/11-servicenow-change-management.md) | Raise, wait on and close ServiceNow change requests from the pipeline |
| | [Lab 12: Production Guardrails](labs/12-production-guardrails.md) | Target policies at production and verify change details right before rollout |
| | [Lab 13: Automated Rollback](labs/13-automated-rollback.md) | Roll a failed release back automatically and record it in ServiceNow |
| | [Lab 14: AI Failure Analysis](labs/14-ai-failure-analysis.md) | Put a Worker Agent to work diagnosing a rolled-back release |
| | [Lab 15: Advanced Policy as Code](labs/15-advanced-policy-as-code.md) | Block critical CVEs from reaching production at runtime |

**Proposed format** (to be confirmed): one full instructor-led day, or three blocks of roughly two hours with the breaks between parts.

## What is pre-provisioned for you

Your Harness project already contains everything the labs reference:

- The **workshop code repository** (`harness-devsecops`) with the sample application - this repo mirrors that application under `frontend-app/`, `backend/`, `harness-deploy/` and `automation/`
- The **prod** environment with the **k8s** infrastructure definition, the **k8s-db** cluster for Database DevOps steps, and a project **Harness Artifact Registry** Docker registry named **`<project_id>-workshop`** (e.g. `cut1hws274-workshop`) (see [`reference/ORGANISER-SETUP.md`](reference/ORGANISER-SETUP.md))
- Pipeline templates: **Compile Application**, **DevX Fortify Scan**, **OWASP**, **SNOW Approval**, **ServiceNow Close Ticket**, **ServiceNow Close Failed**, **ServiceNow Failure Analysis**, **Canary Smoke Test** and **Change Verified**
- The **Approval Required**, **Production Guardrail** and **Change Verified** policies and policy sets
- The **Failure Analyst** Worker Agent, using the Harness-managed `account.harnessAnthropic` model connector, and the project-level `servicenow` ServiceNow connector
- For the Database DevOps labs: the **DB** schema, instances **DB1** / **DB2** / **DB3** (labs apply only to **DB3**), and a `db_changes` Git repository - this repo's [`db/changelog.yaml`](db/changelog.yaml) is the starting changelog
- The **lab_endpoint** project variable with your application's URL

Some values shown in the labs are environment-specific (the code repository name, the Docker connector and repository, the ServiceNow sandbox). Before Lab 1, run the [preflight checks](labs/00-workshop-primer.md#environment-values-and-preflight-checks) in the primer - they list every value, what it must point to, and how to verify it.

## Repository layout

| Path | Contents |
| --- | --- |
| [`labs/`](labs) | The workshop instructions, one file per lab |
| [`frontend-app/`](frontend-app) | Sample Angular web application used for the build and deploy labs |
| [`backend/`](backend) | Sample Django backend service |
| [`harness-deploy/`](harness-deploy) | Kubernetes manifests and values for the deployment stages |
| [`automation/`](automation) | Scanner fixtures and test results used by the security steps |
| [`python-tests/`](python-tests) | Unit tests run by the Test Intelligence step |
| [`db/changelog.yaml`](db/changelog.yaml) | Starting Liquibase changelog for the Database DevOps labs |
| [`db/examples/`](db/examples) | Full changelog files to paste when the Code editor mangles indentation |
| [`reference/`](reference) | Catch-up pipeline and service YAML after Labs 1–9, plus organiser HAR setup |
| [`images/`](images) | Screenshots and logos used by the instructions |

---

<sub>American Express and the American Express Blue Box logo are trademarks of American Express. Harness and the Harness logo are trademarks of Harness Inc. This workshop is enablement material prepared for an instructor-led session and implies no endorsement by either company.</sub>
