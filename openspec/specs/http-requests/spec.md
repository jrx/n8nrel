# http-requests Specification

## Purpose
TBD - created by archiving change harden-cli. Update Purpose after archive.
## Requirements
### Requirement: Send a User-Agent header on every outbound request

The CLI SHALL send a non-empty `User-Agent` header on every outbound HTTP
request, including the npm registry, the GitHub REST API, and the Terraform
Registry. The GitHub REST API rejects requests without a `User-Agent` with a
`403` status, so this header SHALL be present on all GitHub requests.

#### Scenario: GitHub request carries a User-Agent

- **WHEN** the CLI requests a release from the GitHub REST API (for
  `--changelog`, `--helm`, or `--terraform --changelog`)
- **THEN** the request SHALL include a non-empty `User-Agent` header
- **AND** the request SHALL NOT fail with a `403` caused by a missing
  `User-Agent`

#### Scenario: All product lookups carry a User-Agent

- **WHEN** the CLI requests the npm registry, the GitHub REST API, or the
  Terraform Registry
- **THEN** each request SHALL include the same non-empty `User-Agent` header

### Requirement: Time out slow requests

The CLI SHALL abort any outbound HTTP request that does not complete within 10
seconds, using a request timeout signal. On timeout the CLI SHALL print an error
message to stderr and exit with a non-zero code rather than hanging.

#### Scenario: Request exceeds the timeout

- **WHEN** an outbound request does not complete within 10 seconds
- **THEN** the CLI SHALL abort the request
- **AND** print an error message to stderr
- **AND** exit with a non-zero code

#### Scenario: Request completes within the timeout

- **WHEN** an outbound request completes within 10 seconds
- **THEN** the CLI SHALL process the response normally
- **AND** SHALL NOT abort the request

