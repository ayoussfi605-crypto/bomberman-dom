# PROTOCOL.md — WebSocket protocol (v0.2 INTEGRATION DRAFT)

**Owner: yacobe.** Review this draft with affected owners during M1 (two real browsers joining/chatting), then stabilize it. Contract changes update this file, consumers, and `shared/constants.js` when constants change, in the same PR. Constants live at `../shared/constants.js` relative to this document.

## 1. Transport

- One WebSocket per browser tab, same host/port as the HTTP server: `ws://${location.host}` (use `wss` if the page is https).
- Text frames, JSON only. Envelope: `{ "type": "<string>", "data": { ... } }`.
- TCP + one socket = messages arrive **in order**. The server relies on that: `start` always comes before the first `snapshot`, and a `tiles` message is sent before the `snapshot` of the same tick.
- Configure `WebSocketServer` with `maxPayload: MAX_MESSAGE_BYTES` (1024) and `perMessageDeflate: false`. Oversized messages close that connection with WebSocket code 1009; no JSON error response is required. Reject binary messages with code 1003. Also retain byte-length validation in the application parser. More than `MAX_MESSAGES_PER_SECOND` per socket → `RATE_LIMITED`, message dropped.
- The server never trusts the client: it only accepts the 4 message types below, validates every field, and ignores anything not allowed in the current phase.
- 10 `BAD_MESSAGE` errors from one socket → the server closes it.
- Every socket has an `error` handler. Server heartbeat: ping every 30 s, mark alive on pong, terminate when the previous ping was unanswered, and invoke normal disconnect cleanup exactly once. Browser clients reply to protocol pings automatically. Clear heartbeat timers on server shutdown.

## 2. Client → Server

| type | data | Allowed when | Notes |
|---|---|---|---|
| `join` | `{ "nickname": "Ada" }` | not joined, room phase `lobby` | trim; 2–12 chars; `NIKC_REGEX`; unique case-insensitively among joined players |
| `chat` | `{ "text": "hello" }` | joined (lobby or playing, dead players too) | trim; empty → ignored silently; > 200 chars → `BAD_MESSAGE`; max 5 per 5 s per player → `RATE_LIMITED`; control characters stripped |
| `input` | `{ "dir": "up" \| "down" \| "left" \| "right" \| null }` | joined, phase `playing` | **sent only when the effective direction changes**. `null` = stop. Last-pressed key wins (client keeps the held-keys stack). |
| `bomb` | `{}` (data may be omitted) | joined, phase `playing` | one-shot event; the engine decides if it is legal |

## 3. Server → Client

### `hello`
Sent right after the socket opens, and to everyone again after a game ends and the room resets.
```json
{ "type": "hello", "data": { "phase": "lobby", "count": 2, "max": 4 } }
```
`phase`: `"lobby"` (joining possible) or `"playing"` (join will be refused).

### `joined`
```json
{ "type": "joined", "data": { "nickname": "Ada" } }
```

### `error`
```json
{ "type": "error", "data": { "code": "NICK_TAKEN", "message": "Nickname already used" } }
```
Codes: `BAD_MESSAGE, UNKNOWN_TYPE, NICK_INVALID, NICK_TAKEN, ROOM_FULL, GAME_IN_PROGRESS, ALREADY_JOINED, NOT_JOINED, RATE_LIMITED`. `message` is human readable (the UI may show it directly).

### `lobby`
Sent to all **joined** players on every membership change **and once per second while a timer runs**.
```json
{ "type": "lobby", "data": {
    "players": ["Ada", "Bob"], "count": 2, "max": 4,
    "timer": { "kind": "wait", "secondsLeft": 14 } } }
```
`timer` is `null` when no timer runs. `kind`: `"wait"` (20 s, waiting for more players) or `"start"` (10 s "get ready" countdown). `secondsLeft = ceil(remainingMs / 1000)`.

### `chat`
```json
{ "type": "chat", "data": { "from": "Ada", "text": "hi", "ts": 1730000000000 } }
```
`from: null` = system message (`"Bob joined"`, `"Bob left"`, `"Bob was eliminated"`...). Sent to all joined players. No history for late joiners.

