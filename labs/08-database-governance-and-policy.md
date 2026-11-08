# Lab 8: Block Destructive Schema Changes

## Key Outcomes
- Enforce policy-as-code on Schema Apply
- Stop a `dropTable` before it reaches DB3
- Understand what the policy actually evaluates

## Overview
You attach an OPA policy set to the **Schema Apply** step so destructive SQL (drop table/column/database/schema) is rejected at preview/validate time. The policy runs whenever that step runs - in this workshop, against **DB3**.

> [!NOTE]
> Older workshop material put `environments: ["prod"]` in the Rego and claimed environment-specific control. That field is **not** consulted by the Database DevOps policy evaluation today (a dry run blocked the same change on Dev). The Rego below therefore has **no** `environments` key. Scope comes from **which step** you attach the policy set to, not from that unused field.

---

## Walkthrough

### Step 1: Create the policy
1. **Project Settings** → **Policies** → **New Policy**
2. Name it `Block Destructive SQL`
3. Paste:

```opa
package db_sql

# Destructive statements are denied whenever this policy is evaluated.
# Attach the policy set only to the Schema Apply steps that should enforce it.
# (There is no working per-environment filter in this Rego surface today.)

rules := [
  {
    "types": ["mssql", "oracle", "postgres", "mysql"],
    "regex": [
      "drop\\s+table",
      "drop\\s+column",
      "drop\\s+database",
      "drop\\s+schema"
    ]
  },
  {
    "types": ["oracle"],
    "regex": ["drop\\s+catalog"]
  }
]

deny[msg] {
  some i, k, l
  rule := rules[i]
  regex.match(concat("", [".*", rule.regex[k], ".*"]), lower(input.sqlStatements[l]))
  msg := "dropping data is not permitted"
}
```

4. **Save**

---

### Step 2: Create and enforce the policy set
1. Open **Policy Sets** → **+ New Policy Set**

| Input | Value | Notes |
| --- | --- | --- |
| Name | <pre>`Prevent Destructive Changes`</pre> | |
| Entity Type | Custom | |
| On what event | On Step | |

2. **Continue** → **Add Policy** → select **Block Destructive SQL** → **Apply** → **Finish**
3. Toggle **Enforce**

**Attach it to Schema Apply**
1. Edit **`workshop`** → **backend** → **DB** → **Schema Apply**
2. **Advanced** → **Policy Enforcement** → **Add/Modify Policy Set**
3. Select **Prevent Destructive Changes** (project scope)
4. **Apply Changes** → **Save** the pipeline

---

### Step 3: Push a disallowed change
1. Confirm Lab 7's failed `add-duplicate-column` is gone from Git and from DB3 Overview
2. In `db_changes`, append:

```yaml
  - changeSet:
      id: drop-users-table
      author: harness-lab
      changes:
        - dropTable:
            tableName: users
```

   Or use [`db/examples/changelog-with-drop-table.yaml`](../db/examples/changelog-with-drop-table.yaml).

3. Commit to `main`

#### Pipeline observation
- Schema Apply evaluates the policy during preview/validate
- The step fails with **dropping data is not permitted**
- No drop reaches DB3
- If your Lab 7 **Schema Rollback** step also runs on this failure, it rolls back one more applied changeset (for example `add-rewards-tier-column`). That's expected; Lab 9 reapplies everything still in `changelog.yaml`

Remove the `drop-users-table` changeset from Git (and any failed record in Overview) before Lab 9 so the next run is clean.

---

## Value Callouts

| Aspect | Description |
| :--- | :--- |
| **Guardrails** | Destructive DDL is stopped before it touches DB3 |
| **Policy as code** | The rule is versioned Rego, not a tribal checklist |
| **Honest scope** | Enforcement follows the step you attach, not an unused `environments` field |
