terraform {
  required_version = ">= 1.7.0"

  required_providers {
    harness = {
      source  = "harness/harness"
      version = "~> 0.47.7"
    }
  }
}

# Credentials come from the environment, never from this repo:
#   export HARNESS_PLATFORM_API_KEY=pat.xxxx...   (or sat.xxxx...)
provider "harness" {
  endpoint   = var.harness_endpoint
  account_id = var.account_id
}
