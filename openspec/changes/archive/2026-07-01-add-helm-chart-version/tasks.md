## 1. Argument parsing

- [x] 1.1 Add `--helm` to the set of known flags in `parseArgs`
- [x] 1.2 Return a `helm` boolean from `parseArgs`
- [x] 1.3 Error and exit non-zero when `--helm` is combined with `--beta` or
      `--next`
- [x] 1.4 Update the usage string to mention `--helm`

## 2. Helm chart fetch

- [x] 2.1 Add a function that fetches the latest release of
      `n8n-io/n8n-hosting` from the GitHub REST API
      (`/repos/n8n-io/n8n-hosting/releases/latest`)
- [x] 2.2 Return the release `tag_name` and `body`, validating the response
      shape
- [x] 2.3 Strip the leading `v` from the tag when producing the version string
- [x] 2.4 Throw a descriptive error including the status on a non-success
      response

## 3. Wire into main

- [x] 3.1 In `main`, branch on the `helm` flag to use the chart fetch path
- [x] 3.2 Print the version by default; print the tag plus release notes when
      `--changelog` is set
- [x] 3.3 Preserve existing n8n npm behavior when `--helm` is absent

## 4. Verification

- [x] 4.1 Run `n8nrel --helm` and confirm it prints the chart version (for
      example `1.10.1`)
- [x] 4.2 Run `n8nrel --helm --changelog` and confirm it prints the tag plus
      release notes
- [x] 4.3 Run `n8nrel --helm --beta` and confirm it errors with a non-zero exit
      code
- [x] 4.4 Update `PRD.md` to document the `--helm` flag
