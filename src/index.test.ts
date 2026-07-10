import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs, formatVersionTable } from "./index.js";

// ---------------------------------------------------------------------------
// Helper: run parseArgs with mocked process.exit / process.stderr.write /
// process.stdout.write so we can inspect what the CLI would have printed and
// which exit code it would have used, without the process actually exiting.
// ---------------------------------------------------------------------------

interface RunResult {
  result?: ReturnType<typeof parseArgs>;
  exitCode?: number;
  stderr: string;
  stdout: string;
}

function run(argv: string[], t: { mock: { method: typeof import("node:test").mock.method } }): RunResult {
  let exitCode: number | undefined;
  let stderr = "";
  let stdout = "";

  t.mock.method(process, "exit", (code?: number) => {
    exitCode = code ?? 0;
    throw new Error(`__process_exit_${code}__`);
  });

  t.mock.method(process.stderr, "write", (chunk: unknown) => {
    stderr += String(chunk);
    return true;
  });

  t.mock.method(process.stdout, "write", (chunk: unknown) => {
    stdout += String(chunk);
    return true;
  });

  let result: ReturnType<typeof parseArgs> | undefined;
  try {
    result = parseArgs(["node", "n8nrel", ...argv]);
  } catch {
    // process.exit was called; exitCode is captured above
  }

  return { result, exitCode, stderr, stdout };
}

// ---------------------------------------------------------------------------
// Happy-path: valid flag combinations
// ---------------------------------------------------------------------------

test("no flags → tag=latest, all booleans false", (t) => {
  const { result } = run([], t);
  assert.deepEqual(result, {
    tag: "latest",
    changelog: false,
    helm: false,
    terraform: false,
    all: false,
  });
});

test("--beta → tag=beta", (t) => {
  const { result } = run(["--beta"], t);
  assert.equal(result?.tag, "beta");
  assert.equal(result?.changelog, false);
});

test("--next → tag=next", (t) => {
  const { result } = run(["--next"], t);
  assert.equal(result?.tag, "next");
});

test("--changelog → changelog=true, tag=latest", (t) => {
  const { result } = run(["--changelog"], t);
  assert.equal(result?.tag, "latest");
  assert.equal(result?.changelog, true);
});

test("--beta --changelog → tag=beta, changelog=true", (t) => {
  const { result } = run(["--beta", "--changelog"], t);
  assert.equal(result?.tag, "beta");
  assert.equal(result?.changelog, true);
});

test("--helm → helm=true, tag=latest", (t) => {
  const { result } = run(["--helm"], t);
  assert.equal(result?.helm, true);
  assert.equal(result?.tag, "latest");
});

test("--terraform → terraform=true", (t) => {
  const { result } = run(["--terraform"], t);
  assert.equal(result?.terraform, true);
});

test("--all → all=true", (t) => {
  const { result } = run(["--all"], t);
  assert.equal(result?.all, true);
});

// ---------------------------------------------------------------------------
// --help / -h: exit 0, usage on stdout
// ---------------------------------------------------------------------------

test("--help → exit 0, usage on stdout", (t) => {
  const { exitCode, stdout } = run(["--help"], t);
  assert.equal(exitCode, 0);
  assert.ok(stdout.includes("Usage:"), `stdout should contain 'Usage:' but got: ${stdout}`);
});

test("-h → exit 0, usage on stdout", (t) => {
  const { exitCode, stdout } = run(["-h"], t);
  assert.equal(exitCode, 0);
  assert.ok(stdout.includes("Usage:"));
});

test("--help with other flags → exit 0 (help takes precedence)", (t) => {
  const { exitCode, stdout } = run(["--help", "--beta"], t);
  assert.equal(exitCode, 0);
  assert.ok(stdout.includes("Usage:"));
});

// ---------------------------------------------------------------------------
// Conflict rules: exit 1, error on stderr
// ---------------------------------------------------------------------------

