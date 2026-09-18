import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLink, extractLinks, hiddenPrompt, validateLink } from "./saggar-link.mjs";

const ORIGIN = "https://saggar.marginalutility.dev/open/v1";

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
