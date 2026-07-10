## ADDED Requirements

### Requirement: Print all versions as a table

The CLI SHALL print the latest stable, beta, and next npm versions, the latest
Helm chart version, and the latest Terraform module version as a single aligned
two-column table when invoked with the `--all` flag. The table SHALL contain
exactly five data rows in this order: stable, beta, next, helm, terraform. The
first column SHALL identify the source and the second column SHALL hold the
resolved version. Columns SHALL be left-aligned and padded so that all version
values start at the same position.

#### Scenario: All sources resolve

- **WHEN** the user runs `n8nrel --all`
- **AND** all five lookups succeed
- **THEN** the CLI SHALL print one row per source (stable, beta, next, helm,
  terraform) with each source's resolved version
- **AND** exit with code 0

#### Scenario: Lookups run concurrently

- **WHEN** the user runs `n8nrel --all`
- **THEN** the CLI SHALL start all five lookups without waiting for one to
  finish before starting the next

### Requirement: Tolerate per-source failures

The CLI SHALL treat each of the five `--all` lookups independently. When a
single lookup fails (network error, non-success HTTP status, timeout, or
unexpected payload), the CLI SHALL print `n/a` in that source's version cell,
still print the remaining rows, and exit with code 0.

#### Scenario: One source fails

- **WHEN** the user runs `n8nrel --all`
- **AND** exactly one of the five lookups fails
- **THEN** the CLI SHALL print `n/a` as that source's version
- **AND** print the resolved versions for the other four sources
- **AND** exit with code 0

#### Scenario: All sources fail

- **WHEN** the user runs `n8nrel --all`
- **AND** all five lookups fail
- **THEN** the CLI SHALL print `n/a` for every source
- **AND** exit with code 0
