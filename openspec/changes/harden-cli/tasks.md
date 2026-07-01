## 1. Shared network helpers

- [x] 1.1 Add a `USER_AGENT` constant (for example `n8nrel/<version>`) used on
      every outbound request.
- [x] 1.2 Add `fetchJson(url, extraHeaders?)` that sets the `User-Agent` header,
      applies `signal: AbortSignal.timeout(10_000)`, checks `response.ok`
      (throwing with status and statusText on failure), and returns the parsed
      JSON.
- [x] 1.3 Add `fetchGitHubRelease(url)` on top of `fetchJson` that sends the
      `Accept: application/vnd.github.v3+json` header and validates the release
      shape (`tag_name` string, `body` string or null), returning
      `{ tagName, body }`.
- [x] 1.4 Rewrite `fetchVersion`, `fetchChangelog`, `fetchHelmChartRelease`,
      `fetchTerraformModuleVersion`, and `fetchTerraformChangelog` to use the new
      helpers, preserving their existing error messages and return shapes.
- [x] 1.5 Ensure a request timeout produces a clear error message on stderr and
      a non-zero exit (the top-level `main().catch` already formats errors).

## 2. Argument validation and help

- [x] 2.1 In `parseArgs`, treat `--help` and `-h` as a request to print the
      usage string to stdout and exit 0, before any other validation.
- [x] 2.2 Reject positional arguments (tokens not starting with `-`) with the
      usage string on stderr and a non-zero exit.
- [x] 2.3 Reject the `--flag=value` form (any token containing `=`) as an
      unknown flag with the usage string on stderr and a non-zero exit.
- [x] 2.4 Keep the existing conflict rules (`--beta`/`--next`, `--helm`,
      `--terraform`) unchanged.

## 3. Changelog printing helper

- [x] 3.1 Extract the repeated "print tag, then body if present" logic from the
      three branches of `main` into one helper (for example
      `printRelease({ tagName, body })`).
- [x] 3.2 Use the helper in the `--terraform`, `--helm`, and default changelog
      branches.

## 4. Tests

- [x] 4.1 Export or otherwise expose `parseArgs` so it can be imported by tests
      without triggering `main`.
- [x] 4.2 Add `node:test` + `node:assert` unit tests for `parseArgs`: default
      tag, `--beta`, `--next`, `--changelog`, `--helm`, `--terraform`, each
      conflict rule, `--flag=value` rejection, positional-arg rejection, and
      unknown-flag rejection.
- [x] 4.3 Add a `test` script to `package.json` (for example
      `node --test`) that runs the tests against the built or transpiled output.
- [x] 4.4 Confirm `init.sh` now runs the tests (its `test` detection already
      excludes the npm placeholder).

## 5. Docs and verification

- [ ] 5.1 Document `--help`/`-h` in `README.md`.
- [ ] 5.2 Run `npm run typecheck`, `npm run build`, and `npm test`.
- [ ] 5.3 Manually verify `--changelog`, `--helm`, and `--terraform --changelog`
      succeed (User-Agent fix) and that `n8nrel --help` prints usage.
