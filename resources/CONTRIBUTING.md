# Contributing to Saggar resources

This list is curated by the people who use Saggar. If something saves you time when several agents and terminals run at once, it probably belongs here.

## What belongs

Add something you've used yourself for at least a couple of weeks. Say what it's for in the context of running agents, not what it is in general. "Git in a TUI" describes lazygit anywhere; "review what the agent changed, one hunk at a time, before it commits" says why it's on this list.

| Section | Add |
| --- | --- |
| Skills | Agent skills that help an agent work inside Saggar, or alongside it |
| Prompts | Bounded prompts that say what to read, what not to touch, and what to report |
| Prompts that use the saggar CLI | Prompts that have the agent drive Saggar with the `saggar` command |
| Terminal UIs | Full-screen tools worth a session of their own |
| CLI tools | Tools agents can run as well as you can |
| Project commands and layouts | Lines and sections for `.saggar/commands.md` |
| Scheduled tasks | A cron schedule and a command for the Automations tab |
| Hooks | Webhook adapters and hook recipes |
| Settings | Setting changes worth recommending, with a reason |

We'll usually say no to:

- Tools that are unmaintained, closed to new users, or paid with no free tier, unless nothing else does the job.
- Your own project, if nobody else has used it yet. Share it in [Discussions](https://github.com/mcclowes/saggar/discussions) first.
- Anything that needs Saggar's private source, internal links, or a private repository to make sense.
- A second tool for a job the list already covers, unless you say why it's better for some readers.

## Entry format

One entry per pull request is easiest to review. Put it at the end of its section.

Tools and skills are one bullet: a link, what it's for, how to install it, and a Saggar link where one applies.

```markdown
- [lazygit](https://github.com/jesseduffield/lazygit) - Git in a TUI. Open it beside an agent's session to review what changed, one hunk at a time, before it commits. `brew install lazygit` ▶ [Add session][session-lazygit]
```

Prompts get a heading, one line of context, and the prompt in a `text` block. Mark anything the reader must fill in with `[brackets]`.

Write in sentence case and plain language. Describe what the thing does, and leave out the superlatives.

## Make it actionable with a Saggar link

A [Saggar link](https://saggar.marginalutility.dev/docs/reference/saggar-links) proposes one action to the Mac app. The app shows the full request and waits for the reader to confirm. Use one wherever an entry fits an action:

| Action | Use it for | Label |
| --- | --- | --- |
| `session` | A terminal UI or command worth a session preset | ▶ Add session |
| `prompt` | A prompt that needs no editing before it runs | ▶ Run with Claude, ▶ Run with Codex |
| `skill` | A skill that ships inside Saggar | ▶ Install for … |
| `settings` | A setting change | ▶ Apply |
| `navigate` | Pointing the reader at a Settings pane | ▶ Open … |

Links can't create project commands, scheduled tasks, or hooks yet. Give those as text the reader can paste.

Build the link from this repository's root. You need Node 20 or newer, and nothing to install:

```bash
npm run link -- session --name lazygit --command lazygit
npm run link -- prompt --provider claude --model opus --title "Describe this project" \
  --prompt "Describe this project in five bullets. Don't change any files."
```

Don't hand-encode links or build them with `URLSearchParams`. Spaces must be `%20`, because the app reads `+` as a literal plus sign. The builder gets this right and refuses a link the app would reject.

Add the link as a reference definition at the bottom of `README.md`, and point to it from the entry, so long URLs stay out of the prose:

```markdown
▶ [Add session][session-lazygit]

[session-lazygit]: https://saggar.marginalutility.dev/open/v1/session?name=lazygit&command=lazygit
```

### Rules for prompt links

- The exact prompt must appear in a `text` block beside the link. The checker fails a link that runs anything the page doesn't show.
- Only link prompts that are safe to run as written. If a prompt has `[brackets]` to fill in, leave it as copy-and-paste.
- Prefer prompts that read and report. If a prompt changes files, say so in the line above it, and keep the change inside the project.
- For Claude, use the `opus` or `sonnet` alias as the model so the link doesn't go stale. For Codex, use a current model id, and expect it to be refreshed over time.
- A prompt can be at most 4,000 bytes, and the whole link 8,192.

## Safety

Readers will run what you post, and so will their agents. A pull request won't be merged if it includes:

- A command that pipes a download into a shell, disables a safety check, or deletes or force-pushes anything without the reader choosing to.
- A prompt that tells an agent to skip permission prompts, read credentials, or send data to a third party.
- Secrets, tokens, internal URLs, or customer data, including in example payloads.
- A link shortener or a redirect. Link to the source.

## Before you open the pull request

```bash
npm run links:check
npm test
```

`links:check` validates every Saggar link under `resources/` and prints what each one does, decoded, which is also what a reviewer reads. Then check your entry renders properly on GitHub, and that any install command works on a clean machine.

## Review

A maintainer reads the decoded links, tries the entry, and may edit the wording to match the rest of the list. Entries get removed when a tool is abandoned, a link breaks, or something better replaces it. If an entry here is wrong or out of date, open a pull request or a [Discussion](https://github.com/mcclowes/saggar/discussions).
