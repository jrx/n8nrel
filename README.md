# n8nrel

A small CLI tool that fetches and prints the latest n8n release version. Supports the npm package, the official Helm chart, and the official AWS Terraform module.

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
n8nrel [--beta | --next] [--changelog] [--helm] [--terraform]
```

### n8n npm package (default)

Print the latest stable n8n version from the npm registry:

```sh
n8nrel
# 1.98.1
```

Print the latest beta version:

```sh
n8nrel --beta
# 1.99.0-beta.1
```

Print the latest next (release candidate) version:

```sh
n8nrel --next
# 1.100.0-rc.2
```

Print the GitHub release notes for the latest stable version:

```sh
n8nrel --changelog
# n8n@1.98.1
# ## What's Changed
# ...
```

`--changelog` also works with `--beta` and `--next`.

### Helm chart

Print the latest n8n Helm chart version from the `n8n-io/n8n-hosting` GitHub repository:

```sh
n8nrel --helm
# 1.10.1
```

Print the release notes for the latest Helm chart version:

```sh
n8nrel --helm --changelog
# v1.10.1
# ## What's Changed
# ...
```

`--helm` cannot be combined with `--beta` or `--next`.

### Terraform module

Print the latest version of the official `n8n-io/n8n/aws` module from the Terraform Registry:

```sh
n8nrel --terraform
# 0.1.0
```

Print the GitHub release notes for that version from the `n8n-io/terraform-aws-n8n` repository:

```sh
n8nrel --terraform --changelog
# 0.1.0
# ## What's Changed
# ...
```

`--terraform` cannot be combined with `--helm`, `--beta`, or `--next`.

## Flags

| Flag | Description |
|------|-------------|
| *(none)* | Print the latest stable n8n npm version |
| `--beta` | Use the `beta` dist-tag instead of `latest` |
| `--next` | Use the `next` dist-tag instead of `latest` |
| `--changelog` | Also print the GitHub release notes |
| `--helm` | Look up the latest n8n Helm chart version |
| `--terraform` | Look up the latest n8n AWS Terraform module version |
