# Getting Started — Complete Beginner Guide

Welcome! This guide assumes you have **zero experience** with Claude Code or web development.
Follow every step in order and you'll have a working Google Calendar AI Manager running locally.

---

## What You'll Need Before Starting

- A Mac or PC with internet access
- A Google account with Google Calendar
- About 90 minutes of free time

---

## STEP 1 — Install the Tools (15 min)

### 1a. Install Node.js
Node.js lets your computer run JavaScript outside a browser.

1. Go to https://nodejs.org
2. Download the **LTS version** (the green button)
3. Run the installer, click through all the defaults
4. Open your Terminal (Mac: press `Cmd + Space`, type "Terminal", press Enter)
5. Type this and press Enter to confirm it worked:
   ```
   node --version
   ```
   You should see something like `v20.x.x` ✅

### 1b. Install Git
Git tracks changes to your code files.

1. Go to https://git-scm.com/downloads
2. Download and install for your OS
3. In Terminal, confirm:
   ```
   git --version
   ```

### 1c. Install Claude Code
Claude Code is an AI coding assistant that runs in your Terminal.

1. In Terminal, run:
   ```
   npm install -g @anthropic/claude-code
   ```
2. Follow the setup prompts to connect your Anthropic account
3. Confirm it works:
   ```
   claude --version
   ```

---

## STEP 2 — Set Up Composio (Google Calendar Connection) (20 min)

Composio is the service that connects our app to your Google Calendar safely.

### 2a. Create a Composio account
1. Go to https://composio.dev
2. Click **Sign Up** and create a free account

### 2b. Connect your Google Calendar
1. In the Composio dashboard, click **Integrations**
2. Find **Google Calendar** and click **Connect**
3. Follow the Google OAuth flow — log in with your Google account and grant calendar access
4. Once connected, you'll see a green **Active** status

### 2c. Get your API credentials
1. In Composio dashboard, go to **Settings → API Keys**
2. Copy your **API Key** — save it somewhere safe (like a note)
3. Go to **Connections** and copy your **Connected Account ID**

Keep these handy — you'll need them in Step 4.

---

## STEP 3 — Create the Project Folder and Scaffold the App (10 min)

Open Terminal and run these commands one at a time:

```bash
# Create the project folder
mkdir -p ~/dev/Google-Calendar-AI-Manager/app

# Move into it
cd ~/dev/Google-Calendar-AI-Manager/app

# Create the Next.js app
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

When it asks questions, press **Enter** to accept all defaults.

Then start the dev server:
```bash
npm run dev
```

Open your browser and go to: http://localhost:3000

You should see the default Next.js welcome page. ✅

Press `Ctrl + C` in Terminal to stop the server when done.

---

## STEP 4 — Create Your Environment File (5 min)

Your API keys must NEVER go in the code — they go in a special hidden file.

In Terminal (make sure you're in the `app` folder):
```bash
# Create the env file
touch .env.local
```

Open the file in any text editor and paste this, filling in your real values:
```
COMPOSIO_API_KEY=paste_your_composio_api_key_here
COMPOSIO_ACCOUNT_ID=paste_your_connected_account_id_here
DEFAULT_TIMEZONE=America/Denver
APP_WRITE_CONFIRMATION_REQUIRED=true
```

Replace `America/Denver` with your actual timezone if different.
Find your timezone name at: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

**Important:** This file is secret. Never share it or commit it to GitHub.

---

## STEP 5 — Open Claude Code and Build the App (40 min)

Now the fun part — Claude Code does the coding for you.

### 5a. Start Claude Code
In Terminal, from inside your `app` folder:
```bash
claude
```

This opens the Claude Code interactive session.

### 5b. Build Phase by Phase

Copy and paste each prompt below into Claude Code. Wait for it to finish before moving to the next one.

---

**Prompt 1 — Base Architecture:**
```
Build the base architecture for a Calendar Copilot Lite using Next.js App Router.
Create:
- src/app/page.tsx (dashboard shell)
- src/app/api/health/route.ts
- src/app/api/connection/route.ts
- src/lib/calendar/provider.ts (interface)
- src/lib/calendar/composioProvider.ts (stub implementation)
- src/lib/types.ts (EventSummary, ActionPreview, AuditEntry, UserSettings)
- src/components for StatusCard, EventList, FreeSlotForm, ActionPreviewModal, AuditLog
Use TypeScript strictly. No secrets in client code.
```

After Claude finishes, run:
```bash
npm run build
```
You should see: `compiled successfully` ✅

---

**Prompt 2 — Provider Integration:**
```
Implement server-side Composio provider integration in composioProvider.ts and connect it to API routes.
Add routes:
- POST /api/events/list
- POST /api/events/find-free-slots
- POST /api/events/create-preview
- POST /api/events/create-confirm
- POST /api/events/update-preview
- POST /api/events/update-confirm
- POST /api/events/conflicts
Use preview-first writes and input validation.
```

Test it by running the dev server (`npm run dev`) and opening:
http://localhost:3000/api/health — should return `{"ok":true}` ✅

---

**Prompt 3 — Dashboard UI:**
```
Implement a minimal clean dashboard UI with these sections:
1) Connection status card
2) Agenda list (today + next 7 days)
3) Free slot finder form
4) Create event flow (preview then confirm)
5) Conflict scanner
6) Audit log panel
Keep UI simple, clean, and mobile-safe. Use Tailwind CSS.
```

---

**Prompt 4 — Safety Guardrails:**
```
Add strict safety controls:
- Show timezone label on every date/time input and display
- Reject timezone abbreviations like EST or PST — require IANA format only (e.g. America/Denver)
- Friendly error messages for 401, 403, and 429 responses
- Disable the confirm button while a request is in flight (prevent double-submit)
- Destructive actions (delete, bulk update) require the user to type a confirmation phrase
```

---

## STEP 6 — Test Your App Manually (10 min)

Work through this checklist in your browser:

- [ ] Connection status card shows **Connected**
- [ ] Agenda list shows your real upcoming events
- [ ] Free slot finder returns 3–5 options
- [ ] Create event shows a **preview diff** before writing
- [ ] After confirming, the event appears in Google Calendar **once**
- [ ] Conflict scan detects known overlapping events
- [ ] Trying to delete requires typing a confirmation phrase

If anything fails, describe the error to Claude Code and ask it to fix it.

---

## STEP 7 — Push to GitHub (Optional, 10 min)

If you want to save your work to GitHub:

```bash
cd ~/dev/Google-Calendar-AI-Manager/app
git init
git add .
git commit -m "Initial Calendar AI Manager MVP"
```

Then create a repo on https://github.com and follow the push instructions shown there.

**Never push `.env.local`** — it contains your secrets. Git should ignore it automatically (Next.js sets this up by default).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `node: command not found` | Re-install Node.js from nodejs.org |
| `claude: command not found` | Run `npm install -g @anthropic/claude-code` again |
| Calendar shows no events | Check Composio dashboard — make sure connection is Active |
| API returns 401 | Your `COMPOSIO_API_KEY` in `.env.local` is wrong or expired |
| API returns 429 | Too many requests — wait 60 seconds and retry |
| Duplicate events created | The confirm button was clicked twice — guardrails in Phase 4 fix this |

---

## You're Done!

You've built a real AI-powered web app connected to your Google Calendar.

Next steps when you're comfortable:
- Deploy to Vercel (free): https://vercel.com
- Add a natural language command input
- Connect Gmail for attendee lookup

---

*Built with Claude Code + Next.js + Composio*
