#!/usr/bin/env node

import { gt, prerelease, valid } from "semver";

const USER_AGENT = "n8nrel/1.0.0";
type TerraformProvider = "aws" | "azurerm" | "google";
interface Release {
  tagName: string;
  body: string;
}

interface ParsedArgs {
  tag: string;
  changelog: boolean;
  helm: boolean;
  terraform: TerraformProvider | false;
  nod: boolean;
  preview: boolean;
  all: boolean;
}

const USAGE =
  "Usage: n8nrel [--beta | --next | --preview] [--changelog] [--helm | --terraform | --terraform-azurerm | --terraform-google | --nod] [--all] [--help]";

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);

  // 2.1: --help / -h take precedence over everything else
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${USAGE}\n`);
    process.exit(0);
  }

  // 2.2: Reject positional arguments (tokens not starting with -)
  const positional = args.filter((a) => !a.startsWith("-"));
  if (positional.length > 0) {
    process.stderr.write(`Unknown argument: ${positional[0]}\n${USAGE}\n`);
    process.exit(1);
  }

  // 2.3: Reject --flag=value form (any token containing =)
  const withEquals = args.filter((a) => a.includes("="));
  if (withEquals.length > 0) {
    process.stderr.write(`Unknown flag: ${withEquals[0]}\n${USAGE}\n`);
    process.exit(1);
  }

  const flags = args;
  const sources = ["--helm", "--terraform", "--terraform-azurerm", "--terraform-google", "--nod"];
  const known = new Set(["--beta", "--next", "--preview", "--changelog", "--all", ...sources]);
  const unknown = flags.filter((f) => !known.has(f));

  if (unknown.length > 0) {
    process.stderr.write(`Unknown flag: ${unknown[0]}\n${USAGE}\n`);
    process.exit(1);
  }

  const hasBeta = flags.includes("--beta");
  const hasNext = flags.includes("--next");
  const changelog = flags.includes("--changelog");
  const helm = flags.includes("--helm");
  const terraform = flags.includes("--terraform") ? "aws"
    : flags.includes("--terraform-azurerm") ? "azurerm"
    : flags.includes("--terraform-google") ? "google" : false;
  const nod = flags.includes("--nod");
  const preview = flags.includes("--preview");
  const all = flags.includes("--all");

  if ([hasBeta, hasNext, preview].filter(Boolean).length > 1) {
    process.stderr.write("Error: --beta, --next, and --preview cannot be used together\n");
    process.exit(1);
  }

  if (sources.filter((flag) => flags.includes(flag)).length > 1) {
    process.stderr.write("Error: choose only one of --helm, --terraform, --terraform-azurerm, --terraform-google, or --nod\n");
    process.exit(1);
  }

  if ((helm || terraform || nod) && (hasBeta || hasNext)) {
    process.stderr.write("Error: --beta and --next apply only to n8n\n");
    process.exit(1);
  }

  if (preview && (terraform || nod)) {
    process.stderr.write("Error: --preview applies only to n8n and --helm\n");
    process.exit(1);
  }

  if (all && (hasBeta || hasNext || preview || helm || terraform || nod || changelog)) {
    process.stderr.write("Error: --all cannot be used with other flags except --help\n");
    process.exit(1);
  }

  const tag = hasBeta ? "beta" : hasNext ? "next" : "latest";
  return { tag, changelog, helm, terraform, nod, preview, all };
}

async function fetchJson(url: string, extraHeaders: Record<string, string> = {}): Promise<unknown> {
  const headers: Record<string, string> = { "User-Agent": USER_AGENT, ...extraHeaders };
  if (new URL(url).hostname === "api.github.com" && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`${new URL(url).hostname} returned ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<unknown>;
}

function parseRelease(data: unknown): Release {
  if (
    typeof data !== "object" ||
    data === null ||
    !("tag_name" in data) ||
    !("body" in data) ||
    typeof data.tag_name !== "string" ||
    data.tag_name.length === 0 ||
    (data.body !== null && typeof data.body !== "string")
  ) {
    throw new Error("Unexpected response from GitHub API: missing release fields");
  }

  return { tagName: data.tag_name, body: data.body ?? "" };
}

