## Why

`n8nrel` reports versions for the n8n npm package and the official n8n Helm
chart. Teams that deploy n8n on AWS with Terraform track a third product: the
official `n8n-io/n8n/aws` module on the Terraform Registry. It follows its own
release cadence, independent of both the npm package and the Helm chart. Today
users check the registry web page manually. Adding module support gives them one
command for all three products.

Separately, the CLI has no README, so new users have no single place that
documents its flags and usage. This change adds one.

## What Changes

- Add a `--terraform` flag that switches the lookup to the official
  `n8n-io/n8n/aws` Terraform Registry module.
- Resolve the module version from the Terraform Registry API
  (`/v1/modules/n8n-io/n8n/aws`), printing the `version` field as-is
  (for example `0.1.0`).
- Support `--changelog` together with `--terraform` to print the
  `n8n-io/terraform-aws-n8n` GitHub release notes for that version.
- Reject `--terraform` when combined with `--helm`, `--beta`, or `--next`.
- Add a `README.md` documenting the whole CLI: install and all flags
  (default n8n version, `--beta`, `--next`, `--changelog`, `--helm`,
  `--terraform`).

## Capabilities

### New Capabilities
- `terraform-module-version`: look up the latest official n8n AWS Terraform
  module version and release notes.

## Impact

- `src/index.ts`: argument parsing (new `--terraform` flag and conflict rules)
  and a new fetch path for the Terraform Registry plus the terraform-aws-n8n
  release notes.
- `README.md`: new file documenting installation and usage.
- `PRD.md`: document the `--terraform` flag.
- No new runtime dependencies (uses the existing `fetch`).
