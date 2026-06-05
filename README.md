# @marcfargas/pi-heartbeat

A minimal non-blocking timer tool for [Pi](https://github.com/badlogic/pi-mono) agents.

`pi-heartbeat` lets an agent schedule a one-shot wake-up and return immediately instead of blocking the session with `sleep` or a long-running wait.

## What is Pi?

[Pi](https://github.com/badlogic/pi-mono) is an AI coding agent CLI (`@mariozechner/pi-coding-agent`).

You run AI models in an interactive terminal, and the agent executes tools/commands while you chat with it. In that environment, passive waits like `sleep 60` block the active turn and prevent normal interaction until the command finishes.

## Why this extension?

Without a timer tool, delayed checks often become shell sleeps, polling loops, or long-running turns. That causes:

- blocked chat while waiting
- poor UX for long builds, tests, deploys, rate limits, or external systems
- brittle polling logic inside one agent turn
- weak future context when the wait ends

With `pi-heartbeat`, the agent can set a timer, finish its response, and later wake up with explicit context about what to check next.

## Minimal surface by design

This package intentionally exposes only the `timer` tool.

It does **not**:

- inject anything into the system prompt
- ship Pi skills
- intercept or block `bash`/`sleep`
- register a heartbeat tool
- register slash commands

Put any behavioral policy you want in your own system prompt. The extension only provides the timer capability.

## Install

Install directly from the GitHub repo:

```bash
pi install git:github.com/elpapi42/pi-heartbeat
```

Or pin a specific commit/ref:

```bash
pi install git:github.com/elpapi42/pi-heartbeat@8782806
```

For a project-local install instead of global user settings, add `-l`:

```bash
pi install -l git:github.com/elpapi42/pi-heartbeat
```

You can also add it to your `settings.json`:

```json
{
  "packages": ["git:github.com/elpapi42/pi-heartbeat"]
}
```

## Tool

### `timer`

One-shot non-blocking wake-up after `N` seconds.

```text
timer(seconds: 60, message: "Check if build #42 finished — run gh run view 42")
timer(seconds: 120, message: "Retry deploy status check", id: "deploy-check")
```

Parameters:

- `seconds`: delay before wake-up, from **1** to **3600** seconds.
- `message`: context delivered when the timer fires. Include what was being waited on, what to check, and any command, URL, ID, or other detail needed for the follow-up.
- `id` optional: stable timer ID for idempotent replacement. If another active timer has the same ID, the new timer replaces the old one. If omitted, an ID like `timer-1` is generated.

Behavior:

- returns immediately; it does not block the current turn
- wakes the agent once when the timer expires
- asks Pi to trigger a new turn with the timer message as context
- supports multiple simultaneous timers
- keeps timer state in memory only for the current session/runtime

## When to use it

| Scenario | Blocking approach | Timer approach |
|----------|-------------------|----------------|
| Wait for CI/build | `sleep 60 && gh run view 42` | `timer(60, "Check GitHub Actions run 42 — run gh run view 42")` |
| Deployment propagation | repeated shell sleeps | `timer(120, "Check staging deploy status and verify /health")` |
| Rate-limited API | wait inside the same turn | `timer(30, "Retry the API request that hit a rate limit")` |
| User reminder | keep context in chat manually | `timer(300, "Remind the user that the local server should be ready")` |
| Progressive backoff | polling loop | set a timer, check once when woken, then set another timer if still pending |

## How it works

```text
User: "Start the build and let me know when it's done"

Agent: calls timer(seconds: 60, message: "Check build status — run gh run view 42")
       -> tool returns immediately
       -> agent tells user it will check later
       -> session stays interactive

[60 seconds later]

Timer fires -> Pi receives a visible custom message and requests a new agent turn
-> agent wakes with the timer message in context
-> agent runs the follow-up check
-> if needed, agent can set another timer
```

## vs. sleep

|  | `sleep 60` | `timer(60)` |
|---|---|---|
| Chat blocked? | Yes | No |
| User can interact? | No | Yes |
| Multiple waits? | Sequential | Concurrent |
| Wake-up context? | Shell state only | Explicit message/context |
| Hidden policy? | N/A | None; no prompt injection or sleep interception |

## Limits

- Range: **1–3600 seconds**
- State is in-memory only; timers do not survive Pi process restart, extension reload, or session shutdown.
- There is no slash-command cancellation surface. Reusing the same `id` replaces a pending timer with that ID.
- The package does not enforce use of the timer. If you want the model to prefer timers over `sleep`, add that policy to your own system prompt.

## Best practices

- Put actionable context in timer messages: what to check, how to check it, and what to report.
- Use stable `id` values for idempotent delayed checks, such as `deploy-check` or `ci-run-123`.
- Avoid tight polling. Check once when woken, then schedule another timer only if the condition is still pending.
- Finish the response after setting a timer so the session can go idle while waiting.

## Development

```bash
npm run typecheck # tsc --noEmit
npm run lint      # eslint
```

## License

MIT
