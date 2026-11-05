# Lab 13: Automated Rollback

## Key Outcomes
- Add a smoke test that gates the canary after it is verified
- Roll back automatically when a release fails
- Record the failed release in ServiceNow

## Overview
A canary only protects users if a failing release is stopped before it reaches them. In this lab the user adds a **Canary Smoke Test** to the backend stage, after **Verify** has checked the canary's metrics. The smoke test is set up to fail, so Harness rolls the stage back on its own and the release never reaches the stable deployment. A rollback step then closes the ServiceNow change as **Unsuccessful**, so the change record always reflects what really happened.

---

## Walkthrough

### Step 1: Add the Canary Smoke Test
Your project has been provisioned with a **Canary Smoke Test** step template.

1. From the module selection menu select **Continuous Delivery & GitOps** and open your pipeline
2. In the **backend** stage, inside the **Canary Deployment** step group, hover between **Verify** and **Canary Delete**, click **+**, select **Use template** and choose **Canary Smoke Test**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name | <pre>`Canary Smoke Test`</pre>||

3. Click **Apply Changes**. The template is a **Shell Script** step that runs on the delegate. It finds the canary pod in your `devsecops-<project_id>` namespace and smoke tests it, and its failure strategy is **Rollback Stage**, so a failed smoke test rolls the stage back without waiting for a human. The smoke test is set up to always fail, so you can see a rollback without breaking the application

---

### Step 2: Close the Change on Failure
1. In the **backend** stage **Execution**, toggle the **Rollback** view in the top right corner

![Rollback view](../images/lab9-rollback-view.png "Rollback view")

2. Click the **+** after the last rollback step, select **Use template** and choose **ServiceNow Close Failed**

![ServiceNow Close Failed template](../images/lab9-template-preview.png "ServiceNow Close Failed template")

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name | <pre>`Close Failed Ticket`</pre>| Sets the change to **Closed** with close code **Unsuccessful** and links the failed execution in the close notes |

![Close Failed Ticket](../images/lab9-close-name.png "Close Failed Ticket")

3. On the step's **Advanced** tab, under **Conditional Execution**, select **Always execute this step**, so the change is closed even if an earlier rollback step fails
4. Apply the changes and **Save** the pipeline

![Add Close Failed Ticket](../images/lab9-rollback.png "Add Close Failed Ticket")
![Rollback steps](../images/lab9-rollback-studio.png "Rollback steps")

---

### Step 3: Run and Review
1. Click **Run**, approve the change in ServiceNow as in Lab 11 and approve the Harness Approval steps
2. Once the canary is deployed, **Verify** analyses its Prometheus metrics over a 5 minute window and passes. **Canary Smoke Test** then fails with `FAILED: the canary returned HTTP 500 from /api/orders`
3. Harness rolls back the stage: **Canary Delete**, **Rolling Rollback** and then **Close Failed Ticket**. The release never reaches the stable deployment

![Canary Smoke Test rollback](../images/lab9-rollback-run.png "Canary Smoke Test rollback")

4. Open the change request in ServiceNow. It is **Closed** with close code **Unsuccessful**, and the **Closure Information** tab links to the failed execution

![Change closed unsuccessful](../images/lab9-snow-unsuccessful.png "Change closed unsuccessful")
![Closure information](../images/lab9-snow-closure.png "Closure information")

---

## Value Callouts

| Aspect | Description |
| :--- | :--- |
| **Small Blast Radius** | Only the canary is exposed to the failing release, so users stay on the healthy stable version. |
| **Self-healing Releases** | A failed check rolls the release back without human intervention. |
| **Accurate Change Records** | ServiceNow always reflects the real outcome of a release, including automated rollbacks. |
