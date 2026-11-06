# Backend service post-provisioning (Terraform)

Points the existing **backend** service in each attendee project in org `event_hws274` at the organizer-built image `workshop-shared/harness-workshop-backend:<backend_tag>`. This is the same idea as the ServiceNow post-provisioning: apply it **after** the org's provisioning Terraform has created the projects and services. The service YAML matches [`../../services/backend.yaml`](../../services/backend.yaml).

Before you run it:

1. The backend image has been pushed (ORGANIZER-SETUP.md §1b)
2. Your API key can edit services in all 10 projects

## Run

```bash
cd reference/terraform/backend-service
cp terraform.tfvars.example terraform.tfvars    # fill in account_id + the 10 project_ids
export HARNESS_PLATFORM_API_KEY=<pat-or-sat>    # never commit it
terraform init
terraform plan     # expect: 10 to import, 10 to change, 0 to add, 0 to destroy
terraform apply
```

If `plan` shows any **add** (create) or **destroy**, stop. It means a project ID or `service_identifier` doesn't match what provisioning created.

## Why import blocks

Provisioning already created `backend` in every project, so a plain `apply` would try to create it again and fail. `main.tf` has an `import {}` block with `for_each` over `project_ids` (this needs Terraform ≥ 1.7). It adopts each existing service into **this** state (ID `<org_id>/<project_id>/<service_id>`), and the same apply then updates it. After the first apply, the import blocks do nothing and can stay.

## Two states, one service

Afterwards, both the provisioning state and this state own the same 10 services. If provisioning is re-applied, it will put the old artifact back, and the next run of this config will flip it again. To avoid that:

- Re-run provisioning only **before** this config, never after it. Or
- Better: ask the provisioning owner to adopt this artifact source (registry `workshop-shared`, image `harness-workshop-backend`, tag variable), then drop this config with `terraform state rm 'harness_platform_service.backend'` so the services aren't deleted.

Never run `terraform destroy` here. It would delete the attendees' backend services.

## Rebuilds

When the organizers push a new backend tag, only bump the tag and re-apply:

```bash
terraform apply -var backend_tag=1.2.0
```

The only change will be `tag` in each service's YAML. Also update `reference/services/backend.yaml` so the catch-up YAML matches.

## Assumptions to confirm on a dry run (project `cut1hws274`)

- The existing service identifier is `backend` and its name is `backend`. Lab 4 and the reference YAML use that, but I haven't checked a live project. Override `service_identifier` / `service_name` if it differs.
- The provisioned service is **inline**, not stored in Git. If it's remote (Git Experience), this config needs `git_details` instead.
- `registryRef: workshop-shared` resolves from a project to the org registry. If the UI saves `org.workshop-shared`, set `registry_ref` to that.
- `apply` replaces the whole service YAML, plus `name` and `description`/`tags` (which become empty). Anything else provisioning set on the service, such as service variables or other artifact sources, is dropped. Compare with `plan` first.