### `start`
Sent once, to every player, when the countdown ends.
```json
{ "type": "start", "data": {
    "you": 0, "cols": 15, "rows": 13,
    "players": [ { "slot": 0, "nickname": "Ada" }, { "slot": 1, "nickname": "Bob" } ],
    "tiles": [ 1,1,1, "... COLS*ROWS ints ..." ] } }
```
`you` = the receiver's slot. Slots are compacted to `0..n-1` in join order. Corner = `CORNER_BY_SLOT[slot]`.

### `tiles`
Full tile array, sent **only when something changed** (bomb placed, explosion, flame expiry, block destroyed, power-up revealed/picked up). Never a diff — a client that applies it can never be out of sync.
```json
{ "type": "tiles", "data": { "tiles": [ "... COLS*ROWS ints ..." ] } }
```

### `snapshot`
Every tick (30 Hz) while playing.
```json
{ "type": "snapshot", "data": { "tick": 1234, "players": [
  { "slot": 0, "x": 1.5, "y": 1.5, "dir": "down", "moving": false,
    "alive": true, "lives": 3, "invulnerable": false,
    "maxBombs": 1, "range": 2, "speedLevel": 0 } ] } }
```
- `x`,`y` = centre of the player in **tile units** (tile `(cx,cy)` covers `[cx, cx+1) × [cy, cy+1)`, so the centre of tile (1,1) is `(1.5, 1.5)`), rounded to 3 decimals.
- `dir` = facing direction (the last non-null direction); `moving` = position changed this tick.
- Dead players stay in the array with `alive: false, lives: 0`.
- `tick` starts at 0; send an initial snapshot immediately after `start`, then increment once per fixed simulation step. Use `tick * TICK_MS` as simulation time when interpolating. Server catch-up may deliver snapshots close together; receive-time spacing is not simulation duration.
- Baseline rendering delays player positions by 66 ms and applies tiles/status changes immediately. This can briefly show a delayed position beside a newly changed tile; gameplay/damage remain authoritative on the server. Test the visual timing and control latency during M3 before introducing prediction or a tick-buffered world renderer.

### `gameover`
```json
{ "type": "gameover", "data": { "winner": 2, "players": [
  { "slot": 0, "nickname": "Ada", "lives": 0 }, { "slot": 2, "nickname": "Cy", "lives": 1 } ] } }
```
`winner: null` = draw (everybody eliminated in the same tick). After sending it the server **resets**: phase `lobby`, nobody is joined any more, then sends `hello` to every socket. To play again a client sends `join` again.

## 4. Lobby rules (server implements, UI displays)

| Situation | Result |
|---|---|
| count reaches 2 | start `wait` timer (20 s) |
| `wait` running, count reaches 4 | switch **immediately** to `start` timer (10 s) |
| `wait` reaches 0 (2 or 3 players) | `start` timer (10 s) |
| `start` reaches 0 | game starts with the players present |
| join during `wait`/`start` (count < 4) | allowed, **timer is not reset** |
| count drops below 2 at any time before the start | timer cancelled (`timer: null`); when count reaches 2 again a fresh `wait` starts |
| `join` when count is 4 | `ROOM_FULL` |
| `join` while a game runs | `GAME_IN_PROGRESS` |

## 5. Disconnects

- In the lobby: the player is removed, `lobby` is re-broadcast.
- Client-side connection close during a match: clear held keys, cancel the game rAF, show a connection error on the nickname screen; refresh creates a new session. Do not keep animating stale gameplay.
- Mid-game: the player is **eliminated** (`removePlayer`). If one player is left alive, the game ends. Refreshing the page = disconnect = eliminated (accepted).

## 6. Sequence (happy path)

```
client                         server
  | -- connect ----------------> |
  | <------------------ hello ---|  {phase:"lobby", count:1}
  | -- join {Ada} -------------> |
  | <----------------- joined ---|
  | <------------------ lobby ---|  every change + each second of a timer
  | <------------------- chat ---|
  | <------------------ start ---|  tiles + slots
  | <-------------- snapshot x N-|  30 Hz
  | -- input {dir:"left"} -----> |
  | -- bomb -------------------> |
  | <------------------ tiles ---|  when the map changes
  | <---------------- gameover --|
  | <------------------ hello ---|  room reset
```
