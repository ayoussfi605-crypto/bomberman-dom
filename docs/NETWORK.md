# Network layer — README (yacobe)

Everything that moves bytes and decides *who is in the room and in which phase*.
This file documents what was created, what every function does, and which phase of
[`TASKS_YACOBE.md`](TASKS_YACOBE.md) it belongs to.

Companion documents: [`ARCHITECTURE.md`](ARCHITECTURE.md) (interfaces §7),
[`PROTOCOL.md`](PROTOCOL.md) (message contract), [`../shared/constants.js`](../shared/constants.js).

> The root `README.md` is maintained by Ayoub (install/run/audit). This file is the
> reference for the network layer.

## Run it

```sh
npm start                                   # http://localhost:8080 (PORT=… to change)
npm test                                    # node --test, 43 tests
node server/tools/bot.js --count 4 --prefix Bot --url ws://localhost:8080
```

The server serves `public/` at `/` and `shared/` at `/shared/`; clients import
constants with `import { … } from "/shared/constants.js"`.

## Files and phases

| File | Phase | Purpose |
|---|---|---|
| `server/index.js` | 1 | HTTP static server + WebSocket bootstrap + heartbeat |
| `server/net/session.js` | 1 | one session object per socket |
| `server/net/validate.js` | 1 | `parseMessage` + error texts |
| `server/net/rateLimit.js` | 1 | sliding-window limiter |
| `server/net/transport.js` | 1 | socket wiring: parse, limit, route to the room |
| `server/chat.js` | 1 (used in 3) | chat sanitizer + per-player chat limit |
| `server/lobby/lobby.js` | 2 | pure lobby state machine (injectable clock) |
| `server/lobby/loop.js` | 3 | drift-corrected fixed-step loop |
| `server/lobby/room.js` | 3 | phases, sessions, engine calls, broadcasts, reset |
| `server/tools/bot.js` | 5 | scripted ws bots (timers, load, replay) |
| `server/__tests__/validate.test.js` | 5 | parser tests (good + bad frames) |
| `server/__tests__/lobby.test.js` | 5 | every row of `PROTOCOL.md` §4 with a fake clock |
| `server/__tests__/room.test.js` | 5 | room with a fake engine and fake sockets |
| `public/src/net/socket.js` | 4 | client socket service (real WebSocket) |
| `public/src/net/fakeSocket.js` | 0 | scripted fake server for UI development |

`server/game/` (engine) is Mohamed's and is **not** part of this layer; the room
only calls the `createGame` API from `ARCHITECTURE.md` §7.1.

## `server/index.js` — Phase 1

```js
createAppServer({ logger = console, room } = {}) -> http.Server
```

Builds the HTTP server and attaches a `WebSocketServer` to it. `room` is injectable
so tests can pass a stub; by default a real `createRoom()` is created.

- **Static serving** (`handleRequest`): `GET`/`HEAD` only (`405` otherwise);
  `public/` at `/` (`/` → `public/index.html`), `shared/` at `/shared/`; MIME for
  html/js/mjs/css/json/png/jpg/jpeg/ico/svg/woff2/woff/md; `Cache-Control: no-store`.
- **`resolveFile(rawPath)`**: percent-decodes (malformed URI → `400`, NUL → `400`),
  picks `public/` or `shared/`, resolves the path and verifies it is still inside
  that root (escape attempt → `403`). Missing file or non-file → `404`.
- **WebSocket**: `{ perMessageDeflate: false, maxPayload: MAX_MESSAGE_BYTES }`
  (oversized frames are closed by `ws` with 1009), `error` listeners on the server,
  the `WebSocketServer` and every socket.
- **Heartbeat**: every 30 s ping each client, `pong` marks it alive, a client that
  missed the previous ping is terminated. The interval is cleared on server close,
  and `room.stop()` is called there too.
- **`loadGameFactory(logger)`**: lazily `import("./game/game.js")`; when the engine
  does not exist the server still boots (lobby/chat work) and logs that matches
  cannot start.
- **Boot**: `PORT` (default 8080), logs the URL, `SIGINT`/`SIGTERM` close cleanly.
  Nothing starts when the file is imported by tests (`isMain` check).

## `server/net/session.js` — Phase 1

