# Lab 9: Database DevOps - Orchestrate Changes Across Environments

## Key Outcomes

* **Single pipeline** for multi-env DB deployments
* **Environment-specific guardrails**
* **Reduced handoffs** and manual coordination

---

## Overview

In this lab, the user promotes a database change through multiple environments — **dev, staging, and production** — using a single orchestrated pipeline. Each stage applies the change to a different target database with environment-specific configurations, policies, and approval steps. 

As changes progress, the user can view which schema versions are deployed in each environment directly in the Harness UI — removing the need to manually track or document status.

---

## Walkthrough

### Step 1: Add QA Stage (DB2)

1.  In your existing pipeline from Lab 6, after the existing stages click **Add Stage**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Stage Name | <pre>`Deploy QA`</pre>||


2. Click **Add Step** and select **Add Step Group**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name       | <pre>`DB`</pre>||
| Enable     | Containerized Execution||
| Kubernetes Cluster | k8s-prod || 

3. Inside the step group, click **Add Step**.
4. From the available out-of-the-box steps, select **Apply Schema**
5. Configure accordingly


| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name       | <pre>`Deploy Database Schema - QA`</pre>||
| Select DB Schema     | DB||
| Database Instance | DB2 || 

4. Click **Apply Changes**.


### Step 2: Add Production Stage (DB3)


1.  In your existing pipeline from Lab 6, after the existing stages click **Add Stage**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Stage Name | <pre>`Deploy Prod`</pre>||


2. Click **Add Step** and select **Add Step Group**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name       | <pre>`DB`</pre>||
| Enable     | Containerized Execution||
| Kubernetes Cluster | k8s-prod || 

3. Inside the step group, click **Add Step**.
4. From the available out-of-the-box steps, select **Apply Schema**
5. Configure accordingly


| Input      | Value     | Notes |
| ---------- | ---------------------- | ----- |
| Name       | <pre>`Deploy Database Schema - Prod`</pre>||
| Select DB Schema     | DB||
| Database Instance | DB3 || 

4. Click **Apply Changes**.


### Step 3: Save and Run the Pipeline

1.  Click **Save** to finalize the multi-stage pipeline.
2.  In Git, remove the table drop change and the broken change from Lab 7, then commit to kick off the pipeline.
3.  Observe the deployment of the previously committed schema change through:
    * Stage 1: DB1 (Dev)
    * Stage 2: DB2 (QA)
    * Stage 3: DB3 (Production)
4.  Verify successful execution in all stages.

### Step 4: View Schema Overview

1.  From the left-hand nav, go to **Overview**.
2.  Observe the green checkmarks next to Dev, QA, and Production, indicating: 
    * Where the change has been applied
    * That each deployment completed successfully
3.  This provides visibility across all environments from a single pane of glass.

---

## Value Callouts

| Feature | Description |
| :--- | :--- |
| **Unified Workflow** | One pipeline governs the full lifecycle of a database change from dev to prod. |
| **Environment-Specific Control** | Each stage can have its own policies, approvers, and rollback settings. |
| **Schema Visibility** | The Harness UI shows which schema changes have been applied where, so teams always know the current state across environments. |
| **Reduced Toil** | No need to manually coordinate between environments or hand off to DBAs. |
| **Production Readiness by Design** | Staged rollouts and approvals ensure only validated changes reach production. |
