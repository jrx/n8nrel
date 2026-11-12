import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { main, parseArgs, formatVersionTable } from "./index.js";

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
    nod: false,
    preview: false,
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

test("--terraform selects AWS", (t) => {
  const { result } = run(["--terraform"], t);
  assert.equal(result?.terraform, "aws");
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
    preview: "3.2.0",
    helm: "1.10.1",
    "helm-preview": "2.0.0-rc.1",
    terraform: "0.1.0",
    "terraform-azurerm": "0.2.0",
    "terraform-google": "0.3.0",
    nod: "0.6.2",
  });

  const lines = table.split("\n");
  assert.deepEqual(lines.map((line) => line.split(/\s+/)), [
    ["stable", "1.20.0"], ["beta", "1.21.0-beta.1"], ["next", "1.22.0-next.1"],
    ["preview", "3.2.0"], ["helm", "1.10.1"], ["helm-preview", "2.0.0-rc.1"],
    ["terraform", "0.1.0"], ["terraform-azurerm", "0.2.0"],
    ["terraform-google", "0.3.0"], ["nod", "0.6.2"],
  ]);

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
    preview: "n/a",
    helm: "n/a",
    "helm-preview": "2.0.0-rc.1",
    terraform: "0.1.0",
    "terraform-azurerm": "n/a",
    "terraform-google": "0.3.0",
    nod: "n/a",
  });

  const lines = table.split("\n");
  assert.deepEqual(lines.map((line) => line.split(/\s+/)), [
    ["stable", "1.20.0"], ["beta", "n/a"], ["next", "1.22.0-next.1"],
    ["preview", "n/a"], ["helm", "n/a"], ["helm-preview", "2.0.0-rc.1"],
    ["terraform", "0.1.0"], ["terraform-azurerm", "n/a"],
    ["terraform-google", "0.3.0"], ["nod", "n/a"],
  ]);
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

const sourceFlags = ["--helm", "--terraform", "--terraform-azurerm", "--terraform-google", "--nod"];
const conflicts = [
  ...sourceFlags.flatMap((flag, index) => sourceFlags.slice(index + 1).map((other) => [flag, other])),
  ...["--beta", "--next"].flatMap((channel) => sourceFlags.map((flag) => [channel, flag])),
  ...["--beta", "--next", "--terraform", "--terraform-azurerm", "--terraform-google", "--nod"]
    .map((flag) => ["--preview", flag]),
  ...["--preview", "--terraform-azurerm", "--terraform-google", "--nod"].map((flag) => ["--all", flag]),
];
for (const flags of conflicts) {
  test(`reject conflicting flags ${flags.join(" ")}`, (t) => {
    const { exitCode, stderr } = run(flags, t);
    assert.equal(exitCode, 1);
    assert.match(stderr, /Error:/);
  });
}

const github = "https://api.github.com/repos/n8n-io";
const betaUrl = "https://raw.githubusercontent.com/n8n-io/n8n/beta/packages/cli/package.json";
const registry = "https://registry.terraform.io/v1/modules/n8n-io/n8n";

function release(tag: string, preview = false, draft = false, body: string | null = "Release notes") {
  return { tag_name: tag, prerelease: preview, draft, body };
}

async function cli(flags: string[], responses: Record<string, unknown>, t: TestContext): Promise<string[]> {
  const output: string[] = [];
  t.mock.method(console, "log", (line: string) => { output.push(line); });
  t.mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
    assert.ok(new Headers(init.headers).get("User-Agent"));
    assert.ok(init.signal instanceof AbortSignal);
    if (!(input in responses)) throw new Error(`Unexpected request: ${input}`);
    const data = responses[input];
    if (data instanceof Error) throw data;
    return data instanceof Response ? data : Response.json(data);
  });
  await main(["node", "n8nrel", ...flags]);
  return output;
}

for (const version of ["3.2.1", "3.2.1+build.7"]) {
  test(`stable resolves n8n ${version} without npm`, async (t) => {
    assert.deepEqual(await cli([], {
      [`${github}/n8n/releases/latest`]: release(`n8n@${version}`),
    }, t), [version]);
  });
}

for (const flag of ["--beta", "--next"]) {
  test(`${flag} follows the official beta pointer and its versioned changelog`, async (t) => {
    assert.deepEqual(await cli([flag, "--changelog"], {
      [betaUrl]: { version: "2.48.1", private: true },
      [`${github}/n8n/releases/tags/n8n%402.48.1`]: release("n8n@2.48.1", true),
    }, t), ["n8n@2.48.1", "Release notes"]);
  });
}

test("preview finds the highest published version across pages, excluding experiments and drafts", async (t) => {
  assert.deepEqual(await cli(["--preview", "--changelog"], {
    [`${github}/n8n/releases?per_page=100&page=1`]: [
      release("beta", true), release("n8n@2.48.1", true),
      ...Array.from({ length: 98 }, () => release("n8n@2.47.4")),
    ],
    [`${github}/n8n/releases?per_page=100&page=2`]: [
      release("n8n@3.9.0", true), release("n8n@3.10.0", true, false, "3.10 notes"),
      release("n8n@4.0.0-exp.g123", true), release("n8n@4.0.0-nightly.1", true),
      release("n8n@5.0.0", true, true), release("n8n@6.0.0"),
      release("other-package@8.0.0", true), release("n8n@invalid", true),
    ],
  }, t), ["n8n@3.10.0", "3.10 notes"]);
});