test("--beta --next → exit 1", (t) => {
  const { exitCode, stderr } = run(["--beta", "--next"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0, "stderr should not be empty on conflict");
});

test("--helm --beta → exit 1", (t) => {
  const { exitCode, stderr } = run(["--helm", "--beta"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0);
});

test("--helm --next → exit 1", (t) => {
  const { exitCode, stderr } = run(["--helm", "--next"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0);
});

test("--terraform --helm → exit 1", (t) => {
  const { exitCode, stderr } = run(["--terraform", "--helm"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0);
});

test("--terraform --beta → exit 1", (t) => {
  const { exitCode, stderr } = run(["--terraform", "--beta"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0);
});

test("--terraform --next → exit 1", (t) => {
  const { exitCode, stderr } = run(["--terraform", "--next"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0);
});

test("--all --beta → exit 1", (t) => {
  const { exitCode, stderr } = run(["--all", "--beta"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0);
});

test("--all --next → exit 1", (t) => {
  const { exitCode, stderr } = run(["--all", "--next"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0);
});

test("--all --helm → exit 1", (t) => {
  const { exitCode, stderr } = run(["--all", "--helm"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0);
});

test("--all --terraform → exit 1", (t) => {
  const { exitCode, stderr } = run(["--all", "--terraform"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0);
});

test("--all --changelog → exit 1", (t) => {
  const { exitCode, stderr } = run(["--all", "--changelog"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.length > 0);
});

// ---------------------------------------------------------------------------
// Argument validation: exit 1, usage on stderr
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// formatVersionTable
// ---------------------------------------------------------------------------

test("formatVersionTable: all resolved values", () => {
  const table = formatVersionTable({
    stable: "1.20.0",
    beta: "1.21.0-beta.1",
    next: "1.22.0-next.1",
    helm: "1.10.1",
    terraform: "0.1.0",
  });

  const lines = table.split("\n");
  assert.equal(lines.length, 5);
  assert.ok(lines[0].startsWith("stable"));
  assert.ok(lines[0].endsWith("1.20.0"));
  assert.ok(lines[1].startsWith("beta"));
  assert.ok(lines[1].endsWith("1.21.0-beta.1"));
  assert.ok(lines[2].startsWith("next"));
  assert.ok(lines[2].endsWith("1.22.0-next.1"));
  assert.ok(lines[3].startsWith("helm"));
  assert.ok(lines[3].endsWith("1.10.1"));
  assert.ok(lines[4].startsWith("terraform"));
  assert.ok(lines[4].endsWith("0.1.0"));

  // versions start at the same column across all rows
  const versionStarts = lines.map((line) => {
    const match = /\s+(?=\S+$)/.exec(line);
    return match ? match.index + match[0].length : -1;
  });
  assert.equal(new Set(versionStarts).size, 1);
});

test("formatVersionTable: mix of resolved and n/a", () => {
  const table = formatVersionTable({
    stable: "1.20.0",
    beta: "n/a",
    next: "1.22.0-next.1",
    helm: "n/a",
    terraform: "0.1.0",
  });

  const lines = table.split("\n");
  assert.equal(lines.length, 5);
  assert.ok(lines[0].startsWith("stable") && lines[0].endsWith("1.20.0"));
  assert.ok(lines[1].startsWith("beta") && lines[1].endsWith("n/a"));
  assert.ok(lines[2].startsWith("next") && lines[2].endsWith("1.22.0-next.1"));
  assert.ok(lines[3].startsWith("helm") && lines[3].endsWith("n/a"));
  assert.ok(lines[4].startsWith("terraform") && lines[4].endsWith("0.1.0"));
});

test("positional argument → exit 1, usage on stderr", (t) => {
  const { exitCode, stderr } = run(["foo"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.includes("Usage:"), `stderr should contain 'Usage:' but got: ${stderr}`);
});

test("--flag=value form → exit 1, usage on stderr", (t) => {
  const { exitCode, stderr } = run(["--beta=x"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.includes("Usage:"), `stderr should contain 'Usage:' but got: ${stderr}`);
});

test("unknown flag → exit 1, usage on stderr", (t) => {
  const { exitCode, stderr } = run(["--nope"], t);
  assert.equal(exitCode, 1);
  assert.ok(stderr.includes("Usage:"), `stderr should contain 'Usage:' but got: ${stderr}`);
});
