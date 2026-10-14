import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildLink, describeLink, extractLinks, hiddenPrompt, validateLink } from "./saggar-link.mjs";

const ORIGIN = "https://saggar.marginalutility.dev/open/v1";

function checkFile(t, markdown) {
  const root = mkdtempSync(join(tmpdir(), "saggar-links-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, "links with spaces.md");
  writeFileSync(file, markdown);
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("./saggar-link.mjs", import.meta.url)), "check", file], {
    cwd: root, encoding: "utf8", timeout: 5000,
  });
  assert.equal(result.error, undefined);
  return { file, result };
}

test("describes literal percent signs and encoded-looking text without decoding twice", () => {
  for (const command of ["printf 100%", "echo %2F", "echo a+b=c"]) {
    const link = buildLink("session", { name: "Literal", command });
    assert.deepEqual(validateLink(link), []);
    assert.equal(describeLink(link), `session name="Literal" command=${JSON.stringify(command)}`);
  }
});

test("malformed query encoding is reported as an invalid link", () => {
  for (const query of ["name=%&command=echo", "name=x&command=%GG", "name=x&command=%C3%28", "na%me=x&command=echo"]) {
    const errors = validateLink(`${ORIGIN}/session?${query}`);
    assert.ok(errors.some(error => /percent encoding/.test(error)), query);
  }
});

test("embedded equals signs remain part of the validated query value", () => {
  const valid = `${ORIGIN}/session?name=Literal&command=echo=a=b`;
  assert.deepEqual(validateLink(valid), []);
  assert.equal(describeLink(valid), 'session name="Literal" command="echo=a=b"');
  const tooLong = `${ORIGIN}/session?name=Literal&command=echo=${"a".repeat(1000)}`;
  assert.ok(validateLink(tooLong).some(error => /command is over 1000 bytes/.test(error)));
});

test("the CLI accurately describes valid links containing percent and equals characters", t => {
  const commands = ["printf 100%", "echo %2F", "echo a+b=c"];
  const markdown = commands.map(command => buildLink("session", { name: "Literal", command })).join("\n");
  const { result } = checkFile(t, markdown);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  for (const command of commands) assert.ok(result.stdout.includes(`command=${JSON.stringify(command)}`));
  assert.match(result.stdout, /3 Saggar links checked, 0 invalid\./);
});

test("the CLI reports malformed encoding and continues checking subsequent links", t => {
  const valid = buildLink("session", { name: "Literal", command: "printf 100%" });
  const { file, result } = checkFile(t, `${ORIGIN}/session?name=Bad&command=%GG\n${valid}\n`);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes(`${file}:1`));
  assert.match(result.stderr, /invalid percent encoding/);
  assert.doesNotMatch(result.stderr, /URIError|at validateLink/);
  assert.ok(result.stdout.includes(`${file}:2`));
  assert.match(result.stdout, /command="printf 100%"/);
  assert.match(result.stdout, /2 Saggar links checked, 1 invalid\./);
});

test("percent characters in prompts keep the exact-text visibility check", () => {
  const prompt = "Explain 100% and the literal %2F.";
  const link = buildLink("prompt", { prompt, provider: "claude", model: "opus" });
  assert.deepEqual(validateLink(link), []);
  assert.equal(hiddenPrompt(link, prompt), false);
  assert.equal(hiddenPrompt(link, "Explain 100% and the literal /."), true);
});

test("builds a session link", () => {
  assert.equal(
    buildLink("session", { name: "lazygit", command: "lazygit" }),
    `${ORIGIN}/session?name=lazygit&command=lazygit`,
  );
});

test("encodes spaces as %20, because the Mac reads + literally", () => {
  const link = buildLink("prompt", { prompt: "Review this", provider: "claude", model: "opus" });
  assert.match(link, /prompt=Review%20this/);
  assert.doesNotMatch(link, /\+/);
});

