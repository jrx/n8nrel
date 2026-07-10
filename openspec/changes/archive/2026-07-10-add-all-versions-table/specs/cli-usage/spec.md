## ADDED Requirements

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
