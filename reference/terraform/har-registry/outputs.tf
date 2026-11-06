output "registry_identifier" {
  description = "Registry reference for the backend build pipeline and backend-service module."
  value       = harness_platform_har_registry.workshop_shared.identifier
}

output "registry_space_ref" {
  description = "Organization scope of the registry."
  value       = harness_platform_har_registry.workshop_shared.space_ref
}

output "resource_group_identifier" {
  description = "Resource group restricted to this registry."
  value       = harness_platform_resource_group.workshop_shared_registry.identifier
}

output "reader_role_identifier" {
  description = "Org role granting registry view and download only."
  value       = harness_platform_roles.workshop_registry_reader.identifier
}

output "attendee_role_assignment_id" {
  description = "Attendee group's org-level reader assignment."
  value       = harness_platform_role_assignments.attendee_registry_reader.id
}