test("encodes characters that would break a Markdown link target", () => {
  const link = buildLink("session", { name: "Logs", command: "tail -f $(ls *.log) 'a'!" });
  assert.doesNotMatch(link.split("?")[1], /[()'!*]/);
  assert.deepEqual(validateLink(link), []);
});

test("refuses to build an invalid link", () => {
  assert.throws(() => buildLink("session", { name: "No command" }), /command/);
  assert.throws(() => buildLink("delete-everything", {}), /action/);
});

test("inherited property names are not supported actions", () => {
  for (const action of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
    for (const origin of [ORIGIN, "saggar://open/v1"]) {
      assert.deepEqual(validateLink(`${origin}/${action}`), [`names an unknown action: ${action}`]);
    }
    assert.throws(() => buildLink(action, {}), /Unknown action:/);
  }
});

test("inherited property names are not supported parameters for any action", () => {
  const actions = [
    ["navigate", {}],
    ["settings", { terminalFontSize: "14" }],
    ["session", { name: "Test", command: "echo" }],
    ["prompt", { prompt: "Read", provider: "claude", model: "opus" }],
    ["skill", { id: "saggar-cli", provider: "claude" }],
  ];
  for (const [action, parameters] of actions) {
    const valid = buildLink(action, parameters);
    for (const key of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      const link = `${valid}${valid.includes("?") ? "&" : "?"}${key}=value`;
      assert.deepEqual(validateLink(link), [`${action} doesn't take a ${key} parameter`]);
      assert.throws(() => buildLink(action, { ...parameters, [key]: "value" }), /doesn't take a/);
    }
  }
});

test("the CLI rejects inherited names as actions and retains unsupported flags for validation", () => {
  const script = fileURLToPath(new URL("./saggar-link.mjs", import.meta.url));
  for (const key of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
    for (const args of [["navigate", `--${key}`, "value"], [key]]) {
      const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8", timeout: 5000 });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 2, result.stdout + result.stderr);
      assert.equal(result.stdout, "");
      assert.ok(result.stderr.includes(key));
    }
  }
});

test("the CLI still builds a documented action from collected flags", () => {
  const script = fileURLToPath(new URL("./saggar-link.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script, "session", "--name", "Test", "--command", "echo safe"], {
    encoding: "utf8", timeout: 5000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, `${buildLink("session", { name: "Test", command: "echo safe" })}\n`);
  assert.equal(result.stderr, "");
});

test("the resource CLI rejects inherited names and continues to a valid link", t => {
  const valid = buildLink("navigate", { pane: "cli" });
  const { file, result } = checkFile(t, `${ORIGIN}/constructor\n${ORIGIN}/navigate?constructor=value\n${valid}\n`);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /names an unknown action: constructor/);
  assert.match(result.stderr, /navigate doesn't take a constructor parameter/);
  assert.ok(result.stdout.includes(`${file}:3`));
  assert.match(result.stdout, /3 Saggar links checked, 2 invalid\./);
});

test("accepts every documented action", () => {
  for (const link of [
    `${ORIGIN}/navigate`,
    `${ORIGIN}/navigate?pane=providers`,
    `${ORIGIN}/settings?terminalScrollback=5000&optionAsMetaKey=true`,
    `${ORIGIN}/session?name=Review&command=codex`,
    `${ORIGIN}/prompt?prompt=Review%20this&provider=codex&model=gpt-5.6-sol&title=Review`,
    `${ORIGIN}/skill?id=saggar-cli&provider=codex`,
    "saggar://open/v1/skill?id=saggar-cli&provider=codex&source=saggar.marginalutility.dev",
  ]) {
    assert.deepEqual(validateLink(link), [], link);
  }
});

test("rejects what the app's parser rejects", () => {
  const cases = [
    [`${ORIGIN}/delete-everything`, /action/],
    ["https://saggar.marginalutility.dev/open/v2/navigate", /version/],
    ["https://example.com/open/v1/navigate", /origin/],
    [`${ORIGIN}/navigate?pane=general&pane=providers`, /repeats/],
    [`${ORIGIN}/navigate?pane=secrets`, /pane/],
    [`${ORIGIN}/settings`, /at least one/],
    [`${ORIGIN}/settings?remoteAccess=true`, /remoteAccess/],
    [`${ORIGIN}/session?name=Review`, /command/],
    [`${ORIGIN}/session?name=Review&command=codex&cwd=/`, /cwd/],
    [`${ORIGIN}/prompt?prompt=Hi&provider=claude`, /model/],
    [`${ORIGIN}/prompt?prompt=Hi&provider=hal&model=9000`, /provider/],
    [`${ORIGIN}/prompt?prompt=Hi&provider=claude&model=opus&title=`, /title/],
    [`${ORIGIN}/prompt?prompt=${"a".repeat(4001)}&provider=claude&model=opus`, /4000/],
    [`${ORIGIN}/prompt?prompt=Review+this&provider=claude&model=opus`, /\+/],
  ];
  for (const [link, expected] of cases) {
    const errors = validateLink(link);
    assert.ok(errors.some((error) => expected.test(error)), `${link} → ${errors.join("; ")}`);
  }
});

test("rejects a link over the whole-URL limit", () => {
  const command = "a".repeat(1000);
  const link = `${ORIGIN}/session?name=x&command=${command}&source=${"s".repeat(8000)}`;
  assert.ok(validateLink(link).some((error) => /8192/.test(error)));
});

test("extracts links from Markdown with their line numbers, skipping templates", () => {
  const markdown = [
    "# Title",
    `- [Add it](${ORIGIN}/session?name=lazygit&command=lazygit) and`,
    `  <${ORIGIN}/navigate?pane=cli>`,
    `${ORIGIN}/{action}?{parameters}`,
  ].join("\n");
  assert.deepEqual(extractLinks(markdown), [
    { line: 2, link: `${ORIGIN}/session?name=lazygit&command=lazygit` },
    { line: 3, link: `${ORIGIN}/navigate?pane=cli` },
  ]);
});

test("flags a prompt link whose prompt isn't shown on the page", () => {
  const link = buildLink("prompt", { prompt: "Describe this project.", provider: "claude", model: "opus" });
  assert.equal(hiddenPrompt(link, "```text\nDescribe this project.\n```"), false);
  assert.equal(hiddenPrompt(link, "```text\nDescribe this repo.\n```"), true);
  assert.equal(hiddenPrompt(buildLink("navigate", {}), ""), false);
});
