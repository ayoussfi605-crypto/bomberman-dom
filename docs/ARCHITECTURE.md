# bomberman-dom — ARCHITECTURE (v1.1)

Read order: root `README.md` → `../bomberman-dom.md` (objective + audit) → this file → `PROTOCOL.md` → your `TASKS_<NAME>.md`.

Status: **integration draft**. Coordinate contract changes with affected owners until milestone M1 (two real browsers joining and chatting) passes; then stabilize the tested contracts. Yacobe coordinates integration and protocol changes; Hichame maintains the framework. The starter framework patches are already applied.
Goal: a multiplayer Bomberman (2–4 players) in the browser, built with **our mini-framework only**, WebSockets, 60 fps, minimal paint/layers.

## 1. Hard constraints (from the subject / audit)

- Client: our mini-framework only. **No canvas, no WebGL, no other framework/library.**
- WebSockets for chat and gameplay. `requestAnimationFrame` for rendering. 60 fps, no frame drops (checked in DevTools Performance, with Paint flashing and Layer borders).
- Flow: nickname page → waiting page (player counter + chat) → 20 s wait (2+ players) → 10 s countdown (immediately if 4 players) → game.
- 3 lives, corners, fixed walls + random blocks, ≥ 3 power-up types (bomb+1, flame+1, speed), last one standing wins.
- Bonus features: **skipped**.

## 2. Principles

1. **The server is authoritative.** It owns positions, bombs, flames, blocks, power-ups, lives, win. Clients send inputs and render what they receive.
2. **Two data paths on the client.** Anything that changes more than ~10×/second (player positions) never goes through `State`. `State` is only for slow things (screen, lobby, chat, result, errors).
3. **Stable DOM.** The framework diffs positionally, so we never render growing/shrinking lists of game entities. The map is a fixed grid of 195 cells whose *class* changes; players are 4 fixed slots.
4. **Explicit ownership.** Follow the file/directory owners below; styles and server tests are shared directories with file-level ownership. Coordinate edits to `shared/constants.js` and `PROTOCOL.md` with Yacobe and all affected owners.
5. **Contracts first.** Code against section 7. Correct gaps together during M1, update the documents and consumers in the same PR, and stabilize after real integration. Avoid private workarounds.

## 3. Repository layout and owners

```
bomberman-dom/
├─ package.json                      yacobe   ("type":"module", dependency: ws)
├─ docs/                             ARCHITECTURE.md, PROTOCOL.md (yacobe), TASKS_*.md, AUDIT_CHECKLIST.md (ayoub)
├─ tests/                            state/framework: hichame; static server: yacobe
├─ scripts/check-framework-browser.js hichame
├─ shared/constants.js               yacobe coordinates; affected owners review
├─ server/
│  ├─ index.js                       yacobe   http static + ws bootstrap
│  ├─ net/  (transport, session, validate, rateLimit)      yacobe
│  ├─ lobby/ (lobby, room, loop)     yacobe
│  ├─ chat.js                        yacobe
│  ├─ tools/bot.js                   yacobe
│  ├─ game/  (engine, pure logic)    mohamed
│  └─ __tests__/                     owner of the module under test
└─ public/
   ├─ index.html                     ayoub
   ├─ styles/ base.css screens.css chat.css   ayoub
   ├─ styles/ board.css hud.css               hichame
   └─ src/
      ├─ main.js                     ayoub    (wiring only)
      ├─ framework/                  hichame  (canonical runtime + framework maintenance)
      ├─ net/ socket.js fakeSocket.js          yacobe
      ├─ state/store.js              ayoub
      ├─ ui/  (screens, components, netHandlers, render, chatScroll)   ayoub
      ├─ perf/ fpsMeter.js perfOverlay.js      ayoub
      └─ game/ (index, gameView, loop, input, boardView, hud)         hichame
```

The server serves `public/` at `/` and `shared/` at `/shared/`. Client code imports constants with `import { ... } from "/shared/constants.js"`. Server imports are relative to the importing module: `server/index.js` uses `"../shared/constants.js"`, while `server/game/game.js` uses `"../../shared/constants.js"`.

