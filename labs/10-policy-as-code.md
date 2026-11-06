# Lab 10: Governance - Policy as Code

## Key Outcomes
- Create policies that evaluate when editing pipelines  
- Create policies that evaluate during pipeline execution  
- Test policy enforcement  

## Overview
In this lab, the user creates and applies policies as code to enable governance and promote self-service. Policies ensure that critical steps like approvals are always included in production pipelines.

---

## Walkthrough

### Step 1: Create a Policy to Require Approvals
1. From the secondary menu, select **Project Settings**
2. Under Security & Governance, select **Policies**
3. Click **New Policy**
4. Enter the policy name below and click **Apply**
5. From the suggested list, select **Pipeline - Approval** and click **Use This Sample**. It denies any **Deployment** stage that does not contain a **Harness Approval** step
6. Click **Save**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Policy Name | <pre>`Production Approvals`</pre> ||


7. Click **Policy Sets** and then **New Policy Set**, set the values according to the table below and click **Continue**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Policy Set Name | <pre>`Production Policies`</pre> ||
| Entity Type | Pipeline ||
| On what event should the policy set be evaluated | On Run ||

8. On **Policy evaluation criteria** click **+ Add Policy**, select **Production Approvals**, select **Error & Exit** for the failure strategy, click **Apply** and then **Continue**
9. Skip the optional **Runtime Environment** step and click **Finish**
10. New policy sets are not enforced by default. In the policy set list, turn on the **Enforced** toggle of **Production Policies**

---

### Step 2: Test the Policy
1. Open your pipeline
2. Try to run the pipeline and note the failure. The **frontend** stage has no **Harness Approval** step yet, so **Production Approvals** blocks the run. The **backend** stage already has the Approval from Lab 4, so it satisfies the policy on its own. The policy set evaluates **On Run**, so saving still works

---

### Step 3: Add an Approval Step to the Frontend Stage
1. Open the pipeline in edit mode and navigate to the **frontend** stage
2. Before the rolling deployment step, add a **Harness Approval** step

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Step Name | <pre>`Approval`</pre>||
| Type of Approval | Harness Approval ||
| User Groups | All Project Users | Open the **Project** tab to find it |

> [!NOTE]
> The step library calls this step **Harness Approval**, and the step panel calls it **Manual Approval**. They are the same step.

3. Click **Apply Changes**, then **Save** and **Run**. Both deployment stages now have an Approval, so the policy passes and the pipeline starts. Approve the frontend step when it pauses; the backend Approval from Lab 4 still sits between **Verify** and Canary Delete

---

## Value Callouts

| Aspect | Description |
| :--- | :--- |
| **Guardrails, Not Roadblocks** | Policies surface issues early without slowing down developers who follow best practices. |
| **Policy-as-Code** | Governance is defined in code and version-controlled - just like everything else. |
| **Scalable Compliance** | Teams can move fast while meeting security and audit requirements at scale. |
