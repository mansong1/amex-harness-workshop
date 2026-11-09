# Lab 7: Roll Back a Failed Schema Change

## Key Outcomes
- Pre-validate a rollback plan next to Schema Apply
- Recover automatically when a changeset fails on DB3
- Clean up a failed changeset before the next lab

## Overview
You intentionally push a breaking Liquibase changeset. Schema Apply fails on **DB3**, and the **Schema Rollback** step (conditional on the previous step failing) restores the database. This is the same failure-handling pattern you will later see for the application canary in Part 3.

---

## Walkthrough

### Step 1: Add Schema Rollback
The rollback goes in the backend stage's **rollback** steps, not next to Schema Apply. When Schema Apply fails, the stage's failure strategy (Rollback Stage) jumps straight to the rollback steps, so a rollback step placed in the execution after Schema Apply never runs.

1. Open the **`workshop`** pipeline → **backend** stage → **Execution**, and toggle the **Rollback** view (top right)
2. Before **Canary Delete**, click **➕** → **Add Step Group**: name `DB Rollback`, **Enable container based execution** on, Kubernetes Cluster `k8s-db`
3. Inside **DB Rollback**, click **Add Step** → **Rollback Schema**

| Input | Value | Notes |
| --- | --- | --- |
| Name | <pre>`Schema Rollback`</pre> | |
| Select DB Schema | <pre>`DB`</pre> | |
| Select DB Instance | <pre>`DB3`</pre> | Same instance as Schema Apply |
| Rollback Count | <pre>`1`</pre> | |

4. **Apply Changes** and **Save**. Rollback steps only run when the stage fails, so no conditional execution is needed

---

### Step 2: Push a breaking change
In **`db_changes`**, append this changeset after `seed-captain-canary`. Prefer pasting the full file from [`db/examples/changelog-with-breaking-change.yaml`](../db/examples/changelog-with-breaking-change.yaml) if the editor mangles indentation.

```yaml
  - changeSet:
      id: add-duplicate-column
      author: harness-lab
      changes:
        - addColumn:
            tableName: members
            columns:
              - column:
                  name: id
                  type: int
                  constraints:
      rollback:
        - sql:
            comment: This is a no-op rollback for the invalid column addition.
            sql: SELECT 1;
```

Commit to `main`.

---

## Result
1. The trigger starts `workshop`
2. **Schema Apply** fails (duplicate `id` column - can you see why?)
3. The backend stage rolls back, and **Schema Rollback** runs in the rollback steps
4. Database DevOps → **Overview** shows the failed changeset on **DB3**
5. Reload your app. The **Rewards** card has lost its Platinum chip. A failed changeset is never recorded as applied, so **Rollback Count 1** undoes the most recent *applied* one, `seed-captain-canary`, using the `rollback` block you pushed in Lab 6 (it deletes the Captain Canary row). That's why every changeset should carry a rollback you trust. Lab 9 reapplies the seed and the tier comes back

> [!IMPORTANT]
> **Clean up before Lab 8.** In Database DevOps → Overview for DB3, remove the failed `add-duplicate-column` changeset (and any drop-table attempt left from experimentation). Also delete that changeset from `changelog.yaml` in Git and commit, so the next lab starts from a clean schema. Leaving it in place clutters Overview and can confuse later runs.

---

## Value Callouts

| Aspect | Description |
| :--- | :--- |
| **Automatic rollbacks** | Rollback is declared next to the forward change |
| **Same pipeline** | DB failure handling lives in `workshop`, not a side pipeline |
| **Stable by default** | A bad changeset does not leave DB3 half-applied |
