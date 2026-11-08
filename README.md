# Bomberman DOM

A 2–4 player Bomberman project built with the team's DOM mini-framework and a
WebSocket server.

## Install and run

Requires Node.js 20+.

```sh
npm ci
npm test
npm start
```

Open [http://localhost:8080](http://localhost:8080). Use
`http://localhost:8080/?fake=1` to exercise the scripted lobby and UI without
waiting for other players. The fake advances through the lobby countdown and
emits a sample match/result. Use `?debug` to show the rolling FPS and frame-time
overlay. For a real server session, open multiple browser profiles at the
normal URL and join with different nicknames. Use four independent profiles
for four-player checks; keep measured clients in foreground tabs during
performance recordings.

The optional browser framework check is:

```sh
npm run test:browser
```

Set `CHROME_BIN` if Chrome/Chromium is not on the default executable path.

## Current scope and testing

The app is complete end to end: nickname entry, lobby player/timer display,
WebSocket chat, an authoritative server engine (movement, bombs, chain
reactions, blocks, the 3 power-up types, 3 lives, last-one-standing), DOM
board rendering at 60 fps with interpolation, result display, the fake
transport, and debug performance instrumentation. Bonus modes from the
subject (solo/co-op AI, extra power-ups, team mode, ghost mode) are not
implemented. See [the audit checklist](docs/AUDIT_CHECKLIST.md) for results
and checks that still require a real browser/DevTools recording.

Read [the architecture](docs/ARCHITECTURE.md), [the WebSocket protocol](docs/PROTOCOL.md),
and [Ayoub's app/UI task](docs/TASKS_AYOUB.md) before changing shared interfaces.
