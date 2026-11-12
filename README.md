# n8nrel

A small CLI tool that checks n8n releases, the official Helm chart, the official AWS, Azure, and Google Terraform modules, and Nod. n8n version checks use GitHub, not npm, so they also cover container-only n8n 3.x releases.

## Install

```sh
git clone https://github.com/jan/n8nrel.git
cd n8nrel
npm install
npm run build
npm link
```

After `npm link`, `n8nrel` is available anywhere in your terminal.

## Usage

```
n8nrel [--beta | --next | --preview] [--changelog] [--helm | --terraform | --terraform-azurerm | --terraform-google | --nod] [--all] [--help]
```

### n8n (default)

Print the latest stable n8n version from the `n8n-io/n8n` GitHub release marked Latest:

```sh
n8nrel
# 2.47.4
```

Print the official beta channel version:

```sh
n8nrel --beta
# 2.48.1
```

`--next` follows the same channel. Upstream publishes beta and next together;
both resolve the version in `packages/cli/package.json` at GitHub's moving
`beta` tag, without requiring an npm publication:

```sh
n8nrel --next
# 2.48.1
```

Check early-access releases independently of the official beta channel:

```sh
n8nrel --preview
# 3.2.0
```

`--preview` selects the highest semantic version marked as a prerelease on
GitHub. It checks all release pages rather than taking the most recently
published patch. Bare versions such as `3.2.0` and `alpha`, `beta`, or `rc`
suffixes are eligible; drafts, moving channel tags, other packages, and
experimental/nightly/dev builds are excluded. This is not a recommendation
to upgrade. If there is no eligible preview, the command fails rather than
silently returning a stable release.

Print the GitHub release notes for the latest stable version:

```sh
n8nrel --changelog
# n8n@2.47.4
# ## What's Changed
# ...
```

`--changelog` also works with `--beta`, `--next`, and `--preview`.

### Helm chart

Print the latest n8n Helm chart version from the `n8n-io/n8n-hosting` GitHub repository:

```sh
n8nrel --helm
# 1.19.0
```

Check the Helm 2.0 release candidate using the same preview selection rules:

```sh
n8nrel --helm --preview
# 2.0.0-rc.1
```

Print the release notes for the latest Helm chart version:

```sh
n8nrel --helm --changelog
# v1.19.0
# ## What's Changed
# ...
```

`--helm --preview --changelog` prints the selected preview's notes. `--helm`
cannot be combined with `--beta` or `--next`. Once Helm 2.0 is marked Latest
upstream, the ordinary `--helm` lookup will report it without a code change.

### Terraform modules

Check published versions in the Terraform Registry:

```sh
n8nrel --terraform
# 0.6.0 (AWS: n8n-io/n8n/aws)

n8nrel --terraform-azurerm
# 0.1.0 (Azure: n8n-io/n8n/azurerm)

n8nrel --terraform-google
# 0.1.0 (Google Cloud: n8n-io/n8n/google)
```

`--terraform` retains its existing AWS meaning. Each command prints only the
version, not the provider description shown in the comments above. Module
releases marked as prereleases on GitHub are still reported when published
in the Registry; these modules currently use `0.x` versions.

Add `--changelog` to any module flag to fetch the corresponding versioned
GitHub release from `n8n-io/terraform-{aws,azurerm,google}-n8n`:

```sh
n8nrel --terraform-google --changelog
# 0.1.0
# ## What's Changed
# ...
```

Terraform flags cannot be combined with another source flag, `--beta`,
`--next`, or `--preview`.

### Nod

Check the latest desktop release from `n8n-io/nod`. Version output removes
the `nod-v` prefix; changelog output preserves the original release tag:

```sh
n8nrel --nod
# 0.6.2

n8nrel --nod --changelog
# nod-v0.6.2
# ### Downloads
# ...
```

`--nod` cannot be combined with another source flag, `--beta`, `--next`, or
`--preview`.

### All versions

Print all ten version rows in one aligned table. Example snapshot from
2026-11-12:

```sh
n8nrel --all
# stable             2.47.4
# beta               2.48.1
# next               2.48.1
# preview            3.2.0
# helm               1.19.0
# helm-preview       2.0.0-rc.1
# terraform          0.6.0
# terraform-azurerm  0.1.0
# terraform-google   0.1.0
# nod                0.6.2
```

Lookups run concurrently, with beta and next sharing one result. If a lookup
fails, its rows print `n/a` and the command still exits 0. `n/a` can mean no
preview exists, an API error, or a network failure. Run that source on its
own for an error message and exit code 1. `--all` cannot be combined with
other flags except `--help`.

Every HTTP request has a ten-second timeout. Preview checks paginate the
release history and can take longer overall. GitHub applies API rate limits;
optionally provide `GITHUB_TOKEN` in your environment for a higher limit.
The token is sent only to `api.github.com`, never to the Terraform Registry
or raw GitHub content. No Docker, Helm, or Terraform installation is needed.

## Flags

| Flag | Description |
|------|-------------|
| *(none)* | Print the latest stable n8n GitHub release version |
| `--beta` | Follow n8n's official beta channel |
| `--next` | Alias for the official beta channel |
| `--preview` | Highest published n8n or Helm prerelease, excluding experimental builds |
| `--changelog` | Also print the GitHub release notes |
| `--helm` | Look up the latest n8n Helm chart version |
| `--terraform` | Look up the latest n8n AWS Terraform module version |
| `--terraform-azurerm` | Look up the latest n8n Azure Terraform module version |
| `--terraform-google` | Look up the latest n8n Google Terraform module version |
| `--nod` | Look up the latest Nod desktop release |
| `--all` | Print all supported versions as a table |
| `--help`, `-h` | Print the usage string and exit |

## Release sources and upgrade scope

Sources checked on 2026-11-12:

- [n8n 3.0 breaking changes](https://docs.n8n.io/changelog/v30-breaking-changes): n8n 3.x no longer publishes a runnable npm package. [GitHub releases](https://github.com/n8n-io/n8n/releases) remain available.
- [Upstream channel publishing](https://github.com/n8n-io/n8n/blob/3.x/.github/workflows/release-push-to-channel.yml): beta and next are aliases for the same container release.
- [Helm releases](https://github.com/n8n-io/n8n-hosting/releases) and [Helm 2.0 upgrade guide](https://github.com/n8n-io/n8n-hosting/blob/main/charts/n8n/UPGRADING.md): 2.0 is currently a release candidate with breaking configuration changes.
- Terraform Registry: [AWS](https://registry.terraform.io/modules/n8n-io/n8n/aws/latest), [Azure](https://registry.terraform.io/modules/n8n-io/n8n/azurerm/latest), and [Google](https://registry.terraform.io/modules/n8n-io/n8n/google/latest).
- [Nod releases](https://github.com/n8n-io/nod/releases): desktop releases use `nod-v` tags.

n8nrel checks release availability, not whether a Terraform module, chart,
or existing deployment is compatible with a particular n8n version. Review
the relevant release notes and migration guides before upgrading.
