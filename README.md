# Past-Self: Distraction & Intention System

A **local-first Chrome extension** designed to help users catch themselves mid-distraction — not by permanently blocking distracting websites, but by making it progressively harder to ignore the intention they set for themselves a few minutes earlier.

The project combines **implementation intentions**, **self-reflection**, and **escalating friction** to interrupt autopilot behavior while still leaving the final choice with the user.

---

## The Problem

Most distraction blockers are binary:

- A website is either **allowed** or **blocked**
- Users can often bypass them by disabling the extension, switching browsers, or waiting for a timer
- They usually focus on restricting access rather than addressing **why the distraction happened**

This project takes a different approach.

Instead of immediately blocking a distracting site, the extension first asks the user to consciously declare:

1. **Why they are opening the site**
2. **How long they intend to stay**
3. What they would rather be doing if the visit turns into unplanned distraction

The extension then tracks the session and progressively increases friction when the user goes beyond their own stated intention.

---

## Core Idea

The project is built around two behavioral concepts.

### 1. Implementation Intentions

People are more likely to follow through on a goal when they make a specific plan:

> **If X happens, I will do Y.**

Instead of simply blocking a site such as YouTube or Instagram, the extension asks the user to state their purpose and time limit before continuing.

Example:

> “I am opening YouTube to watch one tutorial for 10 minutes.”

This converts a vague intention into a concrete commitment that can later be shown back to the user.

### 2. Escalating Friction

A single warning is easy to dismiss.

Instead of using one blunt intervention, this system escalates gradually when the user repeatedly ignores their own intention.

The intervention ladder can include:

- A reminder of the user's original commitment
- Evidence from previous distraction sessions
- Stronger friction after repeated bypasses
- Messages written by the user's **past self** during moments of motivation or reflection

The goal is not to make bypassing impossible.

The goal is to make **mindless bypassing harder**.

---

## How It Works

### Step 1 — User Opens a Distracting Site

When the user visits a tracked distracting website, the extension shows an **intent modal**.

The user is asked:

- Why are you opening this site?
- How long do you plan to stay?

The visit then becomes a tracked distraction session.

### Step 2 — Session Tracking

The extension tracks **active time** on the distracting site.

The timer should reflect actual active usage rather than simply measuring how long the tab has existed.

### Step 3 — Escalating Intervention

If the user exceeds the time they originally planned, the extension begins showing increasingly strong interventions.

#### Level 1 — Commitment Reminder

Shows the user what they said they were going to do.

Example:

> “You said you would stay here for 5 minutes.”

This makes the user's recent intention visible again at the exact moment it is being violated.

#### Level 2 — Behavior Evidence

Shows data from the user's own previous sessions on that site.

Examples may include:

- Previous planned duration
- Actual duration
- Number of times the user continued after an intervention
- Repeated patterns of overuse

The purpose is to confront the user with **their own behavioral evidence**, not generic motivational advice.

#### Level 3 — Backoff / Stronger Friction

If the user keeps bypassing interventions during the same session, the extension applies stronger friction.

The exact UI can evolve, but the principle is:

> Repeated bypasses should require increasingly deliberate action.

---

## Past-Self Reflections

A central idea of the project is **preserving motivation from the past and using it at the moment of temptation**.

Users can write personal messages during moments when they are:

- Motivated
- Regretful after wasting time
- Thinking clearly about long-term goals
- Emotionally connected to why they want to improve

These messages can later be surfaced when the user is about to continue a distracting session.

Examples of reflection themes may include:

- Family expectations
- Career goals
- Personal ambitions
- Future lifestyle goals
- Previous regret after wasting time
- Reasons the distraction did not feel worth it afterward

These are not generic motivational quotes.

They are intended to be **personally authored reminders from the user's own past self**.

---

## The Main Psychological Loop

The central flow of the project is:

```text
Past Motivation
      ↓
Stored Reflection
      ↓
Future Temptation
      ↓
Intervention
      ↓
Conscious Decision
```

The goal is to capture motivation at a time when the user genuinely feels it and bring that motivation back when it is most useful.

---

## Intentional Breaks vs Unplanned Distraction

The project should not treat every visit to a distracting website as bad.

Sometimes the user may genuinely want to:

- relax,
- refresh,
- watch something intentionally,
- take a short break.

In these situations, the extension can allow the user to declare that intention and select a short duration.

For example:

```text
Reason: Short break
Duration: 5 minutes
```

The system then respects that choice.

The intervention begins only when the user starts going beyond the time they deliberately selected.

This creates an important distinction:

> The problem is not using entertainment.  
> The problem is continuing without consciously deciding to continue.

---

## Handling a Bypass

The user should still be able to bypass an intervention.

However, a bypass is not ignored.

The extension can record information such as:

- The site
- Planned duration
- Actual duration
- Intervention level
- Number of bypasses
- Whether the user continued after the warning

This information can later be shown back to the user.

For example:

> “Last time you planned to stay for 10 minutes, but stayed for 47 minutes.”

The system therefore learns from the user's own history without requiring an AI model to judge the user.

---

## Dashboard

The extension includes an options/dashboard page where the user can manage the system.

Possible dashboard areas include:

- **Analytics**
- **Tracked sites**
- **Goals**
- **History**
- **Past-self reflections**
- **Privacy settings**

