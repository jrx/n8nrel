## 1. Argument parsing

- [x] 1.1 Add `all: boolean` to the `ParsedArgs` interface in `src/index.ts`
- [x] 1.2 Add `--all` to the known-flags set and set `all` from the parsed flags
- [x] 1.3 Reject `--all` combined with `--beta`, `--next`, `--helm`,
      `--terraform`, or `--changelog` (error to stderr, non-zero exit)
- [x] 1.4 Add `--all` to the `USAGE` string
- [x] 1.5 Add parser unit tests: `--all` accepted, and each mutual-exclusion
      combination rejected

## 2. Aggregate lookup and table

- [ ] 2.1 Add a `fetchAllVersions` helper that starts the five lookups
      concurrently (stable, beta, next via `fetchVersion`; Helm via
      `fetchHelmChartRelease`; Terraform via `fetchTerraformModuleVersion`)
      using `Promise.allSettled` so one failure does not abort the others
- [ ] 2.2 Map each settled result to a version string, using `n/a` for
      rejected lookups
- [ ] 2.3 Add a `formatVersionTable` helper that renders the five source/version
      rows as a plain aligned two-column table (versions left-aligned at a
      common column)
- [ ] 2.4 Unit-test `formatVersionTable` with a mix of resolved values and
      `n/a`, asserting row order and alignment

## 3. Dispatch and docs

- [ ] 3.1 Handle `all` in `main`: fetch, format, print the table, exit 0
- [ ] 3.2 Document `--all` in `README.md` (usage section and flags table)
- [ ] 3.3 Run `npm run build`, `npm run typecheck`, and `npm test`; confirm all
      pass
