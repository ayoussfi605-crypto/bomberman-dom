# TASKS — yacobe: network layer (server transport, lobby, chat, protocol, client socket)

Read first: `ARCHITECTURE.md`, `PROTOCOL.md`, `../shared/constants.js` (repository path: `shared/constants.js`).

## Mission

Everything that moves bytes and manages *who is in the room and in which phase*. You do **not** write game rules (mohamed's engine) and you do **not** render anything. Your job is also to **unblock the other three**: a small fake socket API (phase 0) lets hichame and ayoub work independently. You coordinate integration/protocol changes; Hichame owns framework maintenance. The static starter is already included, but it has no WebSocket/lobby/game implementation.

## Boundaries

- You own: `package.json`, `server/index.js`, `server/net/`, `server/lobby/`, `server/chat.js`, `server/tools/`, `public/src/net/`, `docs/PROTOCOL.md`.
- You call the engine only through the API in `ARCHITECTURE.md` §7.1. Never read its internals.
- You never touch `public/src/ui`, `public/src/game`, `public/src/framework`.

## Files to create

```
package.json + package-lock.json   starter included; maintain scripts and pinned installation
server/index.js                    static starter included; add WebSocketServer on the same port
server/net/session.js              session object (one per socket)
server/net/transport.js            attaches ws, parses/validates, routes to the room
server/net/validate.js             parseMessage(raw) -> { ok, type, data } | { ok:false, code }
server/net/rateLimit.js            sliding-window limiter
server/lobby/lobby.js              PURE lobby state machine (injectable clock)
server/lobby/room.js               orchestrates phases lobby/playing, sessions, lobby, engine, loop
server/lobby/loop.js               drift-corrected fixed-step loop
server/chat.js                     sanitize + per-player rate limit
server/tools/bot.js                scripted ws bot clients (load + lobby tests)
server/__tests__/validate.test.js
server/__tests__/lobby.test.js
server/__tests__/room.test.js      (with a fake engine and fake sockets)
public/src/net/socket.js           client socket service
public/src/net/fakeSocket.js       scripted fake server for UI development
```

## Phase 0 — unblock everyone (small first PR; expand alongside M1)

1. **Review `PROTOCOL.md`.** Fix gaps together with affected owners; stabilize it after two real browsers join/chat (M1).
2. Publish `public/src/net/socket.js` and a **minimal** `public/src/net/fakeSocket.js` with the shared exports/API first: connect/hello, manual `emit`, join/lobby, and chat echo are enough to unblock UI work. Implement the real WebSocket join/chat path for M1 before completing a scripted fake match. The eventual fake scenario:

   **`public/src/net/fakeSocket.js`** — same API as `socket.js` (`connect, send, on, onStatus, close`) plus `emit(type, data)`. Scenario when it is used (`?fake=1`):
   - on `connect()`: status `open`, emit `hello {phase:"lobby", count:0, max:4}`;
   - on `send("join", {nickname})`: validate nothing complicated (reject `"taken"` as NICK_TAKEN and 1-char names as NICK_INVALID so the UI error path can be tested), emit `joined`, then `lobby` with the player;
   - every 2 s add a fake player (`Bot1`, `Bot2`…) and emit `lobby`; when count ≥ 2 run a `wait` timer ticking once per second; at 4 players switch to `start` timer 10 s;
   - when the timer ends: emit `start` (hardcode or generate a 195-int tile array: border walls, pillars at even/even, some blocks, empty corners) then emit `snapshot` at 30 Hz with 4 players walking around smoothly (e.g. circles) and `moving/dir` set; every few seconds change a few tiles and emit `tiles` (bomb → flame → floor);
   - after ~40 s emit `gameover {winner: 0, players}` then `hello`;
   - answer `send("chat", {text})` by echoing a `chat` message; ignore `input`/`bomb`.
3. Merge the minimal API in the first session; expand the timed match scenario during M2. Do not let the scripted fake delay real two-browser chat. Clear every fake timer on close, gameover, and before replay. Fake `gameover.players` must include final lives, and the fake must support joining again.

## Phase 1 — server skeleton

**`server/index.js`** (extend the included static starter; keep its traversal/MIME handling)
- `http.createServer` serving `public/` at `/` (index → `public/index.html`) and `shared/` at `/shared/`. Correct MIME types for html/js/css/png/jpg/ico/json/woff2. **Block path traversal** (resolve and check the path stays inside the root). `Cache-Control: no-store` during development.
- `new WebSocketServer({ server, perMessageDeflate: false, maxPayload: MAX_MESSAGE_BYTES })`; use the documented connection request socket if setting `setNoDelay(true)`, rather than depending on private `ws._socket`. Oversized payloads close with 1009; reject binary messages with 1003. Attach `error` listeners to the server and each socket. Heartbeat: ping every 30 s, mark alive on pong, terminate when the preceding ping was unanswered; handle disconnect once and clear timers on shutdown.
- `PORT` from env, default 8080. Log the URL.

**`session.js`**: `{ id, ws, nickname: null, joined: false, slot: null, badMessages: 0, limiter }` + `send(type, data)` (JSON; ignore if the socket is not open).

**`validate.js`**: `parseMessage(raw)`: byte length ≤ `MAX_MESSAGE_BYTES`; valid JSON object; `type` ∈ `C2S` values else `UNKNOWN_TYPE`; `data` shape per type (`join.nickname` string; `chat.text` string; `input.dir` ∈ up/down/left/right/null; `bomb` ignores data). Anything else → `BAD_MESSAGE`. No exceptions may escape: a malformed frame must never crash the server.

**`rateLimit.js`**: sliding window; used for (a) all messages per socket (60/s) and (b) chat (5 per 5 s per player).

**`transport.js`**: on message → parse → on error send `error` (and count bad messages; 10 → close) → else `room.handle(session, type, data)`. On close → `room.handleDisconnect(session)`. Also wrap handlers in try/catch so one bad session never kills the process.

## Phase 2 — lobby state machine (`server/lobby/lobby.js`)

Pure module, **no sockets, no `setTimeout`**: the clock is injected so it is testable.

```js
const lobby = createLobby({ now: () => Date.now() });
lobby.join(id, nickname)  // -> { ok: true } | { ok: false, code }   (NICK_INVALID, NICK_TAKEN, ROOM_FULL)
lobby.leave(id)
lobby.update()            // call every ~100 ms -> null | { event: "start", players: [{ id, nickname }] }  (join order)
lobby.view()              // -> { players: [nickname...], count, max, timer: null | { kind, secondsLeft } }
```
Rules: exactly the table in `PROTOCOL.md` §4. Nickname validation: trim, length `NICK_MIN..NICK_MAX`, `NICK_REGEX`, unique case-insensitively.

## Phase 3 — room and game loop

**`loop.js`**: `createLoop(stepFn, tickMs)`; uses `process.hrtime.bigint()` and an accumulator, runs `stepFn` for every full tick elapsed (cap catch-up at e.g. 5 ticks), scheduled with `setTimeout` ~ every 5 ms. A bare `setInterval(…, 33)` drifts and makes movement jerky: don't use it.

**`room.js`** — the only module that knows sessions, lobby *and* engine:
- `phase`: `"lobby"` or `"playing"`.
- `handle(session, type, data)`:
  - `join`: phase `playing` → `GAME_IN_PROGRESS`; already joined → `ALREADY_JOINED`; else `lobby.join`; on success send `joined`, broadcast `lobby`, broadcast chat system message `"<nick> joined"`.
  - `chat`: must be joined (`NOT_JOINED`), rate limit, sanitize (trim, strip control chars, ≤ 200) → broadcast `chat {from, text, ts}` to all joined sessions.
  - `input` / `bomb`: only joined + phase `playing`; map session → `slot`; call `game.setInput(slot, dir)` / `game.placeBomb(slot)`. Otherwise ignore.
- A 100 ms timer calls `lobby.update()`; broadcast `lobby` when `JSON.stringify(view)` changed (that covers the per-second timer ticks). On `{event:"start"}`:
  1. assign slots `0..n-1` in join order;
  2. `game = createGame(players.map(({nickname}, slot) => ({ slot, nickname })), Date.now())`;
  3. send each player `start { you, cols, rows, players, tiles: game.getTiles() }`, immediately followed by the initial `snapshot` (tick 0);
  4. phase = `playing`, start the loop.
- Each tick: `const { tilesChanged } = game.step(TICK_MS)`; if `tilesChanged` broadcast `tiles` **before** the snapshot; broadcast `snapshot`; `const result = game.getResult()`; if not null → broadcast `gameover`, stop the loop, **reset**: un-join every session, new empty lobby, phase `lobby`, send `hello` to every connected socket.
- Disconnect: lobby phase → `lobby.leave`, broadcast `lobby` + system chat; playing phase → `game.removePlayer(slot)` (+ system chat `"<nick> left"`). A disconnect that leaves < 2 players in the lobby cancels the timer (handled by the lobby).
- On connect (any phase) send `hello {phase, count, max}`.
- Until mohamed delivers the real engine, test the room with a stub engine in the test file (static tiles, players that don't move). Import the real one with `import { createGame } from "../game/game.js"` when it lands.

## Phase 4 — client socket (`public/src/net/socket.js`)

Exactly the API in `ARCHITECTURE.md` §7.2: `connect/send/on/onStatus/close`; both `on` and `onStatus` return unsubscribe functions. Register handlers before `connect`; repeated `connect()` while connecting/open must not create another socket.
- URL: `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`.
- Parse JSON in try/catch; ignore unknown types and malformed frames; dispatch `data` to the handlers for that type; a throwing handler must not break the others.
- Status `connecting → open → closed`. **No auto-reconnect** (refresh = new session). Just expose `closed` so the UI can say "Disconnected, refresh the page".
- `send` while not open: drop + `console.warn`.

## Phase 5 — tools and hardening

- **`server/tools/bot.js`**: `node server/tools/bot.js --count 4 --prefix Bot [--url ws://localhost:8080]` joins N bots, logs lobby/timers, and once playing sends random `input` changes (every ~300 ms) and `bomb` every few seconds, logs `gameover`. Used to test timer rules and to load-test.
- Tests (`node --test`): validators (good/bad payloads), lobby (every row of the protocol §4 table with a fake clock: 2 players → wait 20 s; 4 players → start 10 s immediately; drop below 2 cancels; join during start doesn't reset; ROOM_FULL; NICK_TAKEN case-insensitive; NICK_INVALID cases), room with fake sockets (join/chat/phase errors/disconnect handling/reset after gameover).
- Check: kill a socket mid-game, send garbage frames, 2 MB frame, 1000 msgs/s → server survives and the other players are unaffected.

## Definition of done per phase

| Phase | Done when |
|---|---|
| 0 | Minimal fake/real socket exports available; hello/join/lobby/chat echo works; Hichame/Ayoub can build against it. Complete scripted fake match during M2. |
| 1 | `npm start` serves the page and accepts a ws connection; `hello` received; garbage doesn't crash it |
| 2 | lobby tests green (all protocol §4 rows) |
| 3 | 4 bots: timer rules right; game starts; snapshots at ~30 Hz (log the real rate); gameover → reset → bots can join again (implement bot rejoin, rather than stopping after the first game) |
| 4 | the real UI works against the real server |
| 5 | all tests green, abuse checks pass |

## Audit questions you are responsible for

- Nickname asked / waiting page with **player counter** incrementing when a 2nd user joins (browser + private window).
- Chat works between all users **in real time via WebSockets**.
- 2 users → after **20 s** a **10 s** countdown → game starts; 4 users → countdown **immediately** when the 4th joins.
- Server never trusts the client; one disconnect never breaks the others.

## Pitfalls

- Do not send per-player different snapshots; everybody gets the same message (serialize once, send to all).
- `ws` `send` on a closed socket throws/errs: always check `readyState`.
- Reset after `gameover` must clear **all** per-game state (slots, bombs, lobby) or the second game will be broken.
- Never log every snapshot in the hot loop (console I/O causes jitter); log the tick rate once per second at most.
