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
  description = "Organization that holds the workshop projects."
  type        = string
  default     = "event_hws274"
}

variable "project_ids" {
  description = "The 10 attendee project identifiers, e.g. [\"cut1hws274\", ...]."
  type        = list(string)

  validation {
    condition     = length(var.project_ids) == length(distinct(var.project_ids))
    error_message = "project_ids must not contain duplicates."
  }
}

variable "service_identifier" {
  description = "Identifier of the existing backend service created by provisioning."
  type        = string
  default     = "backend"
}

variable "service_name" {
  description = "Display name of the backend service. Keep it the same as provisioning to avoid a rename."
  type        = string
  default     = "backend"
}

variable "registry_ref" {
  description = "Org-scoped HAR registry holding the backend image. HAR names are account-unique; if the UI saves an org prefix (org.workshop-shared), use that."
  type        = string
  default     = "workshop-shared"
}

variable "image_path" {
  description = "Image inside the HAR registry."
  type        = string
  default     = "harness-workshop-backend"
}

variable "backend_tag" {
  description = "Backend image tag pushed by the organisers (see ORGANISER-SETUP.md section 1b). Bump on every rebuild."
  type        = string
  default     = "1.2.1"
}

variable "code_connector_ref" {
  description = "Harness Code connector used for the manifests."
  type        = string
  default     = "hcr"
}

variable "repo_name" {
  description = "Repo holding harness-deploy/backend."
  type        = string
  default     = "harness-devsecops"
}

variable "branch" {
  description = "Branch for manifests and values."
  type        = string
  default     = "main"
}