```js
createSession(ws, { now } = {}) -> session
```

| Field / method | Meaning |
|---|---|
| `id` | `s1`, `s2`, … unique per connection |
| `ws` | the socket (the room never touches it directly) |
| `nickname` | `null` until joined, then the trimmed nickname |
| `joined` | `true` between `join` and gameover/disconnect |
| `slot` | `null` in lobby, `0..3` assigned at `start` |
| `badMessages` | counter; `transport` closes at 10 |
| `limiter` | per-socket 60 msg/s sliding window |
| `closed` | set once so cleanup cannot run twice |
| `send(type, data)` | JSON `{type, data}`; silently ignored unless the socket is open |
| `sendRaw(payload)` | sends an already-serialized frame (broadcasts serialize once) |

## `server/net/validate.js` — Phase 1

```js
parseMessage(raw) -> { ok: true, type, data } | { ok: false, code }
errorMessage(code) -> string
```

- Accepts a string, `Buffer`/`Uint8Array` or `ArrayBuffer`.
- Fails with `BAD_MESSAGE` when: not text, more than `MAX_MESSAGE_BYTES` UTF-8
  bytes, invalid JSON, not a plain object, wrong/missing `data` shape, chat text
  longer than `CHAT_MAX_LEN`, input `dir` not in `up|down|left|right|null`.
- Fails with `UNKNOWN_TYPE` when `type` is missing or not one of `C2S`.
- `bomb` may omit `data`; it always parses to `{}`.
- Anything unexpected returns `BAD_MESSAGE`; **no exception can escape**.
- `errorMessage` is the single source of the human-readable messages for every
  `ERR` code (used by the transport and the room).

## `server/net/rateLimit.js` — Phase 1

```js
createRateLimiter({ limit = 60, windowMs = 1000, now = Date.now } = {})
  -> { take(): boolean, reset(), count }
```

Sliding window: `take()` prunes expired hits, returns `false` over the limit, and
does not record a rejected hit. Used for all messages per socket (60/s) and chat
(5 per 5 s per player, via `chat.js`).

## `server/net/transport.js` — Phase 1

```js
attachTransport({ wss, room, logger = console, now } = {}) -> void
```

Per connection:

1. `request.socket.setNoDelay(true)` through the documented connection socket.
2. `createSession`, an `error` listener, then `room.handleConnect(session)`
   (which sends `hello`).
3. `message`: binary frame → close `1003`; per-socket limiter exceeded →
   `RATE_LIMITED` and drop; `parseMessage` error → send `error`, increment
   `badMessages`, close `1008` at 10; otherwise `room.handle(session, type, data)`.
4. `close`: `room.handleDisconnect(session)` exactly once.
5. Every path is wrapped in try/catch — one bad session can never kill the process.

## `server/lobby/lobby.js` — Phase 2

```js
validateNickname(raw, takenNicknames = []) -> ERR code | null
createLobby({ now, maxPlayers, waitMs, countdownMs })
  -> { join(id, nickname), leave(id), update(), view(), has(id) }
```

Pure module: no sockets, no timers. The clock is injected so the timer table can be
tested exactly.

| Call | Behaviour |
|---|---|
| `join(id, nickname)` | `{ ok: true, nickname }` or `{ ok: false, code }`; trim, `NICK_MIN..NICK_MAX`, `NICK_REGEX`, unique case-insensitively, `ROOM_FULL` at 4, `ALREADY_JOINED` for the same id |
| `leave(id)` | removes the player; below 2 players the running timer is cancelled |
| `update()` | called by the room every ~100 ms; `null`, or `{ event: "start", players: [{ id, nickname }] }` once, in join order |
| `view()` | `{ players: [nickname…], count, max, timer: null \| { kind, secondsLeft } }` |
| `has(id)` | membership test |

`PROTOCOL.md` §4 rules implemented: 2 players → `wait` 20 s; 4 players → `start`
10 s immediately; `wait` expiry → `start`; joins never reset a timer; below 2
cancels; `secondsLeft = ceil(remaining / 1000)`.

## `server/lobby/loop.js` — Phase 3

```js
createLoop(stepFn, tickMs = TICK_MS, { now, schedule, cancel, maxCatchUp = 5 })
  -> { start(), stop(), running }
```

