# Bomberman DOM — team starter

A 2–4 player DOM Bomberman using our mini-framework and WebSockets.
This commit prepares the team to begin implementation; it is not a playable game.

## Start here

Use Node.js 20+ and npm. From the repository root:

```sh
npm ci
npm test
npm start
```

Open http://localhost:8080/ for the starter page and
http://localhost:8080/dev/framework-check.html for browser framework checks.
Use `PORT=8081 npm start` if 8080 is occupied.

With Chrome installed, `npm run test:browser` runs the same browser checks
automatically. For Chromium or a custom location, set `CHROME_BIN` to its
executable. This optional local headless check uses a temporary browser profile.

Included: a static server, page/CSS starter, shared constants, the patched runtime
framework, automated state/server checks, and browser verification checks.
WebSocket transport, nickname/lobby/chat, the game engine and game renderer are
still assigned work. `?fake=1` and `?debug` become available when their owners
implement them; they are not features of this starter.

## Read before coding

1. [Objective and audit](bomberman-dom.md).
2. [Architecture, interfaces, and shared milestones](docs/ARCHITECTURE.md).
3. [WebSocket protocol](docs/PROTOCOL.md).
4. Your task file below, plus [shared constants](shared/constants.js).

| Owner | Start with | First deliverable |
|---|---|---|
| Ayoub | [App/UI tasks](docs/TASKS_AYOUB.md) | Store, UI entry point, nickname/lobby/chat, early chat/performance exports. |
| Hichame | [Client game tasks](docs/TASKS_HICHAME.md) | Static board and four stable player slots; then interpolation/input. Maintain framework checks. |
| Mohamed | [Engine tasks](docs/TASKS_MOHAMED.md) | Deterministic map with guaranteed first-bomb escape, full engine API skeleton. |
| Yacobe | [Network tasks](docs/TASKS_YACOBE.md) | Socket APIs and small fake; integrate real two-browser join/chat. Coordinate protocol/integration. |

Build order: **real two-browser lobby/chat → real timers and engine skeleton →
complete two-player match → four-player and replay/disconnect/performance audit**.
Keep integrating small PRs; do not finish every module separately before trying
real multiplayer. The protocol remains an integration draft until M1 passes;
changes to shared interfaces need affected owners to review them.

## Framework readiness

**The prerequisite patches are already applied. Your friends can start.**
Use `public/src/framework/` as the maintained runtime. It supports style objects,
cached immutable vnodes, global `listen()` cleanup, recursive event cleanup, and
opt-in state batching. [Framework API](public/src/framework/README.md) and
[patch record](docs/FRAMEWORK_PATCH.md) explain the behaviour and checks.

The default `State` still notifies synchronously. Bomberman's store must opt in:

```js
new State(initialState, { batch: "microtask" });
```

`mini-framework/` preserves the original supplied reference snapshot; do not
modify it or import it from the application. Its TodoMVC implementation was not
included, so it is not a runnable TodoMVC regression fixture.

## Working together

Start each task from the integrated `main`, using your own branch:

```sh
git switch main
git pull --ff-only
git switch -c your-name/your-task
```

Follow the file ownership in the architecture. Yacobe coordinates integration;
Hichame maintains the framework. Each PR describes behaviour, validation, and
which objective/audit item it supports. Run `npm test`; framework changes also
require the browser verification page. Avoid committing dependencies, generated
profiles, or secrets. GitHub branch protection must be configured separately.

Ayoub maintains the project README and final audit record as implementation
progresses. The audit checklist distinguishes planned work from verified work.
