# Post-provisioning update: point the existing `backend` service in every attendee
# project at the organiser-built image in the org HAR registry workshop-shared.
# Mirrors reference/services/backend.yaml.

locals {
  projects = toset(var.project_ids)
}

# Adopt the services the provisioning Terraform already created, instead of
# trying to create duplicates. ID format: <org_id>/<project_id>/<service_id>.
import {
  for_each = local.projects
  to       = harness_platform_service.backend[each.key]
  id       = "${var.org_id}/${each.key}/${var.service_identifier}"
}

resource "harness_platform_service" "backend" {
  for_each = local.projects

  identifier = var.service_identifier
  name       = var.service_name
  org_id     = var.org_id
  project_id = each.key

  yaml = <<-EOT
    service:
      name: ${var.service_name}
      identifier: ${var.service_identifier}
      orgIdentifier: ${var.org_id}
      projectIdentifier: ${each.key}
      serviceDefinition:
        type: Kubernetes
        spec:
          manifests:
            - manifest:
                identifier: templates
                type: K8sManifest
                spec:
                  store:
                    type: HarnessCode
                    spec:
                      gitConnectorRef: ${var.code_connector_ref}
                      repoName: ${var.repo_name}
                      gitFetchType: Branch
                      branch: ${var.branch}
                      paths:
                        - harness-deploy/backend/manifests
                  valuesPaths:
                    - harness-deploy/backend/values.yaml
                  skipResourceVersioning: false
          artifacts:
            primary:
              primaryArtifactRef: backend
              sources:
                - identifier: backend
                  type: Har
                  spec:
                    registryRef: ${var.registry_ref}
                    type: docker
                    spec:
                      imagePath: ${var.image_path}
                      tag: "${var.backend_tag}"
  EOT
}

output "backend_services" {
  description = "Updated backend service per project."
  value = {
    for p, s in harness_platform_service.backend :
    p => "${s.org_id}/${s.project_id}/${s.identifier} -> ${var.registry_ref}/${var.image_path}:${var.backend_tag}"
  }
}
