# helm-chart-version Specification

## Purpose
TBD - created by archiving change add-helm-chart-version. Update Purpose after archive.
## Requirements
### Requirement: Print latest Helm chart version

The CLI SHALL print the latest official n8n Helm chart version when invoked with
the `--helm` flag. The version SHALL be resolved from the latest GitHub release
of the `n8n-io/n8n-hosting` repository, with the leading `v` stripped from the
release tag.

#### Scenario: Latest chart version

- **WHEN** the user runs `n8nrel --helm`
- **THEN** the CLI SHALL request the latest release of `n8n-io/n8n-hosting` from
  the GitHub REST API
- **AND** print the release tag with the leading `v` removed (for example
  `1.10.1`) to stdout
- **AND** exit with code 0

#### Scenario: GitHub API error

- **WHEN** the user runs `n8nrel --helm`
- **AND** the GitHub API responds with a non-success status
- **THEN** the CLI SHALL print an error message to stderr including the status
- **AND** exit with a non-zero code

### Requirement: Print Helm chart release notes

The CLI SHALL print the n8n-hosting release notes for the latest chart version
when `--helm` and `--changelog` are used together.

#### Scenario: Chart changelog

- **WHEN** the user runs `n8nrel --helm --changelog`
- **THEN** the CLI SHALL print the latest chart release tag
- **AND** print the release notes body from the n8n-hosting GitHub release
- **AND** exit with code 0

#### Scenario: Chart release has no notes

- **WHEN** the user runs `n8nrel --helm --changelog`
- **AND** the latest release body is empty
- **THEN** the CLI SHALL print the release tag
- **AND** SHALL NOT fail
- **AND** exit with code 0

### Requirement: Reject n8n channel flags with Helm

The CLI SHALL reject `--beta` or `--next` when combined with `--helm`, because
the Helm chart has no beta or next channel.

#### Scenario: Helm with beta

- **WHEN** the user runs `n8nrel --helm --beta`
- **THEN** the CLI SHALL print an error message to stderr
- **AND** exit with a non-zero code

#### Scenario: Helm with next

- **WHEN** the user runs `n8nrel --helm --next`
- **THEN** the CLI SHALL print an error message to stderr
- **AND** exit with a non-zero code

### Requirement: Check Helm previews

`--helm --preview` SHALL use the explicit preview selection rules in cli-usage
against `n8n-io/n8n-hosting` releases with `v`-prefixed semantic version tags.
The normal `--helm` lookup SHALL continue using the release marked Latest.

#### Scenario: Helm 2.0 release candidate

- **WHEN** the latest stable chart is `v1.19.0` and the highest prerelease is `v2.0.0-rc.1`
- **THEN** `--helm` SHALL print `1.19.0`
- **AND** `--helm --preview` SHALL print `2.0.0-rc.1`
- **AND** `--helm --preview --changelog` SHALL print the preview tag and notes

#### Scenario: Release candidate numeric ordering

- **WHEN** both `v2.0.0-rc.2` and `v2.0.0-rc.10` are published prereleases
- **THEN** the preview lookup SHALL prefer `2.0.0-rc.10`