`public/src/framework/` is the only maintained runtime framework. `mini-framework/` is the original reference snapshot, excluded from static serving; do not apply patches twice. Framework tests live in `tests/` and `public/dev/framework-check.html`. The supplied TodoMVC implementation is absent, so no TodoMVC regression pass is claimed.

## 4. Conventions

- **Grid:** 15 columns × 13 rows. Cell `(x, y)`, `x` right, `y` down, origin top-left. Tile index = `y * COLS + x`.
- **Walls:** border + pillars at `(x even, y even)`. **Blocks:** random on the remaining floor, never in a corner safe zone.
- **Safe zone** (always empty): corner cell + `SAFE_ZONE_ARM` (3) cells along each edge, for all 4 corners (even in 2-player games).
- **Escape invariant:** `SAFE_ZONE_ARM > BASE_RANGE`; from each spawn, an empty route must reach a cell outside the first bomb's blast before `BOMB_FUSE_MS`, at `BASE_SPEED`. Recheck this when tuning constants.
- **Positions** are floats in *tile units*, **centre-based**: the centre of cell (1,1) is (1.5, 1.5). Sprite top-left = `(x - 0.5, y - 0.5)` tiles.
- **Slots:** `0..3`, compacted in join order at game start. Corners: slot 0 TL, 1 BR, 2 TR, 3 BL. Colours: `--p0..--p3` (see 7.6).
- **Directions:** `"up" | "down" | "left" | "right" | null`. 4-directional movement only.
- **Time:** the server simulates at 30 Hz (`TICK_MS`). Clients render at display rate (60 fps) by interpolating between snapshots.

## 5. Gameplay defaults (all tunable in `shared/constants.js`)

| Thing | Value |
|---|---|
| Lives | 3, with 2 s invulnerability after a hit (blinks) |
| Bomb fuse / flame duration | 2 s / 0.5 s |
| Base bombs / range / speed | 1 bomb / 2 tiles / 3.5 tiles per second |
| Power-up effects | bomb +1 (max 5), flame +1 (max 6), speed +0.6 (max 3 levels) |
| Blocks | 70 % of eligible floor cells; 30 % of blocks hide a power-up, **pre-assigned at map generation**, with ≥ 2 of each of the 3 types guaranteed |
| Damage | decided by the cell of the player's **centre**; a player can hurt himself; flames trigger other bombs (chain) |
| Flames | stop at walls; destroy the first block they hit (and stop); destroy exposed power-ups and continue through them; ignite bombs and stop that ray (the triggered bomb emits its own rays) |

## 6. Client performance contract

1. One `requestAnimationFrame` loop, running only during the game. No `setInterval` for rendering.
2. Per frame the framework should only diff ~4 player nodes. The tile grid vnode and the HUD/chat vnodes are **cached** and reused by reference (the framework patch makes `patch` skip identical vnodes). **A vnode is immutable once rendered.**
3. Only `transform` and `opacity` are animated. No CSS `transition` on position/size. No box-shadow/filter/blur on the board.
4. `will-change: transform` on the 4 player sprites only — **never on the 195 cells**. Inspect actual layer counts in DevTools; expect a small number, not one per cell. Browser layer assignment is measured, not guaranteed by this layout.
5. No layout reads (`offsetWidth`, `getBoundingClientRect`…) inside the frame loop. The board scales with CSS only (`--tile` from `min(vw, vh)`).
6. Event handlers in per-frame trees are **module-level constants** (never inline arrows), otherwise listeners are re-registered every frame.
7. No `innerHTML` anywhere. No `<svg>` elements (the framework has no SVG namespace support): sprites are CSS shapes or `<img>`.
8. Budget: under ~4 ms of JS per frame. `?debug` shows an FPS / frame-time overlay.

## 7. Interfaces (integration draft; stabilize after M1)

