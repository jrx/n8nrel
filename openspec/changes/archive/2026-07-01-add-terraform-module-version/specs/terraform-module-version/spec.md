## ADDED Requirements

### Requirement: Print latest Terraform module version

The CLI SHALL print the latest official n8n AWS Terraform module version when
invoked with the `--terraform` flag. The version SHALL be resolved from the
Terraform Registry API endpoint `/v1/modules/n8n-io/n8n/aws`, using the
`version` field printed verbatim (no prefix stripping).

#### Scenario: Latest module version

- **WHEN** the user runs `n8nrel --terraform`
- **THEN** the CLI SHALL request `/v1/modules/n8n-io/n8n/aws` from the Terraform
  Registry
- **AND** print the `version` field (for example `0.1.0`) to stdout
- **AND** exit with code 0

#### Scenario: Registry API error

- **WHEN** the user runs `n8nrel --terraform`
- **AND** the Terraform Registry responds with a non-success status
- **THEN** the CLI SHALL print an error message to stderr including the status
- **AND** exit with a non-zero code

### Requirement: Print Terraform module release notes

The CLI SHALL print the `n8n-io/terraform-aws-n8n` GitHub release notes for the
latest module version when `--terraform` and `--changelog` are used together.
The release tag SHALL be the module version with no `v` prefix.

#### Scenario: Module changelog

- **WHEN** the user runs `n8nrel --terraform --changelog`
- **THEN** the CLI SHALL resolve the latest module version from the Registry
- **AND** fetch the `n8n-io/terraform-aws-n8n` GitHub release for that tag
- **AND** print the release tag followed by the release notes body
- **AND** exit with code 0

#### Scenario: Module release has no notes

- **WHEN** the user runs `n8nrel --terraform --changelog`
- **AND** the release body is empty
- **THEN** the CLI SHALL print the release tag
- **AND** SHALL NOT fail
- **AND** exit with code 0

### Requirement: Reject incompatible flags with Terraform

The CLI SHALL reject `--terraform` when combined with `--helm`, `--beta`, or
`--next`, since those flags do not apply to the Terraform module.

#### Scenario: Terraform with helm

- **WHEN** the user runs `n8nrel --terraform --helm`
- **THEN** the CLI SHALL print an error message to stderr
- **AND** exit with a non-zero code

#### Scenario: Terraform with beta or next

- **WHEN** the user runs `n8nrel --terraform --beta`
- **THEN** the CLI SHALL print an error message to stderr
- **AND** exit with a non-zero code

### Requirement: Document the CLI in a README

The repository SHALL include a `README.md` documenting installation and every
CLI flag.

#### Scenario: README covers all flags

- **WHEN** a reader opens `README.md`
- **THEN** it SHALL describe installation
- **AND** document the default n8n version lookup and the `--beta`, `--next`,
  `--changelog`, `--helm`, and `--terraform` flags with example invocations
