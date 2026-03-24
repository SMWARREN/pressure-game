# Agent System — Pressure Game

Three specialized agents cover the codebase. Each has a home doc they maintain.
When a question falls outside an agent's specialty, it reads the relevant doc
instead of re-exploring the codebase.

---

## Agent Roster

| Agent | Specialty | Home Doc | Invoke With |
|-------|-----------|----------|-------------|
| **Core Agent** | Game engine, store, modes, tiles, BFS, persistence | `docs/core-agent.md` | "ask core agent about X" |
| **Web Agent** | React web app + most of core | `docs/web-agent.md` | "ask web agent about X" |
| **Mobile Agent** | Expo/React Native app | `docs/mobile-agent.md` | "ask mobile agent about X" |

---

## Specialization Boundaries

### Core Agent owns:
- `src/game/store.ts` — Zustand state machine, all actions
- `src/game/types.ts` — all shared TypeScript types
- `src/game/modes/` — GameModeConfig interface, Classic/Zen/Blitz modes
- `src/game/levels.ts` — level data, BFS solver, generateLevel()
- `src/game/achievements/` — achievement types and engine
- `src/game/engine/` — engine backends
- `src/game/contexts/GameEngineProvider.tsx`
- `src/game/api/` — leaderboards, API layer
- `src/game/utils/` — storage, userId, timers

### Web Agent owns:
- `apps/web/` — all web components and screens
- Knows most of core (reads core-agent.md for deep engine questions)
- Bridge between core engine and visual rendering

### Mobile Agent owns:
- `apps/mobile/` — all Expo/React Native screens and components
- `apps/mobile-new/` if present
- `src/game/utils/storage.native.ts` — native storage impl
- `src/config/mobile.ts` — mobile config
- Expo/Metro/EAS config and build setup
- **Defers to Core Agent** for any game engine questions (reads `docs/core-agent.md`)

---

## Cross-Reference Protocol

When an agent gets a question outside its specialty, it does NOT re-explore the codebase.
It reads the appropriate doc section:

```
Mobile Agent gets question about store actions
→ reads docs/core-agent.md § Store Actions
→ answers immediately

Mobile Agent gets question about a web component
→ reads docs/web-agent.md § Components
→ answers immediately

Web Agent gets deep question about BFS solver
→ reads docs/core-agent.md § Level System & BFS Solver
→ answers immediately
```

---

## How to Invoke an Agent

When starting a conversation about a specific area, tell Claude:

> "You are the **[Web|Mobile|Core] Agent**. Read `docs/[web|mobile|core]-agent.md` first,
> and for questions outside your specialty refer to the other agent docs in `docs/`."

Or just say "ask the mobile agent" / "ask core agent" — Claude will know to load the right doc.

---

## Keeping Docs Fresh

After any significant change to the codebase, the relevant agent should update its doc:
- Changed a web component → update `docs/web-agent.md`
- Changed store actions → update `docs/core-agent.md`
- Changed mobile screen → update `docs/mobile-agent.md`

Agents should note the date of last update at the top of their doc.
