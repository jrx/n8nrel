#!/usr/bin/env node

function parseArgs(argv: string[]): string {
  const args = argv.slice(2);
  const flags = args.filter((a) => a.startsWith("--"));
  const unknown = flags.filter((f) => f !== "--beta" && f !== "--next");

  if (unknown.length > 0) {
    process.stderr.write(`Unknown flag: ${unknown[0]}\nUsage: n8nrel [--beta | --next]\n`);
    process.exit(1);
  }

  const hasBeta = flags.includes("--beta");
  const hasNext = flags.includes("--next");

  if (hasBeta && hasNext) {
    process.stderr.write("Error: --beta and --next cannot be used together\n");
    process.exit(1);
  }

  if (hasBeta) return "beta";
  if (hasNext) return "next";
  return "latest";
}

async function main(): Promise<void> {
  const tag = parseArgs(process.argv);
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

  console.log(version);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
});
