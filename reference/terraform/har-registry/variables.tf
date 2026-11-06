variable "account_id" {
  description = "Harness account identifier (Account Settings > Overview)."
  type        = string
}

variable "harness_endpoint" {
  description = "Harness API gateway. SaaS default; change only for a different cluster."
  type        = string
  default     = "https://app.harness.io/gateway"
}

variable "org_id" {
  description = "Organization that holds the workshop registry and projects."
  type        = string
  default     = "event_hws274"
}

variable "registry_identifier" {
  description = "Org-scoped Docker registry identifier; must be unique across the account."
  type        = string
  default     = "workshop-shared"
}

variable "attendee_user_group_identifier" {
  description = "Existing attendee user group identifier. Confirm it in Access Control; no all-users identifier is assumed."
  type        = string

  validation {
    condition     = length(trimspace(var.attendee_user_group_identifier)) > 0
    error_message = "Provide the existing attendee user group identifier."
  }
}

variable "principal_scope_level" {
  description = "Scope where the attendee group exists: organization (this org) or account (this account)."
  type        = string
  default     = "organization"

  validation {
    condition     = contains(["account", "organization"], var.principal_scope_level)
    error_message = "Use account or organization; a project-scoped group cannot be bound at org scope."
  }
}
