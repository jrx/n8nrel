## Why

`n8nrel` currently only reports versions of the n8n npm package. Teams that run
n8n on Kubernetes track a second product: the official n8n Helm chart from the
`n8n-io/n8n-hosting` repository. Its version follows its own release cadence and
does not match the n8n application version. Today users have to check GitHub
manually to find the latest chart release and its notes. Adding chart support to
`n8nrel` gives them one command for both products.

## What Changes

- Add a `--helm` flag that switches the lookup from the n8n npm package to the
  official n8n Helm chart.
- Resolve the chart version from the latest GitHub release of
  `n8n-io/n8n-hosting`, printing the version with the leading `v` stripped
  (for example `1.10.1`).
- Support `--changelog` together with `--helm` to print the n8n-hosting release
  notes for that version.
- Reject `--beta` and `--next` when combined with `--helm`, since the chart has
  no beta or next channel.

## Capabilities

### New Capabilities
- `helm-chart-version`: look up the latest official n8n Helm chart version and
  release notes from `n8n-io/n8n-hosting` GitHub releases.

## Impact

- `src/index.ts`: argument parsing (new `--helm` flag, new conflict rules) and a
  new fetch path for the n8n-hosting latest release.
- `README`/`PRD.md`: document the new flag.
- No new runtime dependencies (uses the existing `fetch` + GitHub REST API).