Because the project is local-first, the user's behavioral data remains on the device by default.

---

## Architecture

The codebase separates behavioral logic from the Chrome extension UI.

```text
src/
├── core/                     # Business logic, no UI dependencies
│   ├── SessionEngine.ts      # Tracks active distraction sessions
│   ├── InterventionEngine.ts # Decides intervention type and level
│   ├── StorageService.ts     # Local storage read/write layer
│   ├── SyncEngine.ts         # Sync-related logic
│   └── ActiveTimeTracker.ts  # Tracks active, non-idle tab time
│
├── background/               # Service worker / Chrome extension events
│
├── content/                  # Injected into tracked distracting sites
│
├── components/               # Intervention and intent UI components
│
├── popup/                    # Toolbar popup
│
├── dashboard/                # Analytics, goals, sites, history, privacy
│
├── types/                    # Shared TypeScript types
│
└── utils/                    # Shared helpers
```

---

## Intervention Engine

`InterventionEngine` is the core decision-making component.

Given the current session state, it can use information such as:

- Time spent on the site
- Planned duration
- Number of previous bypasses
- Whether the site is associated with an active goal
- Previous session behavior

It then decides **which intervention should be shown next**.

The intervention logic is designed to be testable independently of the UI.

---

## Tech Stack

- **TypeScript** — primary language
- **React** — UI for popup, dashboard, and content-script modals
- **Vite** — build tooling
- **Chrome Extension Manifest V3**
- **Vitest** — unit testing
- **Chrome Storage API** — local persistence

The content-script UI can be rendered inside a **Shadow DOM** to reduce CSS conflicts with the websites into which the extension is injected.

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/pranessadhwin/DistractionFree1.git
cd DistractionFree1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Extension

```bash
npm run build
```

### 4. Load It in Chrome

1. Open:

```text
chrome://extensions
```

2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the generated `dist/` folder

The extension should now be available in Chrome.

---

## Development

Run the development environment:

```bash
npm run dev
```

Build the production version:

```bash
npm run build
```

Run unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

---

## Permissions

The extension may require Chrome permissions such as:

- `<all_urls>`
- `tabs`
- `webNavigation`
- `scripting`
- `storage`

These permissions are needed to:

- Detect navigation to user-selected distracting websites
- Track active sessions
- Inject intervention UI
- Store local session data and reflections

---

## Privacy

This project is designed with a **local-first** approach.

By default:

- Session history is stored locally
- Past-self reflections are stored locally
- Tracked-site information is stored locally
- No external server is required for the core experience

The project may contain highly personal information such as:

- goals,
- reflections,
- motivation,
- browsing-session behavior.

For this reason, privacy is an important part of the design.

Any future synchronization feature should remain separate from the core system and should be transparent to the user.

---

## Design Principles

The project follows several important principles:

- **Do not rely only on blocking**
- **Make the user state an intention before distraction begins**
- **Use the user's own words rather than generic motivation**
- **Increase friction gradually**
- **Use past behavior as evidence**
- **Allow intentional breaks**
- **Keep the final decision with the user**
- **Store data locally by default**
- **Separate behavioral logic from UI implementation**

---

## Project Goal

The goal is **not** to create another aggressive website blocker.

The goal is to reduce the gap between:

- what the user planned to do,
- what the user is currently doing,
- what the user's past self wanted them to remember.

The extension tries to create a small moment of conscious thinking between:

```text
Impulse → Action
```

and change it into:

```text
Impulse → Reflection → Decision → Action
```

---

## Why This Project Is Different

Most productivity tools act as an external authority:

> “You are not allowed to open this website.”

This project takes a different approach:

> “You said you would use this website for 10 minutes.  
> You have now crossed that limit.  
> Do you still consciously want to continue?”

The system does not try to control the user.

Instead, it makes it harder for the user to quietly ignore a decision they made themselves.

---

## Central Research Question

The main idea behind the project can be expressed as:

> **Can motivation and clarity from a user's past self be preserved and presented back at the exact moment when their future self is about to ignore an intention?**

This is the core concept behind the entire system.

---

## Project Status

This project is currently under active development.

The core direction is established around:

- Intention capture
- Active session tracking
- Escalating interventions
- Past-self reflections
- Bypass tracking
- Local behavioral history
- Analytics

The core session and intervention logic can be unit-tested independently, while the UI and other layers can continue evolving.

---

## Future Improvements

Potential future work includes:

- Better active-time detection
- More configurable intervention levels
- Improved reflection creation flow
- Session analytics and behavioral trends
- Goal-based site rules
- Smarter selection of past-self reflections
- Better distinction between intentional breaks and unconscious distraction
- Improved handling of repeated bypasses
- Optional synchronization across devices

Any future feature should remain consistent with the project's central philosophy:

> **Help users follow intentions they chose themselves instead of simply taking control away from them.**

---

## Demo

A demo GIF or short video can later be added here.

Suggested demo flow:

```text
Open distracting site
        ↓
Choose reason
        ↓
Set intended duration
        ↓
Use the site
        ↓
Cross planned duration
        ↓
Commitment reminder
        ↓
User bypasses
        ↓
Behavior evidence
        ↓
Repeated bypass
        ↓
Past-self reflection / stronger friction
```

---

## License

MIT
