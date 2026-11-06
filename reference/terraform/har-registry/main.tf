resource "harness_platform_har_registry" "workshop_shared" {
  identifier   = var.registry_identifier
  description  = "Shared backend image for the workshop"
  space_ref    = "${var.account_id}/${var.org_id}"
  parent_ref   = "${var.account_id}/${var.org_id}"
  package_type = "DOCKER"

  config {
    type = "VIRTUAL"
  }
}

resource "harness_platform_resource_group" "workshop_shared_registry" {
  identifier           = "workshop_shared_registry"
  name                 = "Workshop Shared Registry"
  account_id           = var.account_id
  org_id               = var.org_id
  allowed_scope_levels = ["organization"]

  included_scopes {
    account_id = var.account_id
    org_id     = var.org_id
    filter     = "EXCLUDING_CHILD_SCOPES"
  }

  resource_filter {
    include_all_resources = false

    resources {
      resource_type = "ARTIFACT_REGISTRY"
      identifiers   = [harness_platform_har_registry.workshop_shared.identifier]
    }
  }
}

resource "harness_platform_roles" "workshop_registry_reader" {
  identifier           = "workshop_registry_reader"
  name                 = "Workshop Registry Reader"
  org_id               = var.org_id
  allowed_scope_levels = ["organization"]
  permissions = [
    "artifact_artregistry_view",
    "artifact_artregistry_downloadartifact",
  ]
}

resource "harness_platform_role_assignments" "attendee_registry_reader" {
  org_id                    = var.org_id
  role_identifier           = harness_platform_roles.workshop_registry_reader.identifier
  resource_group_identifier = harness_platform_resource_group.workshop_shared_registry.identifier
  disabled                  = false
  managed                   = false

  principal {
    identifier  = var.attendee_user_group_identifier
    type        = "USER_GROUP"
    scope_level = var.principal_scope_level
  }
}
