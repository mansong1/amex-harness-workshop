# Lab 5: Validate the Release

## Key Outcomes
- Identify traffic differences between normal and canary instances  
- Automate release validation  

## Overview
In this lab, the user validates canary deployments by observing traffic distribution and monitoring application behavior during progressive rollouts.

---

## Walkthrough

### Step 1: Observe Canary Traffic
1. While the canary deployment is ongoing (the pipeline is running **Verify** or waiting on **Approval**), navigate to the web page. The URL is in the **lab_endpoint** project variable, as in Lab 4
2. Drill down to the **Distribution Test** tab
3. Click the **Start** button to run traffic generation
4. Observe the traffic distribution between canary and stable instances

> [!IMPORTANT]
> The Distribution Test chart calls the backend on a separate host, `<username>.backend.<lab_subdomain>.harnessevents.com`. If the chart stays empty, open that host in a new browser tab, accept the certificate warning, and go back. Run the test while the canary is still up. Once the pipeline passes **Approval** and deletes the canary, you'll only see normal traffic. The **Check Release** box may stay blank, so rely on the chart.

---

### Step 2: Validate Pipeline Execution
1. Return to the pipeline execution in Harness
2. Open the **Verify** (AI Verify v1) step and check its outcome, for example how many metrics were flagged
3. Observe how Harness automatically evaluates metrics during the canary phase. If the metrics view says **No matching data**, the canary didn't get enough traffic in the window. Run the Distribution Test again during the next canary

> [!TIP]
> The execution page doesn't always update on its own. If a step looks stuck, refresh the page.

![](../images/lab05-verify-outcome.png)
![](../images/lab05-verification-metrics.png)

---

### Bonus Activities
- If verification fails, Harness defaults to manual intervention. If it passes, the pipeline then waits on the **Approval** step from Lab 4. Decide what happens next (rollback, ignore, etc.). Lab 13 rolls a failed release back automatically
- Add a canary rollout from 10% to 50% traffic and observe how this impacts traffic distribution

---

## Value Callouts

| Aspect | Description |
| :--- | :--- |
| **Automated Validation** | Harness validates deployments automatically, reducing manual testing. |
| **Traffic Shaping** | Canary deployments allow controlled traffic distribution for risk mitigation. |
