<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/harness-logo-white.svg">
    <img src="images/harness-logo.svg" alt="Harness" width="220">
  </picture>
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

One journey in three parts. Each lab builds on the state left by the previous one, so run them in order.

| | Lab | You will |
| --- | --- | --- |
| | [Primer](labs/00-workshop-primer.md) | Get oriented: projects, modules, and your pre-provisioned environment |
| **Part 1** | **Ship the application** | |
| | [Lab 1: Build](labs/01-build.md) | Create a CI pipeline that tests, builds and pushes a deployable artifact |
| | [Lab 2: DevSecOps](labs/02-devsecops.md) | Add enforced Fortify and OWASP security scanning to the build |
| | [Lab 3: Continuous Deploy - Frontend](labs/03-continuous-deploy-frontend.md) | Deploy the frontend to Kubernetes with a rolling strategy |
| | [Lab 4: Continuous Deploy - Backend](labs/04-continuous-deploy-backend.md) | Deploy the backend as a canary, then replace manual approval with continuous verification |
| | [Lab 5: Validate the Release](labs/05-validate-release.md) | Watch canary traffic and let Harness validate the release automatically |
| **Part 2** | **Ship the database change** | |
| | [Lab 6: Deploy a Change](labs/06-database-deploy-a-change.md) | Apply schema changes from Git with Database DevOps, triggered like any other code change |
| | [Lab 7: Roll Back a Change](labs/07-database-roll-back-a-change.md) | Recover automatically from a breaking schema change |
| | [Lab 8: Enforce Governance and Policy](labs/08-database-governance-and-policy.md) | Block destructive SQL with policy as code before it reaches a database |
| | [Lab 9: Orchestrate Across Environments](labs/09-database-orchestrate-environments.md) | Promote one schema change through dev, QA and production in a single pipeline |
| **Part 3** | **Govern and protect production** | |
| | [Lab 10: Policy as Code](labs/10-policy-as-code.md) | Require approvals in production pipelines with OPA policies |
| | [Lab 11: Change Management with ServiceNow](labs/11-servicenow-change-management.md) | Raise, wait on and close ServiceNow change requests from the pipeline |
| | [Lab 12: Production Guardrails](labs/12-production-guardrails.md) | Target policies at production and verify change details right before rollout |
| | [Lab 13: Automated Rollback](labs/13-automated-rollback.md) | Roll a failed release back automatically and record it in ServiceNow |
| | [Lab 14: AI Failure Analysis](labs/14-ai-failure-analysis.md) | Put a Worker Agent to work diagnosing a rolled-back release |
| | [Lab 15: Advanced Policy as Code](labs/15-advanced-policy-as-code.md) | Block critical CVEs from reaching production at runtime |

**Format:** designed as a full-day, instructor-led workshop, and splits cleanly into two half-day sessions after Lab 5 and Lab 9.

## What is pre-provisioned for you

Your Harness project already contains everything the labs reference:

- The **workshop code repository** (`harness-devsecops`) with the sample application - this repo mirrors that application under `frontend-app/`, `backend/`, `harness-deploy/` and `automation/`
- The **prod** environment with the **k8s** infrastructure definition, the **k8s-db** and **k8s-prod** clusters for containerized steps, and the **dockerhub** connector
- Pipeline templates: **Compile Application**, **DevX Fortify Scan**, **OWASP**, **SNOW Approval**, **ServiceNow Close Ticket**, **ServiceNow Close Failed**, **ServiceNow Failure Analysis**, **Canary Smoke Test** and **Change Verified**
- The **Approval Required**, **Production Guardrail** and **Change Verified** policies and policy sets
- The **Failure Analyst** Worker Agent, using the Harness-managed `account.harnessAnthropic` model connector, and the project-level `servicenow` ServiceNow connector
- For the Database DevOps labs: the **DB** schema, database instances **DB1** (dev), **DB2** (QA) and **DB3** (production), and a `db_changes` Git repository - this repo's [`db/changelog.yaml`](db/changelog.yaml) is the starting changelog
- The **lab_endpoint** project variable with your application's URL

Connector names, repository names and the ServiceNow sandbox URL shown in the labs come from the reference environment; your instructor will confirm the values for your project.

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
| [`images/`](images) | Screenshots and logos used by the instructions |

## Credits

This workshop combines and adapts material from three open workshop repositories:

- [nikpapag/harness-devsecops-workshop](https://github.com/nikpapag/harness-devsecops-workshop) - the original DevSecOps lab series (Labs 1-6 and 15)
- [mansong1/harness-devsecops-workshop](https://github.com/mansong1/harness-devsecops-workshop) - the change-management, guardrails, rollback and AI labs (Labs 11-14)
- [nikpapag/harness-dbdevops-worksop](https://github.com/nikpapag/harness-dbdevops-worksop) - the Database DevOps lab series (Labs 6-9)

---

<sub>American Express and the American Express Blue Box logo are trademarks of American Express. Harness and the Harness logo are trademarks of Harness Inc. This workshop is enablement material prepared for an instructor-led session and implies no endorsement by either company.</sub>
