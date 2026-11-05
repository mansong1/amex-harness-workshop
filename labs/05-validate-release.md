# Lab 5: Validate the Release

## Key Outcomes
- Identify traffic differences between normal and canary instances  
- Automate release validation  

## Overview
In this lab, the user validates canary deployments by observing traffic distribution and monitoring application behavior during progressive rollouts.

---

## Walkthrough

### Step 1: Observe Canary Traffic
1. While the canary deployment is ongoing, navigate to the web page. The URL is in the **lab_endpoint** project variable, as in Lab 4
2. Drill down to the **Distribution Test** tab
3. Click the **Start** button to run traffic generation
4. Observe the traffic distribution between canary and stable instances

---

### Step 2: Validate Pipeline Execution
1. Return to the pipeline execution in Harness
2. Validate the outcome of the verification step
3. Observe how Harness automatically evaluates metrics during the canary phase

![](../images/lab05-verify-outcome.png)
![](../images/lab05-verification-metrics.png)

---

### Bonus Activities
- If verification fails, Harness defaults to manual intervention. Decide what happens next (rollback, ignore, etc.). Lab 13 rolls a failed release back automatically
- Add a canary rollout from 10% to 50% traffic and observe how this impacts traffic distribution

---

## Value Callouts

| Aspect | Description |
| :--- | :--- |
| **Automated Validation** | Harness validates deployments automatically, reducing manual testing. |
| **Traffic Shaping** | Canary deployments allow controlled traffic distribution for risk mitigation. |
