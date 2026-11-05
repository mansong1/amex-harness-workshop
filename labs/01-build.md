# Lab 1: Build

## Key Outcomes
- Configure a basic CI pipeline  
- Build and push artifacts to a remote repository  
- Run unit tests to verify build success  

## Overview
In this lab, the user sets up a CI pipeline that runs source code tests, builds the executable, and pushes the artifact to a remote Docker repository. This establishes the foundation for a deployable artifact that can be promoted through environments.

---

## Walkthrough

### Step 1: Create a Pipeline
1. In the Harness UI, from the left-hand menu, navigate to **Projects** and select your assigned project

![](../images/lab01-projects.png)

2. From the left-hand side menu, select **Pipelines**
3. Click **+ Create a Pipeline**, enter the following values, then click **Start**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name       | <pre>`workshop`</pre>||
| How do you want to setup your pipeline | Inline | This indicates that Harness (rather than Git) will be the source of truth for the pipeline |

---

### Step 2: Add a Build Stage
1. From Pipeline Studio, click **Add Stage** and select **Build** as the Stage Type
2. Enter the following values and click on **Set Up Stage**

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Stage Name | <pre>`Build`</pre>||
| Clone Codebase | Enabled ||
| Repository Name | <pre>`harness-devsecops`</pre>||

---

### Step 3: Configure Infrastructure
1. Navigate to the **Infrastructure** tab
2. Configure as follows:

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Infrastructure | Cloud ||

---

### Step 4: Configure Execution Steps
Navigate to the **Execution** tab and add the following steps:

**Test Intelligence Step**
1. Click **Add Step**, then **Add Step** again
2. Select **Test Intelligence** from the Step Library

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name | <pre>`Run Tests With Intelligence`</pre>||
| Command | <pre>`pip install pytest && cd ./python-tests`</pre>| The GitHub repo is a monorepo with application(s) and configuration in the same repo. Therefore we need to navigate to the application subfolder. |

3. Click **Apply Changes**

**Compile Application (Template)**
1. Click **Add Step**, then **Use Template**
2. Select the **Compile Application** template

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name | <pre>`Compile`</pre>||

3. Click **Apply Changes**

**Build and Push to Docker**
1. Click **Add Step**, then **Add Step** again
2. Select **Build and Push an image to Docker Registry** from the Step Library

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Name | <pre>`Push to DockerHub`</pre>||
| Registry Type | Third-Party Artifact Registry | The default is Artifact Registry; select Third-Party to choose a Docker connector |
| Docker Connector | dockerhub ||
| Docker Repository | <pre>`nikpap/harness-workshop`</pre>||
| Tags | <pre>`<+variable.username>-<+pipeline.sequenceId>`</pre>| Click on the pin and select expression and paste the value |
| **Optional Configuration** |||
| Dockerfile | <pre>`/harness/frontend-app/harness-webapp/Dockerfile`</pre>| This tells Harness where the Dockerfile is for building the app |
| Context | <pre>`/harness/frontend-app/harness-webapp`</pre>| This tells from where to run the instructions included in the Dockerfile |

3. Click **Apply Changes**

---

### Step 5: Save and Test the Pipeline
1. Click **Save** to finalize the pipeline
2. Click **Run** to manually execute it

| Input      | Value     | Notes |
| ---------- | ----------------------  | ----- |
| Branch Name | <pre>`main`</pre>| Prepopulated |

> [!WARNING]
> Pipeline execution is rejected by the policy engine, let's create a compliant pipeline
> Proceed to the Lab 2: DevSecOps
