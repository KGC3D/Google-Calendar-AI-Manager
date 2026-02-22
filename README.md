# Google Calendar AI Manager

> **Built for beginners of Claude Code** who want to automate and manage their Google Calendar workload using AI — no deep coding experience required.

A safe, step-by-step web app that lets you control your Google Calendar through a clean UI. Every action is previewed before it's written. No accidents, no surprises.

Built with **Next.js + Composio + Claude Code**.

---

## What It Does

- View upcoming events (today + next 7 days)
- Find free time slots automatically
- Create and update events with a **preview before you write** — no accidents
- Detect scheduling conflicts
- Full audit log of every action

---

## Safety First

Every write is **two-step**: preview → confirm.
Deletes require typing `DELETE EVENT` explicitly.
No secrets ever leave the server.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Calendar Provider | Composio (Google Calendar) |
| Database | None (MVP uses localStorage) |
| Deploy | Localhost or Vercel free tier |

---

## Quick Start

See [GETTING_STARTED.md](./GETTING_STARTED.md) for the full beginner walkthrough.

---

## Project Files

| File | Purpose |
|---|---|
| `01_SPEC.txt` | Full product + technical spec |
| `02_BUILD_STEPS.txt` | Phase-by-phase build instructions for Claude Code |
| `GETTING_STARTED.md` | Beginner tutorial (start here) |

---

## License

MIT
