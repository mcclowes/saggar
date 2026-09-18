#!/usr/bin/env node
// Builds and checks Saggar links. The rules mirror the v1 parser in the Mac app:
// https://saggar.marginalutility.dev/docs/reference/saggar-links
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "saggar.marginalutility.dev";
const MAX_URL_BYTES = 8192;

const PANES = [
  "general", "appearance", "interface", "notifications", "sound", "keyboard", "projects",
  "presets", "terminals", "ssh", "providers", "turbo", "automation", "cli", "account",
  "remoteControl",
];
const SETTINGS = ["appFontScale", "optionAsMetaKey", "terminalFontSize", "terminalScrollback"];
const PROVIDERS = ["claude", "codex", "antigravity", "pi", "opencode", "copilot"];

const required = (maxBytes, oneOf) => ({ required: true, maxBytes, oneOf });
const optional = (maxBytes, oneOf) => ({ required: false, maxBytes, oneOf });

const ACTIONS = {
  navigate: { pane: optional(40, PANES) },
  settings: Object.fromEntries(SETTINGS.map((key) => [key, optional(120)])),
  session: { name: required(120), command: required(1000) },
  prompt: {
    prompt: required(4000),
    provider: required(40, PROVIDERS),
    model: required(120),
    title: optional(120),
  },
  skill: { id: required(80), provider: required(40, PROVIDERS) },
};

const bytes = (value) => new TextEncoder().encode(value).length;

// encodeURIComponent leaves ()'!* alone, and a bare ")" ends a Markdown link target.
const encode = (value) =>
  encodeURIComponent(value).replace(/[()'!*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export function validateLink(link) {
  const errors = [];
  let url;
  try {
    url = new URL(link);
  } catch {
    return ["isn't a URL"];
  }

  const isFallback = url.protocol === "saggar:";
  if (!isFallback && (url.protocol !== "https:" || url.host !== HOST)) {
    return [`has the wrong origin; use https://${HOST}`];
  }
  const [, open, version, action, ...rest] = (isFallback ? `/${url.host}${url.pathname}` : url.pathname).split("/");
  if (open !== "open") return ["isn't an /open link"];
  if (version !== "v1") return [`uses unsupported version ${version}`];
  const fields = ACTIONS[action];
  if (!fields || rest.length > 0) return [`names an unknown action: ${action}`];

  if (bytes(link) > MAX_URL_BYTES) errors.push(`is over ${MAX_URL_BYTES} bytes`);
  if (url.search.includes("+")) errors.push("contains +, which the Mac reads literally; encode spaces as %20");

  const seen = new Set();
  for (const pair of url.search.slice(1).split("&").filter(Boolean)) {
    const [rawKey, rawValue = ""] = pair.split("=");
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rawValue);
    if (seen.has(key)) errors.push(`repeats the ${key} parameter`);
    seen.add(key);
    if (key === "source") continue;
    const field = fields[key];
    if (!field) {
      errors.push(`${action} doesn't take a ${key} parameter`);
      continue;
    }
    if (value === "") errors.push(`${key} is empty`);
    if (bytes(value) > field.maxBytes) errors.push(`${key} is over ${field.maxBytes} bytes`);
    if (field.oneOf && !field.oneOf.includes(value)) errors.push(`${key} must be one of: ${field.oneOf.join(", ")}`);
  }

  for (const [key, field] of Object.entries(fields)) {
    if (field.required && !seen.has(key)) errors.push(`is missing ${key}`);
  }
  if (action === "settings" && !SETTINGS.some((key) => seen.has(key))) {
    errors.push(`needs at least one setting: ${SETTINGS.join(", ")}`);
  }
  return errors;
}

export function buildLink(action, parameters) {
  if (!ACTIONS[action]) throw new Error(`Unknown action: ${action}. Use one of: ${Object.keys(ACTIONS).join(", ")}`);
  const query = Object.entries(parameters)
    .map(([key, value]) => `${encode(key)}=${encode(String(value))}`)
    .join("&");
  const link = `https://${HOST}/open/v1/${action}${query ? `?${query}` : ""}`;
  const errors = validateLink(link);
  if (errors.length > 0) throw new Error(`This link ${errors.join("; ")}`);
  return link;
}

export function extractLinks(markdown) {
  const pattern = /(?:https:\/\/saggar\.marginalutility\.dev\/open\/|saggar:\/\/open\/)[^\s)>\]"'`]*/g;
  return markdown.split("\n").flatMap((text, index) =>
    [...text.matchAll(pattern)]
      .map(([link]) => ({ line: index + 1, link }))
      .filter(({ link }) => !link.includes("{")),
  );
}

export function describeLink(link) {
  const url = new URL(link);
  const action = url.pathname.split("/").pop();
  const parameters = [...url.searchParams].map(([key, value]) => `${key}=${JSON.stringify(decodeURIComponent(value.replaceAll("+", "%2B")))}`);
  return `${action} ${parameters.join(" ")}`.trim();
}

// A prompt link must run text the reader can see on the page, not something else.
export function hiddenPrompt(link, markdown) {
  const url = new URL(link);
  if (!url.pathname.endsWith("/prompt")) return false;
  const prompt = decodeURIComponent(url.search.match(/[?&]prompt=([^&]*)/)?.[1] ?? "");
  return !markdown.includes(prompt);
}

function markdownFiles(path) {
  if (statSync(path).isFile()) return path.endsWith(".md") ? [path] : [];
  return readdirSync(path).flatMap((entry) => markdownFiles(join(path, entry)));
}

function check(paths) {
  let failures = 0;
  let count = 0;
  for (const file of paths.flatMap(markdownFiles)) {
    const markdown = readFileSync(file, "utf8");
    for (const { line, link } of extractLinks(markdown)) {
      count += 1;
      const errors = validateLink(link);
      if (errors.length === 0 && hiddenPrompt(link, markdown)) {
        errors.push("runs a prompt that isn't shown in the file; put the exact prompt in a text block beside it");
      }
      if (errors.length === 0) {
        console.log(`ok    ${file}:${line}  ${describeLink(link)}`);
      } else {
        failures += 1;
        console.error(`FAIL  ${file}:${line}  ${link}\n      This link ${errors.join("; ")}`);
      }
    }
  }
  console.log(`\n${count} Saggar links checked, ${failures} invalid.`);
  return failures === 0 ? 0 : 1;
}

function parseFlags(args) {
  const parameters = {};
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    if (!flag.startsWith("--") || args[i + 1] === undefined) {
      throw new Error(`Expected --name value pairs, got: ${flag}`);
    }
    parameters[flag.slice(2)] = args[i + 1];
  }
  return parameters;
}

const USAGE = `Usage:
  npm run link -- <action> --<parameter> <value> ...   Build a Saggar link
  npm run links:check                                  Check every link under resources/

Actions: ${Object.entries(ACTIONS).map(([action, fields]) => `${action} (${Object.keys(fields).join(", ")})`).join("\n         ")}

Example:
  npm run link -- session --name lazygit --command lazygit`;

function main([command, ...args]) {
  if (!command || command === "help" || command === "--help") {
    console.log(USAGE);
    return 0;
  }
  if (command === "check") return check(args.length > 0 ? args : ["resources"]);
  try {
    console.log(buildLink(command, parseFlags(args)));
    return 0;
  } catch (error) {
    console.error(error.message);
    return 2;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
