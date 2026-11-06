# Shared workshop registry (Terraform)

Run once per event organization as an organizer, after the organization and attendee user group exist. Creates a private org-scoped Docker **VIRTUAL** registry (`workshop-shared`, equivalent to a local registry), an org resource group, a view/download-only role, and its assignment to an existing attendee group. It does not create project frontend registries or grant upload access.

## Run at workshop start

1. Apply this module to create the registry and reader access.
2. Build and push a versioned backend image with [`../../backend-image-pipeline.yaml`](../../backend-image-pipeline.yaml) or Docker CLI ([organizer setup](../../ORGANISER-SETUP.md#build-and-push-pick-one)). The organizer/build identity needs existing registry **Upload** access; the reader role deliberately does not grant it.
3. After project provisioning, apply [`../backend-service/`](../backend-service/) with the same registry identifier and image tag. Read its state-ownership warning first.

```bash
cd reference/terraform/har-registry
cp terraform.tfvars.example terraform.tfvars
# Fill in account_id and the existing attendee user group identifier.
# Supply your key securely through the environment, never in tfvars or Git:
export HARNESS_PLATFORM_API_KEY=<pat-or-sat>
terraform init
terraform plan
terraform apply
```

Use Terraform >= 1.7 and the same Harness provider constraint (`~> 0.47.7`) and environment authentication as `backend-service`. The API key needs permission to create org registries, resource groups, roles, and assignments. Plan should create four resources on the first run; review before applying. Keep this state persistent and separate from the backend-service state; protect state files and never commit credentials, local tfvars, or state. Do not destroy this module while attendees use the registry.

If the registry or RBAC objects already exist, import them into this state before applying rather than creating duplicates; see the provider import documentation below. Registry names are unique across the entire account. If overriding `registry_identifier`, also update the build pipeline and backend-service `registry_ref` (and reference YAML).

## RBAC boundary and first live checks

- Resource group `workshop_shared_registry` selects only `ARTIFACT_REGISTRY` with this registry's identifier in the **organization itself** (`EXCLUDING_CHILD_SCOPES`), not all registries or all project resources. The provider disallows specific identifiers with dynamic `INCLUDING_CHILD_SCOPES`, so this intentionally replaces the previous UI instruction to include all projects.
- Role `workshop_registry_reader` grants exactly `artifact_artregistry_view` and `artifact_artregistry_downloadartifact`.
- `attendee_user_group_identifier` is required. The identifier for **All Organization Users** (including the suggested `_organization_all_users`) is **not verified**: confirm the actual identifier in Access Control or use your existing attendee group. No group is created or guessed.
- `principal_scope_level` defaults to `organization` (group in `org_id`); use `account` for a group in `account_id`. Project-scoped groups cannot be assigned at the parent org scope.
- An org-scope assignment is expected to authorize pulls of this org registry from project pipelines. **Verify on the first live run** as an attendee, including service artifact resolution and the deployed pod image pull. Check whether the service saves `workshop-shared` or `org.workshop-shared` as its registry reference. Static validation does not prove runtime authorization or cluster image-pull credentials.
- Organizers/build identities must already have `artifact_artregistry_uploadartifact` on this registry. Do not add upload permission to the attendee reader role.

## Schema sources

- [HAR registry (provider v0.47.7)](https://github.com/harness/terraform-provider-harness/blob/v0.47.7/docs/resources/platform_har_registry.md): `space_ref` and `parent_ref` are `<account_id>/<org_id>`; `package_type = "DOCKER"`, `config.type = "VIRTUAL"`.
- [Resource group (provider v0.47.7)](https://github.com/harness/terraform-provider-harness/blob/v0.47.7/docs/resources/platform_resource_group.md): `ARTIFACT_REGISTRY` and static scope selection.
- [Roles](https://github.com/harness/terraform-provider-harness/blob/v0.47.7/docs/resources/platform_roles.md) and [role assignments](https://github.com/harness/terraform-provider-harness/blob/v0.47.7/docs/resources/platform_role_assignments.md): org binding and user-group principal scope.
- [Harness permissions reference](https://developer.harness.io/harness-platform/use-harness-platform/platform-access-control/permissions-reference): exact view, download, and upload identifiers.

No live plan/apply or project-pipeline pull has been performed as part of adding this module.