test("Helm preview compares RC numbers numerically and keeps notes for the selected release", async (t) => {
  assert.deepEqual(await cli(["--helm", "--preview", "--changelog"], {
    [`${github}/n8n-hosting/releases?per_page=100&page=1`]: [
      release("v1.19.0"), release("v2.0.0-rc.2", true),
      release("v2.0.0-rc.10", true, false, "RC 10 notes"),
      release("v2.0.0-rc.9", true), release("v3.0.0-rc.1", true, true),
    ],
  }, t), ["v2.0.0-rc.10", "RC 10 notes"]);
});

for (const [flag, provider, version] of [
  ["--terraform", "aws", "0.6.0"],
  ["--terraform-azurerm", "azurerm", "0.2.0"],
  ["--terraform-google", "google", "0.3.0"],
]) {
  for (const changelog of [false, true]) {
    test(`${flag} ${changelog ? "changelog" : "version"} uses its provider's registry and repository`, async (t) => {
      const flags = changelog ? [flag, "--changelog"] : [flag];
      const output = await cli(flags, {
        [`${registry}/${provider}`]: { version },
        [`${github}/terraform-${provider}-n8n/releases/tags/${version}`]: release(version, true),
      }, t);
      assert.deepEqual(output, changelog ? [version, "Release notes"] : [version]);
    });
  }
}

for (const [flag, repo, tag, version] of [
  ["--helm", "n8n-hosting", "v2.0.0", "2.0.0"],
  ["--nod", "nod", "nod-v0.6.2", "0.6.2"],
]) {
  for (const changelog of [false, true]) {
    test(`${flag} ${changelog ? "changelog preserves its tag with empty notes" : "version strips its prefix"}`, async (t) => {
      assert.deepEqual(await cli(changelog ? [flag, "--changelog"] : [flag], {
        [`${github}/${repo}/releases/latest`]: release(tag, false, false, null),
      }, t), [changelog ? tag : version]);
    });
  }
}

test("--all preserves successful sources when independent lookups fail", async (t) => {
  const output = await cli(["--all"], {
    [`${github}/n8n/releases/latest`]: release("n8n@2.47.4"),
    [betaUrl]: { version: "2.48.1" },
    [`${github}/n8n/releases?per_page=100&page=1`]: [release("n8n@3.2.0", true)],
    [`${github}/n8n-hosting/releases/latest`]: new Response(null, { status: 503 }),
    [`${github}/n8n-hosting/releases?per_page=100&page=1`]: [release("v2.0.0-rc.1", true)],
    [`${registry}/aws`]: { version: "0.6.0" },
    [`${registry}/azurerm`]: { version: 123 },
    [`${registry}/google`]: { version: "0.1.0" },
    [`${github}/nod/releases/latest`]: new Error("Network error"),
  }, t);
  assert.deepEqual(output[0].split("\n").map((line) => line.split(/\s+/)), [
    ["stable", "2.47.4"], ["beta", "2.48.1"], ["next", "2.48.1"],
    ["preview", "3.2.0"], ["helm", "n/a"], ["helm-preview", "2.0.0-rc.1"],
    ["terraform", "0.6.0"], ["terraform-azurerm", "n/a"],
    ["terraform-google", "0.1.0"], ["nod", "n/a"],
  ]);
});

test("--all prints ten n/a rows if every source fails", async (t) => {
  const output = await cli(["--all"], {}, t);
  assert.equal(output[0].split("\n").length, 10);
  assert.ok(output[0].split("\n").every((line) => line.endsWith("  n/a")));
});

for (const [flags, url, payload, error] of [
  [[], `${github}/n8n/releases/latest`, release("stable"), /Unexpected GitHub release tag/],
  [["--beta"], betaUrl, { version: "" }, /invalid version/],
  [["--next"], betaUrl, {}, /missing version/],
  [["--preview"], `${github}/n8n/releases?per_page=100&page=1`, {}, /expected release list/],
  [["--preview"], `${github}/n8n/releases?per_page=100&page=1`, [null], /missing release fields/],
  [["--preview"], `${github}/n8n/releases?per_page=100&page=1`, [{ tag_name: "n8n@3.0.0", body: null }], /missing release status/],
  [["--preview"], `${github}/n8n/releases?per_page=100&page=1`, [release("n8n@3.0.0")], /No preview release/],
  [["--nod"], `${github}/nod/releases/latest`, release("v0.6.2"), /Unexpected GitHub release tag/],
  [["--nod"], `${github}/nod/releases/latest`, { tag_name: "nod-v0.6.2", body: 123 }, /missing release fields/],
  [["--terraform-google"], `${registry}/google`, new Response(null, { status: 429, statusText: "Too Many Requests" }), /429 Too Many Requests/],
] as const) {
  test(`reject invalid upstream result for ${flags.join(" ") || "stable"}: ${error.source}`, async (t) => {
    await assert.rejects(cli([...flags], { [url]: payload }, t), error);
  });
}

test("GitHub token is sent only to the GitHub API", async (t) => {
  const previous = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "test-token";
  t.after(() => {
    if (previous === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previous;
  });
  t.mock.method(console, "log", () => {});
  t.mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
    const headers = new Headers(init.headers);
    if (input.startsWith(github)) {
      assert.equal(headers.get("Authorization"), "Bearer test-token");
      return Response.json(release("0.1.0"));
    }
    assert.equal(headers.get("Authorization"), null);
    return Response.json({ version: "0.1.0" });
  });
  await main(["node", "n8nrel", "--terraform-google", "--changelog"]);
  await main(["node", "n8nrel", "--beta"]);
});
