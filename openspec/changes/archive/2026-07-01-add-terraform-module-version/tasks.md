## 1. Argument parsing

- [x] 1.1 Add `--terraform` to the set of known flags in `parseArgs`
- [x] 1.2 Return a `terraform` boolean from `parseArgs`
- [x] 1.3 Error and exit non-zero when `--terraform` is combined with `--helm`,
      `--beta`, or `--next`
- [x] 1.4 Update the usage string to mention `--terraform`

## 2. Terraform module fetch

- [x] 2.1 Add a function that fetches `/v1/modules/n8n-io/n8n/aws` from the
      Terraform Registry and returns the `version` field, validating the
      response shape
- [x] 2.2 Throw a descriptive error including the status on a non-success
      response
- [x] 2.3 Add a function that fetches the `n8n-io/terraform-aws-n8n` GitHub
      release for a given tag (the version, no `v` prefix) and returns the tag
      and body

## 3. Wire into main

- [x] 3.1 In `main`, branch on the `terraform` flag to use the module fetch path
- [x] 3.2 Print the version by default; print the tag plus release notes when
      `--changelog` is set
- [x] 3.3 Preserve existing n8n npm and `--helm` behavior

## 4. README

- [x] 4.1 Add `README.md` with an install section and usage for the default
      lookup and `--beta`, `--next`, `--changelog`, `--helm`, `--terraform`
- [x] 4.2 Update `PRD.md` to document the `--terraform` flag

## 5. Verification

- [x] 5.1 Run `n8nrel --terraform` and confirm it prints the module version
      (for example `0.1.0`)
- [x] 5.2 Run `n8nrel --terraform --changelog` and confirm it prints the tag
      plus release notes
- [x] 5.3 Run `n8nrel --terraform --helm` and confirm it errors with a non-zero
      exit code