Fixed-step simulation on `process.hrtime.bigint()` with an accumulator: every full
tick calls `stepFn(tickMs)`, catch-up is capped at 5 ticks (long stall drops the
rest), and the next look at the clock is scheduled ~5 ms later. No `setInterval`,
so movement does not drift. Timers are `unref()`ed and cleared by `stop()`.

## `server/lobby/room.js` — Phase 3

```js
createRoom({ createGame, now, maxPlayers, waitMs, countdownMs, tickMs,
             lobbyPollMs = 100, logger = console } = {})
  -> { handle(session, type, data), handleConnect(session),
       handleDisconnect(session), stop(), phase, playerCount }
```

`createGame` is the engine factory (Phase 1 of the game). Until
`server/game/game.js` exists the room logs one clear error when a match should
start and does nothing else. `createRoom` is the only module that knows sessions,
the lobby and the engine.

| Export | Behaviour |
|---|---|
| `handleConnect(session)` | registers the session and sends `hello { phase, count, max }` |
| `handle(session, type, data)` | routes `join` / `chat` / `input` / `bomb`, otherwise `UNKNOWN_TYPE` |
| `handleDisconnect(session)` | lobby: `lobby.leave` + lobby + system chat; playing: `game.removePlayer(slot)` + system chat; idempotent |
| `stop()` | clears the lobby poll interval and the game loop (server shutdown) |
| `phase` | `"lobby"` or `"playing"` |
| `playerCount` | lobby count, or the number of assigned slots while playing |

Internals (not exported):

- `broadcast(type, data)` — serializes once, sends the same frame to every joined
  session (`sendRaw` when available). Snapshots are never per-player.
- `broadcastChat(from, text)` — `chat { from, text, ts }`; `from: null` = system.
- `fail(session, code)` — `error { code, message }`.
- `tickLobby()` — `lobby.update()`; on `start` → `startGame`, else broadcast the
  lobby view only when its JSON changed (covers the 1 Hz timer ticks).
- `startGame(entries)` — requires the engine, builds `[{ slot, nickname }]` in join
  order, assigns `session.slot`, sets phase `playing`, sends `start { you, cols,
  rows, players, tiles }` per player, then the tick-0 `snapshot`, then starts the
  loop.
- `stepGame(dtMs)` — `game.step(dtMs)`; broadcast `tiles` **before** `snapshot`;
  broadcast `snapshot`; `game.getResult()` → `endGame`; logs the real snapshot
  rate at most once per second.
- `endGame(result)` — broadcast `gameover`, stop the loop, drop the game, un-join
  every session, reset slots, create a fresh lobby, phase `lobby`, send `hello` to
  every socket (replay works).
- `handleJoin` / `handleChat` / `handleGameMessage` — phase and membership checks,
  per-player chat rate limit, sanitizer, `setInput`/`placeBomb` only while playing.

## `server/chat.js` — Phase 1, used by the room (Phase 3)

```js
sanitizeText(raw) -> string | null
createChatGate({ now, limit = CHAT_RATE_MAX, windowMs = CHAT_RATE_WINDOW_MS })
  -> { allow(playerId), forget(playerId), reset() }
```

`sanitizeText` replaces control characters with spaces, collapses whitespace,
trims, returns `null` for an empty result and caps at `CHAT_MAX_LEN`.
`createChatGate` keeps one sliding window per player id (5 messages / 5 s).

## `server/tools/bot.js` — Phase 5

```sh
node server/tools/bot.js --count 4 --prefix Bot [--url ws://localhost:8080]
```

| Symbol | Behaviour |
|---|---|
| `parseArgs(argv)` | `{ count, prefix, url, help }`, tolerant of a bad `--count` |
| `new Bot(nickname, url, logger)` | one scripted client |
| `bot.start()` | connects, joins on `hello`, logs lobby/timers/start/gameover |
| `bot.send(type, data)` | sends a JSON frame when the socket is open |
| `bot.startPlaying()` | random `input` every 300 ms, `bomb` every 2.5 s |
| `bot.stopPlaying()`, `bot.stop()` | clear timers / close the socket |
| `bot.onMessage(type, data)` | joins again on the `hello` after `gameover` (replay) |