### 7.1 Game engine (`server/game/game.js`, owner mohamed) — pure, no sockets, no timers
```js
createGame(players, seed) -> game
//   players: [{ slot: 0..3, nickname }]   seed: integer (deterministic RNG)
game.setInput(slot, dir)        // dir: "up"|"down"|"left"|"right"|null
game.placeBomb(slot)
game.removePlayer(slot)         // disconnect => eliminated (lives 0, alive false)
game.step(dtMs) -> { tilesChanged: boolean }
game.getSnapshot() -> { tick, players: [ { slot, x, y, dir, moving, alive, lives, invulnerable, maxBombs, range, speedLevel } ] }
game.getTiles()    -> number[]   // length COLS*ROWS, TILE codes, hidden power-ups NOT included
game.getResult()   -> null | { winner: slot|null, players: [ { slot, nickname, lives } ] }
```
The room (yacobe) owns timing: it calls `step(TICK_MS)` at 30 Hz, then broadcasts. Engine mutations outside `step`, including `placeBomb`, set a persistent tile-dirty flag. At the end of the next `step`, capture that flag OR any tile changes during the tick, clear the internal flag, and return the captured value. Reading tiles/snapshots must not clear it.

### 7.2 Client socket (`public/src/net/socket.js`, owner yacobe)
```js
const socket = createSocket();            // or createFakeSocket() when the URL has ?fake=1
socket.connect();
socket.send(type, data);                  // JSON-encodes {type, data}; silently dropped (with console.warn) if not open
const off = socket.on(type, (data) => {}); // handler receives `data` only; returns an unsubscribe fn
const offStatus = socket.onStatus((status) => {});          // "connecting" | "open" | "closed"; called immediately with the current status
socket.close();
```
`createFakeSocket()` has the same API plus `emit(type, data)` and plays a scripted scenario (see TASKS_YACOBE).

### 7.3 Store (`public/src/state/store.js`, owner ayoub) — a framework `State`
```js
{
  connection: "connecting" | "open" | "closed",
  phase: "lobby" | "playing",              // from `hello`; set to playing at `start`
  screen: "nickname" | "lobby" | "game" | "over",
  me: null | { nickname, slot },           // slot is set at `start`
  error: null | { code, message },
  lobby: { players: [], count: 0, max: 4, timer: null | { kind, secondsLeft } },
  chat: [ { from, text, ts } ],            // from === null -> system. Immutable updates only. Capped at 100.
  players: [ { slot, nickname } ],         // from `start`
  result: null | { winner, players: [ { slot, nickname, lives } ] }
}
```
Create the app store with `new State(initialState, { batch: "microtask" })`. The framework default remains synchronous for compatibility. Never put per-frame data (positions) in the store.

### 7.4 Game view (`public/src/game/gameView.js`, owner hichame) — plain mutable module, NOT in the store
```js
gameView.reset(startData)           // from `start`: cols, rows, tiles, players, you
gameView.setTiles(tiles)            // from `tiles`
gameView.pushSnapshot(snapshot)     // from `snapshot`, stamps the receive time
gameView.getFrame(nowMs) -> { tiles, tilesVersion, players: [ ...interpolated players... ] }
```
`tilesVersion` increments on reset and when new tiles arrive (the renderer rebuilds the grid vnode only then). Retain a bounded `SNAPSHOT_HISTORY_MS` (500 ms) history of whole snapshots; two snapshots are insufficient for the 66 ms interpolation delay. Use server `tick * TICK_MS` for simulation timestamps and a local clock mapping. See Hichame's task for startup/stale-buffer behaviour.

### 7.5 Who handles which message, and who renders `#app`

| Message types | Handler module | What it does |
|---|---|---|
| `hello, joined, error, lobby, chat` | `ui/netHandlers.js` (ayoub) | updates the store |
| `start, tiles, snapshot, gameover` | `game/index.js` (hichame) | updates `gameView`, starts/stops the loop, sets `screen: "game"` / `"over"` in the store |

