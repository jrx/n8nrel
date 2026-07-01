# [PRD] n8nrel - CLI tool to fetch the latest n8n version

**Summary:** A lightweight CLI tool that fetches and prints the latest stable n8n release version number.

| Created: Feb 20, 2026 | Status: WIP |
| :---- | :---- |
| Owner: jan | |

## Introduction

This PRD defines the requirements for `n8nrel`, a small single-purpose CLI tool written in TypeScript. The tool fetches the latest stable n8n version from a public API and prints it to stdout. It is intended for quick personal use on macOS, e.g. to check if a self-hosted n8n instance is up to date.

## Background

[n8n](https://n8n.io) is an open-source workflow automation platform. It publishes releases on GitHub and npm. Checking the latest version currently requires visiting the docs site, the GitHub releases page, or the npm registry manually.

The most reliable source for the latest **stable** version is the npm registry endpoint:

```
https://registry.npmjs.org/n8n/latest
```

This returns a JSON payload whose `version` field contains the current stable version (e.g. `2.6.4`). The GitHub Releases API can lag behind npm, so npm is the preferred source.

## Problem

### Personas

* **n8n self-hoster (me)** wants a fast way to check the latest stable n8n version from the terminal without opening a browser.

## Requirements and Phases

|  | Requirements |
| :---- | :---- |
| **Phase 1:** Print the latest stable n8n version | CLI command `n8nrel` fetches and prints the latest stable version |
| **Phase 2:** Helm chart version lookup | `--helm` flag fetches the latest n8n Helm chart version from `n8n-io/n8n-hosting` |

### Phase 1: Print the latest stable n8n version

#### Hypothesis Outcomes & KPIs

##### Hypothesis 1

Running `n8nrel` prints the latest stable n8n version in under 2 seconds on a typical broadband connection.

#### Requirement 1: Fetch latest version from npm registry

The tool makes an HTTP GET request to `https://registry.npmjs.org/n8n/latest` and extracts the `version` field from the JSON response.

##### Acceptance Criteria

1. Running `n8nrel` outputs the latest stable n8n version string (e.g. `2.6.4`) followed by a newline.
2. If the network request fails or the response is malformed, the tool prints a human-readable error message to stderr and exits with a non-zero exit code.
3. The tool exits with code `0` on success.

##### Considerations

1. Should the tool support fetching the `beta`/`next` version via a flag (e.g. `--beta`)? — Out of scope for Phase 1.
2. Should output include a prefix like `n8n@` or just the bare version number? — Bare version number for easy piping.

#### Requirement 2: Installable as a global CLI command

The tool can be compiled/linked so that typing `n8nrel` in a macOS terminal executes it.

##### Acceptance Criteria

1. After running `npm link` (or equivalent), the command `n8nrel` is available in the terminal.
2. The `package.json` `bin` field maps `n8nrel` to the compiled entry point.
3. The compiled output runs with Node.js without requiring `ts-node` or other dev dependencies at runtime.

##### Considerations

1. Which TypeScript build tool to use (tsc, tsx, esbuild, etc.)?
2. What minimum Node.js version should be supported?

### Phase 2: Helm chart version lookup

Teams running n8n on Kubernetes track the official Helm chart from `n8n-io/n8n-hosting`. Its version has its own release cadence and does not match the n8n application version.

#### Requirement 3: Fetch latest Helm chart version from GitHub

When `--helm` is passed, the tool makes an HTTP GET request to the GitHub REST API (`/repos/n8n-io/n8n-hosting/releases/latest`) and prints the chart version.

##### Acceptance Criteria

1. Running `n8nrel --helm` prints the latest Helm chart version (e.g. `1.10.1`) with the leading `v` stripped, followed by a newline.
2. Running `n8nrel --helm --changelog` prints the release tag (e.g. `v1.10.1`) followed by the release notes.
3. Running `n8nrel --helm --beta` or `n8nrel --helm --next` exits with a non-zero exit code and a descriptive error message, since the Helm chart has no beta or next channel.
4. If the network request fails or the response is malformed, the tool prints a human-readable error to stderr and exits with a non-zero exit code.
5. Existing `n8nrel` behavior (no `--helm` flag) is unchanged.

##### Considerations

1. The Helm chart release tags use `v`-prefixed semver (e.g. `v1.10.1`); the leading `v` is stripped for bare version output to stay consistent with the npm output format.
