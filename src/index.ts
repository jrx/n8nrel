#!/usr/bin/env node

interface ParsedArgs {
  tag: string;
  changelog: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const flags = args.filter((a) => a.startsWith("--"));
  const known = new Set(["--beta", "--next", "--changelog"]);
  const unknown = flags.filter((f) => !known.has(f));

  if (unknown.length > 0) {
    process.stderr.write(`Unknown flag: ${unknown[0]}\nUsage: n8nrel [--beta | --next] [--changelog]\n`);
    process.exit(1);
  }

  const hasBeta = flags.includes("--beta");
  const hasNext = flags.includes("--next");
  const changelog = flags.includes("--changelog");

  if (hasBeta && hasNext) {
    process.stderr.write("Error: --beta and --next cannot be used together\n");
    process.exit(1);
  }

  const tag = hasBeta ? "beta" : hasNext ? "next" : "latest";
  return { tag, changelog };
}

async function fetchVersion(tag: string): Promise<string> {
  const response = await fetch(`https://registry.npmjs.org/n8n/${tag}`);

  if (!response.ok) {
    throw new Error(`npm registry returned ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();

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
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} ${response.statusText} for tag ${tagName}`);
  }

  const data: unknown = await response.json();

  if (typeof data !== "object" || data === null || !("body" in data) || !("tag_name" in data)) {
    throw new Error("Unexpected response from GitHub API: missing release fields");
  }

  const release = data as { tag_name: string; body: string | null };
  return { tagName: release.tag_name, body: release.body ?? "" };
}

async function main(): Promise<void> {
  const { tag, changelog } = parseArgs(process.argv);
  const version = await fetchVersion(tag);

  if (changelog) {
    const release = await fetchChangelog(version);
    console.log(release.tagName);
    if (release.body) {
      console.log(release.body);
    }
  } else {
    console.log(version);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
});