- `main.js` creates the socket, calls `initUI({ socket, store })` and `initGame({ socket, store })`, then `socket.connect()`.
- **Rendering of `#app`:** ayoub's `ui/render.js` subscribes to the store and renders the current screen **only when `state.screen !== "game"`**. While `screen === "game"`, hichame's rAF loop renders `#app` every frame (including the chat panel, built with ayoub's `chatPanel()` and cached by the `chat` array reference). Handover happens by `screen` changes only. Before leaving the game, cancel its pending rAF and clear held input. `start()` is idempotent; `stop()` cancels the stored rAF id. A closed socket during a match stops the loop, clears input, sets a connection error, and returns to the nickname screen. `onStatus` returns an unsubscribe function.
- `initUI` is exported from `ui/index.js`; `initGame` from `game/index.js`. Both return a cleanup function that unsubscribes handlers/listeners. Chat focus is observed by game input with `listen(document, "focusin", ...)`: clear held keys and send stop before typing. `hello` after `gameover` updates room phase but preserves the result screen.

### 7.6 Shared DOM ids and CSS tokens

- Ids: `#app` (mount), `#chat-log`, `#chat-input` (game input focuses it on Enter).
- CSS custom properties (defined in `base.css` by ayoub, used by everyone): `--p0:#e63946; --p1:#2a9df4; --p2:#2ecc71; --p3:#f1c40f;` (player colours), `--bg`, `--fg`, `--panel`, `--accent`.
- `--tile` (cell size in px) is defined by hichame in `board.css`.
- Keyboard: arrows and WASD **by physical key** (`event.code`: `ArrowUp…`, `KeyW/KeyA/KeyS/KeyD` — on AZERTY this is ZQSD), bomb = `Space`, `Enter` focuses chat, `Escape` leaves chat.

## 8. Working agreements

- Use `main` as the integration branch. One branch per task: `yacobe/lobby-timers`, `hichame/board-render`… Open a PR; Yacobe coordinates merges after the affected owner reviews. Configure GitHub branch protection separately if desired; this document does not enable it.
- Only touch files in your own directories. Need a change elsewhere? Ask the owner; Yacobe coordinates changes affecting several owners.
- Commit small and often; rebase on `main` before opening a PR; never commit `node_modules`.
- Each PR description: what changed, how you tested it, which audit question it supports.
- Pure modules (engine, lobby state machine, validators) come with `node:test` tests (`node --test`).
- Use `?fake=1` (client) and `server/tools/bot.js` (server) so nobody waits for anybody else.

## 9. Project assumptions (coordinate changes with affected owners)

- Refreshing mid-game = elimination (no reconnect).
- The 20 s timer starts when the 2nd player joins and is not reset by later joins; joining during the 10 s countdown is allowed until 4.
- One room, one game at a time; late joiners get `GAME_IN_PROGRESS`.
- After a game: everyone is un-joined and must `join` again.


## 10. Shared delivery milestones

These milestones take priority over completing every phase of one person's task in isolation.

| Milestone | Deliverable | Owners / acceptance |
|---|---|---|
| M0 — starter (included) | Root package, static dev server, shared constants, patched canonical framework, automated state tests and browser verification page | Framework maintenance: Hichame. Bootstrap/server: Yacobe. README: Ayoub. Run the starter checks before starting a branch. |
| M1 — real lobby/chat | Two real browsers join, see the same counter, exchange messages | Yacobe + Ayoub; stabilize protocol after this works. Ship a small fake socket API early, then expand its match scenario alongside real integration. |
| M2 — match start | Real 20 s / 10 s and four-player rules start the engine skeleton, with visible static board | All four; Mohamed delivers the engine API/map first, Hichame renders it. |
| M3 — complete match | Two real users move, bomb, take damage, and reach a result | Mohamed + Hichame, integrated through Yacobe; test chat focus while moving. |
| M4 — audit | Four humans finish a match, play a second match, exercise disconnects, and record performance evidence | Whole team; Ayoub records results in AUDIT_CHECKLIST.md. |

Yacobe's network/room work and Mohamed's movement/explosion rules are substantial. Keep PRs small and integrate each milestone before polishing fake scenarios, sprites, or tooling. Ayoub publishes the chat/performance exports early; Hichame can begin a static board immediately. No client prediction or bonus modes are required for the first playable match; evaluate movement latency with the real server before adding prediction.
