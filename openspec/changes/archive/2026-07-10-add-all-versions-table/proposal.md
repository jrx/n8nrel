## Why

Today a user who wants the full picture of n8n release versions has to run
`n8nrel` up to five times: once each for stable, beta, next, Helm, and
Terraform. That is slow and awkward, especially for humans checking "where is
everything at right now". A single `--all` call that prints every version in one
aligned table removes that friction.

## What Changes

- Add a `--all` flag that resolves the latest stable, beta, and next npm
  versions, the latest Helm chart version, and the latest Terraform module
  version, then prints them as a plain aligned two-column table
  (`Source  Version`) to stdout.
- Run the five lookups concurrently.
- On a per-source failure (network error, non-success status, unexpected
  payload), print `n/a` in that source's version cell and continue; the command
  still exits 0 as long as it ran.
- Make `--all` mutually exclusive with `--beta`, `--next`, `--helm`,
  `--terraform`, and `--changelog`; combining them prints an error to stderr and
  exits non-zero.
- Update the usage string and README to document `--all`.

## Capabilities

### New Capabilities
- `all-versions-table`: resolve and print the stable, beta, next, Helm, and
  Terraform versions together as a single aligned table.

### Modified Capabilities
- `cli-usage`: the argument parser gains the `--all` flag, its mutual-exclusion
  rules, and an updated usage string.

## Impact

- `src/index.ts`: argument parsing (`ParsedArgs`, `parseArgs`, `USAGE`), a new
  aggregate lookup + table formatter, and `main` dispatch.
- `src/index.test.ts`: tests for parsing and mutual exclusion.
- `README.md`: document the `--all` flag and add a flags-table row.
- No new dependencies; reuses existing `fetch*` helpers.