## `public/src/net/socket.js` — Phase 4

```js
createSocket({ url } = {}) -> { connect, send, on, onStatus, close, status }
```

| Function | Behaviour |
|---|---|
| `connect()` | sets `connecting`, opens `${wss\|ws}://${location.host}` (or `url`); a second call while connecting/open does nothing |
| `send(type, data)` | JSON frame; when not open it drops the message with `console.warn` |
| `on(type, fn)` | registers a handler for `data` only; returns an unsubscribe function |
| `onStatus(fn)` | called immediately with the current status, then on changes; returns an unsubscribe function |
| `close()` | closes the socket and reports `closed`; no auto-reconnect |
| `status` | `connecting` → `open` → `closed` |

Malformed frames and unknown types are ignored; a throwing handler cannot break the
other handlers; `on`/`onStatus` work before `connect()`.

## `public/src/net/fakeSocket.js` — Phase 0

```js
createFakeSocket({ botEveryMs, matchMs, tileCycleMs } = {})
  -> { connect, send, on, onStatus, close, emit, status }
```

Same API as `socket.js` plus `emit(type, data)`; used for UI work with `?fake=1`
(it is not imported by `public/src/main.js`). Scripted scenario:

1. `connect()` → `open` + `hello { phase: "lobby", count: 0, max: 4 }`.
2. `send("join", { nickname })` → `joined`, then `lobby`; `"taken"` → `NICK_TAKEN`,
   1-character names → `NICK_INVALID`, a game in progress → `GAME_IN_PROGRESS`.
3. A fake player (`Bot1`, `Bot2`, …) every 2 s; 2 players → `wait` ticking each
   second; the 4th → `start` 10 s immediately.
4. Timer end → `start` with a generated 195-cell map (border walls, pillars at
   even/even, random blocks, empty corners), then `snapshot` at 30 Hz with four
   players moving in circles and `dir`/`moving` set; every ~6 s a few cells go
   `bomb → flame → floor` with a `tiles` message.
5. Bots are eliminated at 50/65/80 % of the match, then `gameover { winner: 0,
   players }` with final lives and a fresh `hello` — joining again works.
6. `send("chat", { text })` is echoed as `chat`; `input`/`bomb` are ignored.
7. All timers are cleared on `close()`, on `gameover` and before a replay.

## Tests — Phase 5

| File | Covers |
|---|---|
| `server/__tests__/validate.test.js` (9) | valid frames, Buffer input, bad JSON, non-objects, unknown types, wrong shapes, over-long chat, byte limit |
| `server/__tests__/lobby.test.js` (10) | every `PROTOCOL.md` §4 row with a fake clock, `ROOM_FULL`, `NICK_TAKEN` case-insensitivity, `NICK_INVALID` cases, join order |
| `server/__tests__/room.test.js` (14) | join/hello/joined/system chat, second join, all join errors, chat + sanitize + rate limit, slot assignment, tick-0 snapshot, `GAME_IN_PROGRESS`, input/bomb routing, both disconnect paths, gameover reset, second match |

`node --test` currently reports **43/43 passing** (these 33 plus the framework's 9
and the static-server test).

## Phase status

| Phase | State |
|---|---|
| 0 | **Done** — `socket.js` + `fakeSocket.js` published with the shared API |
| 1 | **Done** — static + ws server, `hello` on connect, garbage never crashes |
| 2 | **Done** — lobby tests green for all §4 rows |
| 3 | **Code complete, waiting on the engine** — the room implements start/tiles/snapshot/gameover/reset and is covered with a fake engine; a real match needs `server/game/game.js` (Mohamed), which `server/index.js` loads automatically |
| 4 | **Socket done** — "the real UI works against the real server" needs Ayoub's screens |
| 5 | **Tests green + bots work (incl. rejoin)**; abuse runs (2 MB frame, 1000 msg/s, kill mid-game) are not executed yet |

## Things deliberately **not** here

- No game rules, no rendering, no framework changes.
- No fake game engine in the server: the stub lives only in
  `server/__tests__/room.test.js`, as the task requires.
- `public/src/main.js` stays Ayoub's starter page; it only imports `createSocket`
  from the canonical `./net/socket.js`.
