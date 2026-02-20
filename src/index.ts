#!/usr/bin/env node

async function main(): Promise<void> {
  const response = await fetch("https://registry.npmjs.org/n8n/latest");

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
