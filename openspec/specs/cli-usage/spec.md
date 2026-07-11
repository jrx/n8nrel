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
`--helm`, `--terraform`, or `--changelog`. In that case the CLI SHALL print an
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

