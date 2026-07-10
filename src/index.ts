#!/usr/bin/env node

const USER_AGENT = "n8nrel/1.0.0";

interface ParsedArgs {
  tag: string;
  changelog: boolean;
  helm: boolean;
  terraform: boolean;
  all: boolean;
}

const USAGE =
  "Usage: n8nrel [--beta | --next] [--changelog] [--helm] [--terraform] [--all] [--help]";

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
  const known = new Set(["--beta", "--next", "--changelog", "--helm", "--terraform", "--all"]);
  const unknown = flags.filter((f) => !known.has(f));

  if (unknown.length > 0) {
    process.stderr.write(`Unknown flag: ${unknown[0]}\n${USAGE}\n`);
    process.exit(1);
  }

  const hasBeta = flags.includes("--beta");
  const hasNext = flags.includes("--next");
  const changelog = flags.includes("--changelog");
  const helm = flags.includes("--helm");
  const terraform = flags.includes("--terraform");
  const all = flags.includes("--all");

  if (hasBeta && hasNext) {
    process.stderr.write("Error: --beta and --next cannot be used together\n");
    process.exit(1);
  }

  if (helm && (hasBeta || hasNext)) {
    process.stderr.write("Error: --helm cannot be used with --beta or --next\n");
    process.exit(1);
  }

  if (terraform && (helm || hasBeta || hasNext)) {
    process.stderr.write("Error: --terraform cannot be used with --helm, --beta, or --next\n");
    process.exit(1);
  }

  if (all && (hasBeta || hasNext || helm || terraform || changelog)) {
    process.stderr.write(
      "Error: --all cannot be used with --beta, --next, --helm, --terraform, or --changelog\n",
    );
    process.exit(1);
  }

  const tag = hasBeta ? "beta" : hasNext ? "next" : "latest";
  return { tag, changelog, helm, terraform, all };
}

async function fetchJson(url: string, extraHeaders: Record<string, string> = {}): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, ...extraHeaders },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`${new URL(url).hostname} returned ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<unknown>;
}

async function fetchGitHubRelease(url: string): Promise<{ tagName: string; body: string }> {
  const data = await fetchJson(url, { Accept: "application/vnd.github.v3+json" });

  if (
    typeof data !== "object" ||
    data === null ||
    !("tag_name" in data) ||
    !("body" in data) ||
    typeof (data as { tag_name: unknown }).tag_name !== "string"
  ) {
    throw new Error("Unexpected response from GitHub API: missing release fields");
  }

  const release = data as { tag_name: string; body: string | null };
  return { tagName: release.tag_name, body: release.body ?? "" };
}

async function fetchVersion(tag: string): Promise<string> {
  const data = await fetchJson(`https://registry.npmjs.org/n8n/${tag}`);

  if (typeof data !== "object" || data === null || !("version" in data)) {
    throw new Error("Unexpected response from npm registry: missing version field");
  }

  const { version } = data as { version: string };

  if (typeof version !== "string" || version.length === 0) {
    throw new Error("Unexpected response from npm registry: version is not a string");
  }

  return version;
}

async function fetchChangelog(version: string): Promise<{ tagName: string; body: string }> {
  const tagName = `n8n@${version}`;
  const url = `https://api.github.com/repos/n8n-io/n8n/releases/tags/${tagName}`;
  return fetchGitHubRelease(url);
}

async function fetchHelmChartRelease(): Promise<{ version: string; tagName: string; body: string }> {
  const url = "https://api.github.com/repos/n8n-io/n8n-hosting/releases/latest";
  const release = await fetchGitHubRelease(url);
  const version = release.tagName.startsWith("v") ? release.tagName.slice(1) : release.tagName;
  return { version, tagName: release.tagName, body: release.body };
}

async function fetchTerraformModuleVersion(): Promise<string> {
  const url = "https://registry.terraform.io/v1/modules/n8n-io/n8n/aws";
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

async function fetchTerraformChangelog(version: string): Promise<{ tagName: string; body: string }> {
  const url = `https://api.github.com/repos/n8n-io/terraform-aws-n8n/releases/tags/${version}`;
  return fetchGitHubRelease(url);
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
  helm: string;
  terraform: string;
}

async function fetchAllVersions(): Promise<AllVersions> {
  const [stable, beta, next, helm, terraform] = await Promise.allSettled([
    fetchVersion("latest"),
    fetchVersion("beta"),
    fetchVersion("next"),
    fetchHelmChartRelease().then((release) => release.version),
    fetchTerraformModuleVersion(),
  ]);

  const resolve = (result: PromiseSettledResult<string>): string =>
    result.status === "fulfilled" ? result.value : "n/a";

  return {
    stable: resolve(stable),
    beta: resolve(beta),
    next: resolve(next),
    helm: resolve(helm),
    terraform: resolve(terraform),
  };
}

function formatVersionTable(versions: AllVersions): string {
  const rows: Array<[string, string]> = [
    ["stable", versions.stable],
    ["beta", versions.beta],
    ["next", versions.next],
    ["helm", versions.helm],
    ["terraform", versions.terraform],
  ];

  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  return rows.map(([label, version]) => `${label.padEnd(labelWidth + 2)}${version}`).join("\n");
}

async function main(): Promise<void> {
  const { tag, changelog, helm, terraform } = parseArgs(process.argv);

  if (terraform) {
    const version = await fetchTerraformModuleVersion();
    if (changelog) {
      const release = await fetchTerraformChangelog(version);
      printRelease(release);
    } else {
      console.log(version);
    }
    return;
  }

  if (helm) {
    const release = await fetchHelmChartRelease();
    if (changelog) {
      printRelease(release);
    } else {
      console.log(release.version);
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

export { parseArgs, fetchAllVersions, formatVersionTable };

if (require.main === module) {
  main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  });
}
