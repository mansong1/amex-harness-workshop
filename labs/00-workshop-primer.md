# Workshop Primer

Two Harness navigation patterns come up in every lab. Skim them now so the labs can stay focused.

## Finding your project

1. From the left-hand side menu, click on **Account**
2. From the top navigation bar, select **Projects**
3. Click the desired project; everything will be scoped to that project

<img width="410" height="275" alt="Select your project" src="../images/primer-change-project.png" />

## Switching Harness modules

You will switch between modules several times during the workshop - CI/CD, Database DevOps and AI Agents.

1. Click on the **nine dot** menu icon
2. Select the module relevant to the step

<img width="362" height="193" alt="Switch modules" src="../images/primer-switch-module.png" />

Each lab tells you when to switch. Part 1 begins in the CI/CD module, Part 2 in Database DevOps.

## Environment values and preflight checks

The labs were written against a reference workshop environment. The values below are the ones that can differ in yours. Check them before Lab 1; if one differs, substitute your value everywhere that row's labs use it.

| Value shown in labs | Used in | What it must be | Preflight check |
| --- | --- | --- | --- |
| `harness-devsecops` | Labs 1, 3 | The Git repository holding the sample application (this repo's `frontend-app/`, `backend/`, `harness-deploy/`, `automation/`, `python-tests/`) | Open the Code Repository module: the repo exists and contains those folders. If yours has a different name, use it in Lab 1 Step 2 and Lab 3 Step 2 |
| `dockerhub` connector | Labs 1, 3 | A Docker Hub connector with push rights | Project Settings > Connectors lists `dockerhub`; open it and run the connection test |
| `nikpap/harness-workshop` | Labs 1, 3 | A Docker Hub repository you can push to | Replace with `<your-dockerhub-user>/harness-workshop` in Lab 1 Step 4 and Lab 3 Step 2 - the same value in both |
| `username` pipeline variable | Labs 1, 3 | A pipeline variable used to tag images (`<+variable.username>-<+pipeline.sequenceId>`) | In Pipeline Studio > Variables, add a String variable `username` (for example your Docker Hub username), or replace the expression with a fixed name. The tag expression must match in Labs 1 and 3 |
| `prod` environment, `k8s` infrastructure | Labs 3-5 | The deployment target for the sample application | Project Settings > Environments shows `prod` with the `k8s` infrastructure definition |
| `lab_endpoint` project variable | Labs 4, 5 | The sample application's URL | Project Settings > Variables shows `lab_endpoint` after the first deployment |
| `DB` schema, `DB1` / `DB2` / `DB3` instances | Labs 6-9 | Dev, QA and production databases registered in Database DevOps | Database DevOps > Overview lists the three instances |
| `db_changes` repository | Labs 6-9 | The Git repo the database trigger watches; its `changelog.yaml` starts from this repo's [`db/changelog.yaml`](../db/changelog.yaml) | Code Repository module shows `db_changes` with a `changelog.yaml` at its root |
| `k8s-db`, `k8s-prod` clusters | Labs 6, 9, 14 | Kubernetes clusters for containerized steps | The connectors exist and pass their connection test |
| `servicenow` connector, ven03172.service-now.com | Labs 11-15 | The project-level ServiceNow connector and sandbox | Project Settings > Connectors lists `servicenow`; your instructor provides the sandbox credentials |
| `account.harnessAnthropic` model connector | Lab 14 | The Harness-managed model connector for the Failure Analyst agent | No setup needed; it is account-managed |

The templates, policies, policy sets and the Failure Analyst agent the labs reference are listed in the [README](../README.md#what-is-pre-provisioned-for-you); confirm they exist in Project Settings before Part 3.

---

Next: [Lab 1: Build](01-build.md)
