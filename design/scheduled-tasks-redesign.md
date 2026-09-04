# Scheduled tasks: redesign for legibility

Companion mockup: `scheduled-tasks-mock.html` (open it in a browser; it renders in light and dark).

The current screen is a stack of seven identical cards. The one fact that matters, that the nightly smoke tests failed, sits on the fourth line of the first card in small red text, under a green tick. The redesign borrows the structure of GitHub Actions: a status-first list, counts as filters, and run detail that unfolds in place.

## What is wrong today

- **Task state and run outcome are conflated.** Every row carries a green tick and an "Active" pill. Both say the same thing, and neither says whether the task works. The failure is a fourth line of text.
- **The schedule is shown twice.** "Daily at 2:00" and `0 2 * * *` sit side by side in different faces. The cron string is only useful when editing.
- **Times are absolute only.** "next 7 Sep 2026 at 9:00" forces arithmetic. The header already knows the answer ("Next run in 10 hours") but only for one task.
- **Three controls on every row.** Run, expand and the overflow menu are always visible, so the list reads as a toolbar. Run is the destructive one and the most prominent.
- **Filters filter by the wrong axis.** All / Active / Paused / Invalid describe configuration. Nobody opens this screen to find active tasks. They open it to find broken ones.
- **The one caveat that explains most surprises is grey.** "Saggar must be open" is why three tasks last ran at 22:27 instead of 09:00, and why the smoke tests ran at 06:15 instead of 02:00. The screen never connects the two.

## The redesign

**Status icon first, one per row.** Outcome of the last run, not configuration: passed, failed, not run yet, paused. Paused and invalid become badges next to the name, shown only when set. "Active" is the default and gets no label.

**Counts as filters.** All 7 · Failing 1 · Passing 4 · Not run yet 2. Paused and Invalid appear only when non-zero. This is GitHub's status filter, and it is also the summary line.

**One failure notice above the list.** When anything is failing, a single notice names it and links to the detail. When nothing is, the notice is gone. The page opens on the problem.

**Rows, not cards.** A bordered list with a column header: Task, Last run, Next run. Name in the sans face, schedule and command on a second muted line. The command is one monospace line, truncated at the end, full text on hover. The cron string moves to a tooltip on the human schedule.

**Relative times, absolute on hover.** "10 h ago" and "in 3 days" in the row. The exact timestamp in the tooltip and again in the expanded detail. Timezone is stated once, in the column header.

**Late runs are labelled.** When a run started after its scheduled time because Saggar was closed, the row says "13 h late" in amber and the detail says why. This is the product-specific fact that the old screen hid.

**Grouped by next run.** Sorting by next run, the default, groups rows under "Tomorrow, 02:00" and "Mon 7 Sep, 09:00 · 5 tasks start together". The grouping is derived from data, and it surfaces a real problem: five tasks fire in the same minute, three of them Claude sessions.

**Run is hidden until hover.** The overflow menu and the expand chevron stay. Run appears on hover or focus, and lives in the menu and the expanded detail too.

**Expanded detail is the jobs panel.** Outcome, timestamp, duration, exit code, trigger and lateness in one line. Then the last lines of output, then recent runs with the same status icon. Re-run and Open log sit here, where the context is.

## Data the app needs to have

Most of this is display. Two things may need model changes:

- **Trigger and lateness per run.** Each run should record whether it was scheduled or manual, and the scheduled time it was meant to fire. Lateness is the difference.
- **Duration and exit code per run.** The History tab suggests these exist. If not, they are cheap to capture.

The log excerpt, durations and exit code in the mock are illustrative. The task names, schedules, commands and timestamps are from the current screen.

## What I did not change

The app chrome, the tab strip, and the New task button are unchanged. Dark palette and system faces are kept, because this is a screen inside an existing app, not a new identity.