async function fetchGitHubRelease(url: string): Promise<Release> {
  return parseRelease(await fetchJson(url, { Accept: "application/vnd.github.v3+json" }));
}

function releaseVersion(release: Release, prefix: string): string {
  const version = release.tagName.slice(prefix.length);
  if (!release.tagName.startsWith(prefix) || !valid(version)) {
    throw new Error(`Unexpected GitHub release tag: ${release.tagName}`);
  }
  return version;
}

async function fetchPreviewRelease(repo: string, prefix: string): Promise<Release> {
  let best: Release | undefined;
  let bestVersion: string | undefined;
  // Do not stop on the first page: backports can be published after a newer major.
  for (let page = 1; ; page++) {
    const data = await fetchJson(
      `https://api.github.com/repos/n8n-io/${repo}/releases?per_page=100&page=${page}`,
      { Accept: "application/vnd.github.v3+json" },
    );
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response from GitHub API: expected release list");
    }
    for (const entry of data) {
      const release = parseRelease(entry);
      if (typeof entry.draft !== "boolean" || typeof entry.prerelease !== "boolean") {
        throw new Error("Unexpected response from GitHub API: missing release status");
      }
      if (entry.draft || !entry.prerelease || !release.tagName.startsWith(prefix)) continue;
      const version = release.tagName.slice(prefix.length);
      if (!valid(version)) continue;
      // n8n early-access releases have bare versions; exclude exp/nightly/dev builds.
      const suffix = prerelease(version);
      if (suffix && !["alpha", "beta", "rc"].includes(String(suffix[0]))) continue;
      if (!bestVersion || gt(version, bestVersion)) {
        best = release;
        bestVersion = version;
      }
    }
    if (data.length < 100) break;
  }
  if (!best) throw new Error(`No preview release found for n8n-io/${repo}`);
  return best;
}

async function fetchVersion(tag: string): Promise<string> {
  if (tag === "latest") {
    const release = await fetchGitHubRelease("https://api.github.com/repos/n8n-io/n8n/releases/latest");
    return releaseVersion(release, "n8n@");
  }

  // Upstream publishes beta and next together; GitHub's beta tag is their pointer.
  const data = await fetchJson("https://raw.githubusercontent.com/n8n-io/n8n/beta/packages/cli/package.json");

  if (typeof data !== "object" || data === null || !("version" in data)) {
    throw new Error("Unexpected response from GitHub: missing version field");
  }

  const { version } = data;

  if (typeof version !== "string" || !valid(version)) {
    throw new Error("Unexpected response from GitHub: invalid version");
  }

  return version;
}

async function fetchChangelog(version: string): Promise<{ tagName: string; body: string }> {
  const tagName = `n8n@${version}`;
  const url = `https://api.github.com/repos/n8n-io/n8n/releases/tags/${encodeURIComponent(tagName)}`;
  return fetchGitHubRelease(url);
}

async function fetchHelmChartRelease(preview = false): Promise<Release & { version: string }> {
  const url = "https://api.github.com/repos/n8n-io/n8n-hosting/releases/latest";
  const release = preview ? await fetchPreviewRelease("n8n-hosting", "v") : await fetchGitHubRelease(url);
  const version = releaseVersion(release, release.tagName.startsWith("v") ? "v" : "");
  return { version, tagName: release.tagName, body: release.body };
}

async function fetchTerraformModuleVersion(provider: TerraformProvider = "aws"): Promise<string> {
  const url = `https://registry.terraform.io/v1/modules/n8n-io/n8n/${provider}`;
  const data = await fetchJson(url, { Accept: "application/json" });

  if (typeof data !== "object" || data === null || !("version" in data)) {
    throw new Error("Unexpected response from Terraform Registry: missing version field");
  }

  const { version } = data as { version: string };

  if (typeof version !== "string" || version.length === 0) {
    throw new Error("Unexpected response from Terraform Registry: version is not a string");
  }

  return version;
}

