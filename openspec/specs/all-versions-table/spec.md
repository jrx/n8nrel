# all-versions-table Specification

## Purpose
TBD - created by archiving change add-all-versions-table. Update Purpose after archive.
## Requirements
### Requirement: Print all versions as a table

The CLI SHALL print n8n channels, n8n and Helm previews, Helm stable, all three
Terraform modules, and Nod as a single aligned two-column table when invoked
with the `--all` flag. The table SHALL contain exactly ten data rows in this
order: stable, beta, next, preview, helm, helm-preview, terraform,
terraform-azurerm, terraform-google, nod. The
first column SHALL identify the source and the second column SHALL hold the
resolved version. Columns SHALL be left-aligned and padded so that all version
values start at the same position.

#### Scenario: All sources resolve

- **WHEN** the user runs `n8nrel --all`
- **AND** all lookups succeed
- **THEN** the CLI SHALL print all ten rows with their resolved versions
- **AND** exit with code 0

#### Scenario: Lookups run concurrently

- **WHEN** the user runs `n8nrel --all`
- **THEN** the CLI SHALL start all independent lookups without waiting for one to
  finish before starting the next
- **AND** beta and next SHALL share the official beta channel result

### Requirement: Tolerate per-source failures

The CLI SHALL treat independent `--all` lookups independently. When a
single lookup fails (network error, non-success HTTP status, timeout, or
unexpected payload), or no eligible preview exists, the CLI SHALL print `n/a`
in the affected rows, still print the remaining rows, and exit with code 0.

#### Scenario: One source fails

- **WHEN** the user runs `n8nrel --all`
- **AND** exactly one lookup fails
- **THEN** the CLI SHALL print `n/a` for that lookup's rows
- **AND** print the resolved versions for the other sources
- **AND** exit with code 0

#### Scenario: All sources fail

- **WHEN** the user runs `n8nrel --all`
- **AND** all lookups fail
- **THEN** the CLI SHALL print `n/a` for every source
- **AND** exit with code 0
