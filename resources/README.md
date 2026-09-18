# Saggar resources

Skills, prompts, terminal tools, commands, schedules, and hooks that work well with [Saggar](https://saggar.marginalutility.dev), collected by the people who use it.

Everything here is optional, and most of it knows nothing about Saggar. It earns a place by being useful when several agents and terminals run at once. Have something to add? Read the [contributing guide](CONTRIBUTING.md), then open a pull request.

## How the links work

Entries marked ▶ are [Saggar links](https://saggar.marginalutility.dev/docs/reference/saggar-links). Clicking one opens the Mac app, which shows where the link came from and the complete request, then waits for you to confirm. Nothing is added, installed, or run before that.

- **Add session** links add a session preset, so the tool is one click away in every project.
- **Run with** links open an agent session in the project you have in front and run the prompt shown beside the link.
- **Install** links install a skill that ships inside Saggar.
- **Open** links jump to a Settings pane.

Prompt links name a model. If your build of Saggar doesn't have it, the app says so and nothing runs, so copy the prompt instead. Replace anything in `[brackets]` before you send it.

## Contents

- [Start here](#start-here)
- [Skills](#skills)
- [Prompts](#prompts)
- [Prompts that use the saggar CLI](#prompts-that-use-the-saggar-cli)
- [Terminal UIs](#terminal-uis)
- [CLI tools](#cli-tools)
- [Project commands and layouts](#project-commands-and-layouts)
- [Scheduled tasks](#scheduled-tasks)
- [Hooks](#hooks)
- [Settings](#settings)

## Start here

Two things make most of this list work better.

- **The `saggar` command** lets you and your agents drive the app from a terminal. Install it from Settings. ▶ [Open CLI settings][nav-cli]
- **The saggar-cli skill** teaches an agent to use that command: raise your attention, dock a monitor, delegate to another agent. ▶ [Install for Claude Code][skill-claude] · ▶ [Install for Codex][skill-codex]

## Skills

- [saggar-cli](https://github.com/mcclowes/saggar-skills) - The skill above, as a Claude Code plugin or a plain `SKILL.md` for any runner that reads them. It stays silent outside a Saggar terminal, so it's safe to install globally.
- [CLIP](https://github.com/mcclowes/clip) - Generates a skill for each CLI tool a project registers, so agents learn the tools you already use instead of an MCP server wrapping them. See [Give agents CLI tools](https://saggar.marginalutility.dev/docs/workflows/cli-tools).

  ```bash
  brew install mcclowes/clip/clip
  clip registry add gh --purpose "Read issues and open pull requests"
  clip sync
  ```

## Prompts

Bounded prompts that say what to read, what not to touch, and what to report. They suit unattended sessions because the agent knows when it's finished.

### Describe this project

A safe first prompt in an unfamiliar repository. ▶ [Run with Claude][describe-claude] · ▶ [Run with Codex][describe-codex]

```text
Describe this project in five bullets. Don't change any files.
```

### Triage open issues

A read-only pass over the tracker. Needs the [`gh` CLI](#cli-tools). ▶ [Run with Claude][triage-claude] · ▶ [Run with Codex][triage-codex]

```text
Review this repository's open issues with the gh CLI. For each one, say whether it's done, stale, a duplicate, or still valid, and why. Don't close, label, or comment on anything. Finish with a short list of the issues you'd close and the three you'd work on next.
```

### Check the docs against the code

▶ [Run with Claude][docs-claude] · ▶ [Run with Codex][docs-codex]

```text
Read the README, the agent instructions file, and the docs folder, then check each claim against the code. List anything inaccurate, outdated, or missing, with the file and line. Don't change any files.
```

### Review dependency updates

▶ [Run with Claude][deps-claude] · ▶ [Run with Codex][deps-codex]

```text
Check this project's dependencies for available updates and known vulnerabilities using its own package manager. Read the release notes for anything with a major version change. Recommend which updates to take now, which to defer, and why. Don't change any files.
```

### Implement an issue

Too specific to link, so copy it and fill in the brackets. From [Implement an issue in a worktree](https://saggar.marginalutility.dev/docs/workflows/implement-issue).

```text
Implement issue #[number]. Read the issue and existing code before choosing an approach. Keep the change within [area]. Add tests for the new behavior and run the affected checks. Don't broaden the public API. Finish with the decisions you made, changed files, and checks run.
```

### Investigate and fix a bug

From [Investigate and fix a bug](https://saggar.marginalutility.dev/docs/workflows/investigate-bug).

```text
Diagnose and fix [failure].

Reproduce it with:
1. [step]
2. [step]

Expected: [behavior]
Observed: [behavior]

Find the root cause before changing code. Add a regression test that fails for the cause, implement the smallest fix, and run [checks]. Finish with the cause, why the fix addresses it, and the evidence that it works.
```

### Learn a CLI from its help text

Works for any tool the agent hasn't met. Swap in your own.

```text
Run 'stripe --help' to learn the Stripe CLI, then list the last ten failed payments and summarize the decline reasons.
```

## Prompts that use the saggar CLI

These ask the agent to drive Saggar itself. They need the `saggar` command, and work best with the [saggar-cli skill](#start-here). Commands that run something ask for your consent on the Mac first. See the [saggar CLI reference](https://saggar.marginalutility.dev/docs/reference/saggar-cli).

### Set up this project's commands

Turns your package scripts into one-click buttons in the Commands tab. ▶ [Run with Claude][commands-claude] · ▶ [Run with Codex][commands-codex]

```text
Set up this project's Saggar commands. Read the package scripts, Makefile, or task runner to find the dev server, the tests, the linter, and the build. Add each one with `saggar config command --name "<name>" -- <command>`. Use --monitor for long-running processes such as the dev server and a test watcher, --quick for one-shot checks, and tag the command that reproduces CI by adding #ci to its line in .saggar/commands.md. Run `saggar help` first if a flag is unclear. Don't change anything outside .saggar/. Finish with the list of commands you added.
```

### Propose a layout

▶ [Run with Claude][layout-claude] · ▶ [Run with Codex][layout-codex]

```text
Propose a Saggar layout for this project. Read .saggar/commands.md and the package scripts, then add a `## Layout` section to .saggar/commands.md with an agent tagged #primary, the dev server tagged #monitor, and the test watcher tagged #monitor. Keep existing commands as they are. Show me the section before you save it.
```

### Keep the dev server in view

Copy it and describe the task.

```text
Start this project's dev server with `saggar monitor` so its output stays docked where I can see it, then carry on with the task in this terminal. If the monitor reports an error, read it with `saggar read` before changing code. When you're blocked or need a decision, run `saggar attention "<why>"` and stop. The task: [describe the task]
```

### Delegate to other agents and wait

```text
Split this task into independent parts. For each part, start a new agent with `saggar agent <provider> --queue --title "<part>" -- <task>`, giving it a bounded task and telling it to report findings only. Use `saggar list` to find the terminals and `saggar wait <id>` to wait for each one, then read the results with `saggar read <id>` and summarize them. The task: [describe the task]
```

## Terminal UIs

Full-screen tools worth a session of their own. Each link adds a session preset, and the tool still needs installing first.

- [lazygit](https://github.com/jesseduffield/lazygit) - Git in a TUI. Open it beside an agent's session to review what changed, one hunk at a time, before it commits. `brew install lazygit` ▶ [Add session][session-lazygit]
- [gh-dash](https://github.com/dlvhdr/gh-dash) - Pull requests and issues across repositories in one dashboard. Useful when agents open pull requests faster than you review them. `gh extension install dlvhdr/gh-dash` ▶ [Add session][session-gh-dash]
- [lazydocker](https://github.com/jesseduffield/lazydocker) - Containers, logs, and resource use at a glance, for when an agent's change takes a service down. `brew install lazydocker` ▶ [Add session][session-lazydocker]
- [btop](https://github.com/aristocratos/btop) - Shows which of your parallel agents, builds, and test runs is eating the machine. `brew install btop` ▶ [Add session][session-btop]

## CLI tools

Tools agents can run as well as you can. One install and one login serves every agent on the Mac, which is why we prefer a CLI to an MCP server where one exists. More detail in [Terminal tools we like](https://saggar.marginalutility.dev/docs/workflows/terminal-tools).

- [GitHub CLI](https://cli.github.com) - Issues, pull requests, and CI logs from the shell. Saggar's hooks and several prompts here rely on it. `brew install gh && gh auth login`
- [Worktrunk](https://worktrunk.dev) - Git worktrees as easy as branches. `wt switch --create -x claude fix-login` makes a branch, a worktree, and starts Claude in it. `brew install worktrunk && wt config shell install`
- [delta](https://github.com/dandavison/delta) - A pager for Git diffs with syntax highlighting and word-level changes, for reviewing a worktree after an agent finishes. `brew install git-delta`
- [jq](https://jqlang.org) - Pairs with `--json` flags so agents parse structured output instead of guessing at prose. `brew install jq`

## Project commands and layouts

Lines for a project's `.saggar/commands.md`, which Saggar turns into one-click buttons. A bullet with a backticked span is a command: the text before names it, the text after annotates it, and tags say where it lands. See [Commands, startups, and scheduled tasks](https://saggar.marginalutility.dev/docs/commands).

Add one from a terminal:

```bash
saggar config command --name "Dev server" --monitor -- npm run dev
```

A starting point for a web project:

```markdown
# Commands

- Dev server `npm run dev` // port 3000 #monitor #browser
- Tests `npm test` // the full suite #ci
- Typecheck `npm run typecheck` #quick
- Review my changes `@claude review the uncommitted changes and list risks; don't edit files`

## Layout

- Agent `claude` #primary
- Git `lazygit` #background #dashboard
- Dev server `npm run dev` #monitor
- Tests `npm run test:watch` #monitor
```

A command that starts with `@claude` or `@codex` opens that agent with the rest of the line as its task.

## Scheduled tasks

Recurring tasks for a project's **Automations** tab. Create a task, then paste the schedule and command. Tasks run only while Saggar is open, and each one opens a fresh session you can watch. See [scheduled tasks](https://saggar.marginalutility.dev/docs/commands#scheduled-tasks). ▶ [Open Automation settings][nav-automation]

| Task | Schedule | Command |
| --- | --- | --- |
| Weekly issue review | `0 9 * * 1` | `@claude review open issues with the gh CLI and list any that look done or stale; don't close anything` |
| Weekly docs check | `0 9 * * 1` | `@claude check the README and docs against the code and list anything inaccurate; don't change files` |
| Weekly dependency check | `0 9 * * 1` | `npm outdated; npm audit` |
| Stale branch sweep | `0 9 1 * *` | `@claude list local and remote branches with no commits in 30 days and say which look merged; don't delete anything` |

Schedule agents to report, not to act, until you trust the prompt. A task that edits code on a timer should work in its own worktree.

## Hooks

A [hook](https://saggar.marginalutility.dev/docs/hooks) is an address you give a CI service or webhook sender. When something fails, Saggar can have an investigation underway before you sit back down.

- **GitHub CI failures, labeled issues, and requested changes** work out of the box. Create the hook in a project's Automations tab and choose **Set up GitHub with agent**.
- **Label an issue `saggar`** to have an agent triage it and post one comment. **`saggar:act`** authorizes a fix on a new branch and a pull request.
- **Any other sender** can use a hook if it sends JSON with a `title` and signs the raw body with HMAC-SHA256. Only a failing `conclusion` is investigated:

  ```bash
  body='{"title":"Production deploy failed","conclusion":"failure","key":"deploy-production","url":"https://example.com/deploys/123"}'
  signature=$(printf '%s' "$body" | openssl dgst -sha256 -hmac "$SAGGAR_HOOK_SECRET" | awk '{print $NF}')
  curl -sS -X POST "$SAGGAR_HOOK_URL" \
    -H "Content-Type: application/json" \
    -H "X-Hub-Signature-256: sha256=$signature" \
    -d "$body"
  ```

Adapters for other services are welcome here: a deploy failure, a Sentry regression, a dependency update. Keep customer data out of the payload.

## Settings

Small changes people keep recommending. Each link shows an exact before-and-after diff in the app.

- **Longer scrollback** - 10,000 lines, so an agent's long turn doesn't scroll out of reach. ▶ [Apply][settings-scrollback]
- **Session presets** - Where the Add session links above end up. ▶ [Open Presets][nav-presets]
- **Providers** - Choose which agents Saggar offers when you start a session. ▶ [Open Providers][nav-providers]

<!-- Saggar links. Build them with `npm run link`, and check them with `npm run links:check`. -->

[nav-cli]: https://saggar.marginalutility.dev/open/v1/navigate?pane=cli
[nav-automation]: https://saggar.marginalutility.dev/open/v1/navigate?pane=automation
[nav-presets]: https://saggar.marginalutility.dev/open/v1/navigate?pane=presets
[nav-providers]: https://saggar.marginalutility.dev/open/v1/navigate?pane=providers
[skill-claude]: https://saggar.marginalutility.dev/open/v1/skill?id=saggar-cli&provider=claude
[skill-codex]: https://saggar.marginalutility.dev/open/v1/skill?id=saggar-cli&provider=codex
[session-lazygit]: https://saggar.marginalutility.dev/open/v1/session?name=lazygit&command=lazygit
[session-gh-dash]: https://saggar.marginalutility.dev/open/v1/session?name=GitHub%20dashboard&command=gh%20dash
[session-lazydocker]: https://saggar.marginalutility.dev/open/v1/session?name=lazydocker&command=lazydocker
[session-btop]: https://saggar.marginalutility.dev/open/v1/session?name=btop&command=btop
[settings-scrollback]: https://saggar.marginalutility.dev/open/v1/settings?terminalScrollback=10000
[describe-claude]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Describe%20this%20project%20in%20five%20bullets.%20Don%27t%20change%20any%20files.&provider=claude&model=opus&title=Describe%20this%20project
[describe-codex]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Describe%20this%20project%20in%20five%20bullets.%20Don%27t%20change%20any%20files.&provider=codex&model=gpt-5.6-sol&title=Describe%20this%20project
[triage-claude]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Review%20this%20repository%27s%20open%20issues%20with%20the%20gh%20CLI.%20For%20each%20one%2C%20say%20whether%20it%27s%20done%2C%20stale%2C%20a%20duplicate%2C%20or%20still%20valid%2C%20and%20why.%20Don%27t%20close%2C%20label%2C%20or%20comment%20on%20anything.%20Finish%20with%20a%20short%20list%20of%20the%20issues%20you%27d%20close%20and%20the%20three%20you%27d%20work%20on%20next.&provider=claude&model=opus&title=Triage%20open%20issues
[triage-codex]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Review%20this%20repository%27s%20open%20issues%20with%20the%20gh%20CLI.%20For%20each%20one%2C%20say%20whether%20it%27s%20done%2C%20stale%2C%20a%20duplicate%2C%20or%20still%20valid%2C%20and%20why.%20Don%27t%20close%2C%20label%2C%20or%20comment%20on%20anything.%20Finish%20with%20a%20short%20list%20of%20the%20issues%20you%27d%20close%20and%20the%20three%20you%27d%20work%20on%20next.&provider=codex&model=gpt-5.6-sol&title=Triage%20open%20issues
[docs-claude]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Read%20the%20README%2C%20the%20agent%20instructions%20file%2C%20and%20the%20docs%20folder%2C%20then%20check%20each%20claim%20against%20the%20code.%20List%20anything%20inaccurate%2C%20outdated%2C%20or%20missing%2C%20with%20the%20file%20and%20line.%20Don%27t%20change%20any%20files.&provider=claude&model=opus&title=Check%20the%20docs%20against%20the%20code
[docs-codex]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Read%20the%20README%2C%20the%20agent%20instructions%20file%2C%20and%20the%20docs%20folder%2C%20then%20check%20each%20claim%20against%20the%20code.%20List%20anything%20inaccurate%2C%20outdated%2C%20or%20missing%2C%20with%20the%20file%20and%20line.%20Don%27t%20change%20any%20files.&provider=codex&model=gpt-5.6-sol&title=Check%20the%20docs%20against%20the%20code
[deps-claude]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Check%20this%20project%27s%20dependencies%20for%20available%20updates%20and%20known%20vulnerabilities%20using%20its%20own%20package%20manager.%20Read%20the%20release%20notes%20for%20anything%20with%20a%20major%20version%20change.%20Recommend%20which%20updates%20to%20take%20now%2C%20which%20to%20defer%2C%20and%20why.%20Don%27t%20change%20any%20files.&provider=claude&model=opus&title=Review%20dependency%20updates
[deps-codex]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Check%20this%20project%27s%20dependencies%20for%20available%20updates%20and%20known%20vulnerabilities%20using%20its%20own%20package%20manager.%20Read%20the%20release%20notes%20for%20anything%20with%20a%20major%20version%20change.%20Recommend%20which%20updates%20to%20take%20now%2C%20which%20to%20defer%2C%20and%20why.%20Don%27t%20change%20any%20files.&provider=codex&model=gpt-5.6-sol&title=Review%20dependency%20updates
[commands-claude]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Set%20up%20this%20project%27s%20Saggar%20commands.%20Read%20the%20package%20scripts%2C%20Makefile%2C%20or%20task%20runner%20to%20find%20the%20dev%20server%2C%20the%20tests%2C%20the%20linter%2C%20and%20the%20build.%20Add%20each%20one%20with%20%60saggar%20config%20command%20--name%20%22%3Cname%3E%22%20--%20%3Ccommand%3E%60.%20Use%20--monitor%20for%20long-running%20processes%20such%20as%20the%20dev%20server%20and%20a%20test%20watcher%2C%20--quick%20for%20one-shot%20checks%2C%20and%20tag%20the%20command%20that%20reproduces%20CI%20by%20adding%20%23ci%20to%20its%20line%20in%20.saggar%2Fcommands.md.%20Run%20%60saggar%20help%60%20first%20if%20a%20flag%20is%20unclear.%20Don%27t%20change%20anything%20outside%20.saggar%2F.%20Finish%20with%20the%20list%20of%20commands%20you%20added.&provider=claude&model=opus&title=Set%20up%20this%20project%27s%20commands
[commands-codex]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Set%20up%20this%20project%27s%20Saggar%20commands.%20Read%20the%20package%20scripts%2C%20Makefile%2C%20or%20task%20runner%20to%20find%20the%20dev%20server%2C%20the%20tests%2C%20the%20linter%2C%20and%20the%20build.%20Add%20each%20one%20with%20%60saggar%20config%20command%20--name%20%22%3Cname%3E%22%20--%20%3Ccommand%3E%60.%20Use%20--monitor%20for%20long-running%20processes%20such%20as%20the%20dev%20server%20and%20a%20test%20watcher%2C%20--quick%20for%20one-shot%20checks%2C%20and%20tag%20the%20command%20that%20reproduces%20CI%20by%20adding%20%23ci%20to%20its%20line%20in%20.saggar%2Fcommands.md.%20Run%20%60saggar%20help%60%20first%20if%20a%20flag%20is%20unclear.%20Don%27t%20change%20anything%20outside%20.saggar%2F.%20Finish%20with%20the%20list%20of%20commands%20you%20added.&provider=codex&model=gpt-5.6-sol&title=Set%20up%20this%20project%27s%20commands
[layout-claude]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Propose%20a%20Saggar%20layout%20for%20this%20project.%20Read%20.saggar%2Fcommands.md%20and%20the%20package%20scripts%2C%20then%20add%20a%20%60%23%23%20Layout%60%20section%20to%20.saggar%2Fcommands.md%20with%20an%20agent%20tagged%20%23primary%2C%20the%20dev%20server%20tagged%20%23monitor%2C%20and%20the%20test%20watcher%20tagged%20%23monitor.%20Keep%20existing%20commands%20as%20they%20are.%20Show%20me%20the%20section%20before%20you%20save%20it.&provider=claude&model=opus&title=Propose%20a%20layout
[layout-codex]: https://saggar.marginalutility.dev/open/v1/prompt?prompt=Propose%20a%20Saggar%20layout%20for%20this%20project.%20Read%20.saggar%2Fcommands.md%20and%20the%20package%20scripts%2C%20then%20add%20a%20%60%23%23%20Layout%60%20section%20to%20.saggar%2Fcommands.md%20with%20an%20agent%20tagged%20%23primary%2C%20the%20dev%20server%20tagged%20%23monitor%2C%20and%20the%20test%20watcher%20tagged%20%23monitor.%20Keep%20existing%20commands%20as%20they%20are.%20Show%20me%20the%20section%20before%20you%20save%20it.&provider=codex&model=gpt-5.6-sol&title=Propose%20a%20layout