async function fetchTerraformChangelog(version: string, provider: TerraformProvider): Promise<Release> {
  const url = `https://api.github.com/repos/n8n-io/terraform-${provider}-n8n/releases/tags/${encodeURIComponent(version)}`;
  return fetchGitHubRelease(url);
}

async function fetchNodRelease(): Promise<Release & { version: string }> {
  const release = await fetchGitHubRelease("https://api.github.com/repos/n8n-io/nod/releases/latest");
  return { ...release, version: releaseVersion(release, "nod-v") };
}

function printRelease({ tagName, body }: { tagName: string; body: string }): void {
  console.log(tagName);
  if (body) {
    console.log(body);
  }
}

interface AllVersions {
  stable: string;
  beta: string;
  next: string;
  preview: string;
  helm: string;
  "helm-preview": string;
  terraform: string;
  "terraform-azurerm": string;
  "terraform-google": string;
  nod: string;
}

async function fetchAllVersions(): Promise<AllVersions> {
  const [stable, beta, preview, helm, helmPreview, terraform, azurerm, google, nod] = await Promise.allSettled([
    fetchVersion("latest"),
    fetchVersion("beta"),
    fetchPreviewRelease("n8n", "n8n@").then((release) => releaseVersion(release, "n8n@")),
    fetchHelmChartRelease().then((release) => release.version),
    fetchHelmChartRelease(true).then((release) => release.version),
    fetchTerraformModuleVersion(),
    fetchTerraformModuleVersion("azurerm"),
    fetchTerraformModuleVersion("google"),
    fetchNodRelease().then((release) => release.version),
  ]);

  const resolve = (result: PromiseSettledResult<string>): string =>
    result.status === "fulfilled" ? result.value : "n/a";

  return {
    stable: resolve(stable),
    beta: resolve(beta),
    next: resolve(beta),
    preview: resolve(preview),
    helm: resolve(helm),
    "helm-preview": resolve(helmPreview),
    terraform: resolve(terraform),
    "terraform-azurerm": resolve(azurerm),
    "terraform-google": resolve(google),
    nod: resolve(nod),
  };
}

function formatVersionTable(versions: AllVersions): string {
  const rows: Array<[string, string]> = [
    ["stable", versions.stable],
    ["beta", versions.beta],
    ["next", versions.next],
    ["preview", versions.preview],
    ["helm", versions.helm],
    ["helm-preview", versions["helm-preview"]],
    ["terraform", versions.terraform],
    ["terraform-azurerm", versions["terraform-azurerm"]],
    ["terraform-google", versions["terraform-google"]],
    ["nod", versions.nod],
  ];

  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  return rows.map(([label, version]) => `${label.padEnd(labelWidth + 2)}${version}`).join("\n");
}

async function main(argv = process.argv): Promise<void> {
  const { tag, changelog, helm, terraform, nod, preview, all } = parseArgs(argv);

  if (all) {
    const versions = await fetchAllVersions();
    console.log(formatVersionTable(versions));
    return;
  }

  if (terraform) {
    const version = await fetchTerraformModuleVersion(terraform);
    if (changelog) {
      const release = await fetchTerraformChangelog(version, terraform);
      printRelease(release);
    } else {
      console.log(version);
    }
    return;
  }

  if (helm || nod || preview) {
    const release = helm ? await fetchHelmChartRelease(preview)
      : nod ? await fetchNodRelease()
      : await fetchPreviewRelease("n8n", "n8n@");
    if (changelog) {
      printRelease(release);
    } else {
      console.log("version" in release ? release.version : releaseVersion(release, "n8n@"));
    }
    return;
  }

  const version = await fetchVersion(tag);

  if (changelog) {
    const release = await fetchChangelog(version);
    printRelease(release);
  } else {
    console.log(version);
  }
}

export { main, parseArgs, fetchAllVersions, formatVersionTable };

if (require.main === module) {
  main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  });
}
