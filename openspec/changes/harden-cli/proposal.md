## Why

A review of `src/index.ts` found the code clean but flagged a likely bug and
several robustness gaps. The most important is a missing `User-Agent` header on
GitHub REST API requests: GitHub requires one and returns `403` without it, and
Node's `fetch` (undici) sends no default `User-Agent`. That makes `--changelog`,
`--helm`, and `--terraform --changelog` fail intermittently.

The review also noted heavy duplication across the five fetch functions, no
request timeout (a hung connection hangs the CLI forever), no `--help`/`-h`
flag, silently ignored non-flag arguments (`n8nrel foo`, `--beta=x`), and no
tests despite `init.sh` looking for a test script.

## What Changes

- Send a `User-Agent` header on every outbound HTTP request (npm registry,
  GitHub REST API, Terraform Registry), fixing the intermittent `403`.
- Apply a fixed 10-second timeout to every outbound request via
  `AbortSignal.timeout(10_000)`, with a clear error message on timeout.
- Add `--help` and `-h` flags that print the usage string to stdout and exit 0.
- Reject non-flag positional arguments (for example `n8nrel foo`) and the
  `--flag=value` form (for example `--beta=x`): print the usage string to
  stderr and exit non-zero.
- Refactor the five fetch functions into two shared helpers
  (`fetchJson(url)` and `fetchGitHubRelease(url)`) so the `User-Agent`, the
  timeout, and the JSON validation live in one place. Extract the repeated
  changelog-print logic (print tag, then body if present) into one helper.
- Add unit tests for the pure `parseArgs` conflict and validation logic using
  Node's built-in `node:test` and `node:assert`, and add a `test` script so
  `init.sh` runs them.

## Capabilities

### New Capabilities
- `cli-usage`: help output and strict argument validation.
- `http-requests`: cross-cutting outbound request behavior (User-Agent header
  and request timeout).

## Impact

- `src/index.ts`: new `fetchJson`/`fetchGitHubRelease`/changelog-print helpers,
  `User-Agent` header and timeout on all requests, `--help`/`-h` handling, and
  stricter argument validation in `parseArgs`.
- `package.json`: add a `test` script (`node --test`) using the built-in test
  runner; no new runtime or dev dependencies.
- New test file(s) under `src/` for `parseArgs`.
- `README.md`: document `--help`/`-h`.
- No new dependencies.
