# Lab 3: Continuous Deploy - Frontend

## Key Outcomes
- Extend pipelines with deployment stages  
- Deploy Kubernetes services  
- Create custom Harness variables  

## Overview
In this lab, the user extends the existing pipeline to take the artifact built in the CI/Build stage and deploy it to a Kubernetes environment using a rolling deployment strategy.

---

## Walkthrough

### Step 1: Add a Deployment Stage
1. In the existing pipeline, click **Add Stage** and select **Deploy** as the Stage Type
2. Enter the following values and click **Set Up Stage**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Stage Name | <pre>`frontend`</pre>||
| Deployment Type | Kubernetes ||

---

### Step 2: Configure Service
1. Click **+ Add Service** and configure as follows:


| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name | <pre>`frontend`</pre>||
| Deployment Type | Kubernetes ||
| **Add Manifest** |||
| Manifest Type | K8s Manifest ||
| K8s Manifest Store | Code ||
| Manifest Identifier | <pre>`templates`</pre>||
| Repository | <pre>`harness-devsecops`</pre>||
| Branch | <pre>`main`</pre>||
| File/Folder Path | <pre>`harness-deploy/frontend/manifests`</pre>||
| Values.yaml | <pre>`harness-deploy/frontend/values.yaml`</pre>||
| **Add Artifact Source** |||
| Artifact Repository Type | Artifact Registry | Harness Artifact Registry (HAR), not Docker Hub |
| Artifact Source Identifier | <pre>`frontend`</pre>||
| Registry | <pre>`workshop`</pre> | Same HAR registry the Build stage pushed to |
| Image Path | <pre>`harness-workshop`</pre>||
| Tag | <pre>`<+variable.username>-<+pipeline.sequenceId>`</pre>| The field starts as `<+input>`. Click the pin, select **Expression** and paste the value |

2. Click **Save** to close the service window and then click **Continue**

---

### Step 3: Configure Environment
The target infrastructure has been pre-created. The application will be deployed to a Kubernetes cluster on the given namespace.

1. Click **- Select -** on the **Specify Environment** input box
2. Select **prod** environment and click **Apply Selected**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name | <pre>`prod`</pre>| Make sure to select the environment and infrastructure definition |

3. Click **- Select -** on the **Specify Infrastructure** input box
4. From the dropdown select **k8s**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name | <pre>`k8s`</pre>||

5. Click **Continue**

---

### Step 4: Configure Execution Strategy
1. Select **Rolling** and click **Use Strategy**
2. The frontend is a static application, so no need for canary deployment

---

### Step 5: Save and Run
1. Click **Save** to finalize the deployment stage
2. Click **Run** to execute the pipeline

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Branch Name | <pre>`main`</pre>| Not prefilled. Type `main` |
| Primary Artifact | <pre>`frontend`</pre>| Select it on the run form if it shows **- Select -** |

---

## Value Callouts

| Aspect | Description |
| :--- | :--- |
| **Unified Pipeline** | CI and CD are managed in a single pipeline, reducing handoffs. |
| **Kubernetes Native** | Harness provides native Kubernetes support with manifest management. |
| **Environment Reusability** | Environments and infrastructure can be reused across multiple services. |
