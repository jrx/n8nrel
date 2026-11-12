# cli-usage Specification

## Purpose
TBD - created by archiving change harden-cli. Update Purpose after archive.
## Requirements
### Requirement: Print usage on --help and -h

The CLI SHALL print the usage string to stdout and exit with code 0 when invoked
with `--help` or `-h`. The usage string SHALL list the supported flags.

#### Scenario: Long help flag

- **WHEN** the user runs `n8nrel --help`
- **THEN** the CLI SHALL print the usage string to stdout
- **AND** exit with code 0
- **AND** SHALL NOT perform any network request

#### Scenario: Short help flag

- **WHEN** the user runs `n8nrel -h`
- **THEN** the CLI SHALL print the usage string to stdout
- **AND** exit with code 0
- **AND** SHALL NOT perform any network request

#### Scenario: Help takes precedence over other flags

- **WHEN** the user runs `n8nrel --help` together with any other flags
- **THEN** the CLI SHALL print the usage string to stdout
- **AND** exit with code 0

### Requirement: Reject positional arguments

The CLI SHALL reject any argument that is not a recognized flag. A positional
argument (a token that does not start with `--` or `-h`) SHALL cause the CLI to
print the usage string to stderr and exit with a non-zero code.

#### Scenario: Unknown positional argument

- **WHEN** the user runs `n8nrel foo`
- **THEN** the CLI SHALL print the usage string to stderr
- **AND** exit with a non-zero code
- **AND** SHALL NOT print a version

### Requirement: Reject the --flag=value form

The CLI SHALL reject flags supplied in the `--flag=value` form (for example
`--beta=x`), because no flag takes a value. Such a token SHALL be treated as an
unknown flag: the CLI SHALL print the usage string to stderr and exit with a
non-zero code.

#### Scenario: Flag with an attached value

- **WHEN** the user runs `n8nrel --beta=x`
- **THEN** the CLI SHALL print an error and the usage string to stderr
- **AND** exit with a non-zero code
- **AND** SHALL NOT print a version

#### Scenario: Unknown flag

- **WHEN** the user runs `n8nrel --nope`
- **THEN** the CLI SHALL print an error and the usage string to stderr
- **AND** exit with a non-zero code

### Requirement: Recognize the --all flag

The CLI SHALL recognize `--all` as a valid flag and SHALL list it in the usage
string alongside the other supported flags.

#### Scenario: --all is a known flag

- **WHEN** the user runs `n8nrel --all`
- **THEN** the CLI SHALL NOT treat `--all` as an unknown flag
- **AND** SHALL NOT print the unknown-flag error

#### Scenario: Usage string lists --all

- **WHEN** the user runs `n8nrel --help`
- **THEN** the printed usage string SHALL include `--all`

### Requirement: --all is mutually exclusive with other flags

The CLI SHALL reject `--all` when combined with any of `--beta`, `--next`,
`--preview`, `--helm`, `--terraform`, `--terraform-azurerm`,
`--terraform-google`, `--nod`, or `--changelog`. In that case the CLI SHALL print an
error message to stderr and exit with a non-zero code, without performing any
network request.

#### Scenario: --all with a source flag

- **WHEN** the user runs `n8nrel --all --helm`
- **THEN** the CLI SHALL print an error message to stderr
- **AND** exit with a non-zero code
- **AND** SHALL NOT print a version table

#### Scenario: --all with --changelog

- **WHEN** the user runs `n8nrel --all --changelog`
- **THEN** the CLI SHALL print an error message to stderr
- **AND** exit with a non-zero code
- **AND** SHALL NOT print a version table

### Requirement: Resolve n8n without npm

The default lookup SHALL resolve the version from the GitHub release marked
Latest in `n8n-io/n8n`, stripping `n8n@`. `--beta` and `--next` SHALL both
resolve the version in `packages/cli/package.json` at the moving GitHub `beta`
tag. n8n lookups SHALL NOT depend on the npm registry.

#### Scenario: Container-only release

- **WHEN** the latest stable GitHub release is `n8n@3.2.1`
- **AND** npm still reports a 2.x version
- **THEN** the default lookup SHALL print `3.2.1`
- **AND** `--changelog` SHALL print the versioned release tag and notes

#### Scenario: Beta differs from early access

- **WHEN** the official beta pointer is `2.48.1` and early access is `3.2.0`
- **THEN** both `--beta` and `--next` SHALL print `2.48.1`
- **AND** their `--changelog` output SHALL use `n8n@2.48.1`

### Requirement: Explicit preview selection

`--preview` SHALL select the highest semantic version marked as a published
GitHub prerelease for n8n, or for the chart when combined with `--helm`.
Selection SHALL consider all release pages, exclude drafts and other packages,
and accept bare versions or suffixes beginning with the `alpha`, `beta`, or
`rc` identifier. Experimental, nightly, and dev builds SHALL NOT qualify.
`--changelog` SHALL print the selected preview's original tag and notes.

#### Scenario: Newer backports do not hide early access

- **WHEN** a 2.x beta was published more recently than a 3.x early-access release
- **THEN** `--preview` SHALL select the higher 3.x version
- **AND** SHALL find it even if it is on a later release-list page

#### Scenario: No preview exists

- **WHEN** no eligible prerelease exists
- **THEN** a standalone preview lookup SHALL fail with an error and exit code 1
- **AND** SHALL NOT substitute a stable release

### Requirement: Check Nod desktop releases

`--nod` SHALL resolve the GitHub release marked Latest in `n8n-io/nod` and
strip `nod-v` for version-only output. `--nod --changelog` SHALL print the
original tag and release notes, accepting a null or empty notes body.

#### Scenario: Nod version and changelog

- **WHEN** the latest Nod release is `nod-v0.6.2`
- **THEN** `--nod` SHALL print `0.6.2`
- **AND** `--nod --changelog` SHALL start with `nod-v0.6.2`

### Requirement: Validate source and channel combinations

All supported flags SHALL appear in help. The CLI SHALL reject multiple source
flags from `--helm`, `--terraform`, `--terraform-azurerm`, `--terraform-google`,
and `--nod`. `--beta`, `--next`, and `--preview` SHALL be mutually exclusive.
Beta and next SHALL apply only to n8n; preview SHALL apply only to n8n or Helm.

#### Scenario: Invalid combinations do not access the network

- **WHEN** the user supplies conflicting sources or unsupported channels
- **THEN** the CLI SHALL print an error and exit with code 1 before any lookup
