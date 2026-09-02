# Saggar

Saggar is a native macOS command center for developers running multiple terminals and coding agents.

It is built around one question: *which session needs me right now?* Saggar keeps projects, shells, and agents in one place, then brings forward the sessions waiting for your attention.

[Install](#install) · [Watch the intro](https://youtu.be/3Dt_zLCfJ30) · [Documentation](https://saggar.marginalutility.dev/docs) · [Updates](https://saggar.marginalutility.dev/docs/changelog)

![Saggar organizing sessions across several projects](https://saggar.marginalutility.dev/screenshots/window.png)

## See what needs you

Saggar marks sessions as **Needs you**, **Working**, **Idle**, **Finished**, **Failed**, or **Ready for review**. Prompts, failures, and completed work form one ordered queue. Answer from the attention card, or press `⌘J` to work through it by priority.

![A Codex prompt ready to answer from Saggar's attention card](https://saggar.marginalutility.dev/screenshots/needs-you-small.png)

[Learn about status and triage](https://saggar.marginalutility.dev/docs/statuses)

## Keep every project in view

Run shells, dev servers, tests, and agents across several codebases. Each session stays attached to its project, branch, and worktree, while Saggar tracks dirty files, listening ports, and command output.

Sessions and scrollback survive restarts. Project scratchpads, commands, layouts, and scheduled tasks live in `.saggar/`, where both people and coding agents can read them.

![A Codex session running inside Saggar](https://saggar.marginalutility.dev/screenshots/codex.png)

[Learn about projects and sessions](https://saggar.marginalutility.dev/docs/concepts/projects-and-sessions)

## Leave long-running work alone

Quick runs and persistent monitors keep tests, development servers, and other long-running commands visible without taking over a terminal. Saggar sounds restrained alerts when work changes state, so active jobs can stay out of the way until something happens.

![A development server running in Saggar's monitor dock](https://saggar.marginalutility.dev/screenshots/monitor-small.png)

[Learn about managing parallel agents](https://saggar.marginalutility.dev/docs/managing-parallel-agents)

## Supported coding agents

Saggar recognizes Codex, Claude Code, Antigravity, Pi, and OpenCode. It detects their status and waiting prompts, with optional hooks where the agent CLI supports them. Any ordinary shell command still runs as a terminal session.

The bundled `saggar` CLI and optional agent skill let agents open projects, run commands, report status, and raise your attention themselves.

[Learn about agents](https://saggar.marginalutility.dev/docs/agents)

## Step away without losing control

Pair the optional [Saggar Companion](https://saggar.marginalutility.dev/remote) to inspect a session, answer its prompt, interrupt a runaway command, or type into it from your phone.

Remote control is off by default and requires a Marginal Utility account. Pairing needs both a matching account and confirmation at the Mac. The Mac opens no inbound port; it connects out to Saggar's relay, and terminal traffic is encrypted end to end.

[How remote control works](https://saggar.marginalutility.dev/docs/remote-control) · [Read the security model](https://saggar.marginalutility.dev/docs/security)

## Install

Saggar requires macOS 26 or newer on Apple silicon.

```bash
brew install --cask mcclowes/saggar/saggar
```

You can also [download the latest release directly](https://github.com/mcclowes/homebrew-saggar/releases/latest/download/Saggar.dmg). No account is needed to use the Mac app.

On a fresh install, Saggar sends no terminal content off the Mac. Remote control and optional cloud features are opt-in; the [security model](https://saggar.marginalutility.dev/docs/security) documents what they send and the trade-offs involved.

## Help shape Saggar

This repository is Saggar's public home. Use it to:

- [Report a bug](https://github.com/mcclowes/saggar/issues/new?template=bug.yml)
- [Suggest a feature](https://github.com/mcclowes/saggar/issues/new?template=feature.yml)
- [Ask a question or discuss an idea](https://github.com/mcclowes/saggar/discussions)

Before reporting a problem, check the [troubleshooting guide](https://saggar.marginalutility.dev/docs/help/troubleshooting). Please report security vulnerabilities privately, as described in [SECURITY.md](SECURITY.md).

## About this repository

Saggar is proprietary software, and its application source is private. This repository hosts the public issue tracker and discussions. It will also host the website and product documentation once those sources move here.
