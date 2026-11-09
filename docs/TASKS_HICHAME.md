# TASKS — hichame: client game (board rendering, interpolation, input, loop, HUD)

Read first: `ARCHITECTURE.md` (**§6 performance contract** and §7.3–7.6), `PROTOCOL.md` (`start`, `tiles`, `snapshot`, `gameover`), `../shared/constants.js` (repository path: `shared/constants.js`).

## Mission

Everything the player sees and does **during a match**, with the mini-framework, at a steady 60 fps. You turn snapshots into smooth movement and the tile array into a DOM board. The audit's performance questions (fps, frame drops, paint, layers) are yours.

## Boundaries

- You own `public/src/game/`, `public/styles/board.css`, `public/styles/hud.css`.
- You consume: the store (ayoub), `chatPanel()` (ayoub), the socket (yacobe), the canonical framework (you maintain `public/src/framework/` and its verification tests; starter patches are already applied).
- Develop with `?fake=1`: yacobe's fake socket plays a whole match with the real message shapes.
- The framework only does `h / render / State / listen`. **No canvas, no WebGL, no other library, no `innerHTML`, no `<svg>`.**

## Files to create

```
public/src/game/index.js        initGame({ socket, store }): registers handlers for start/tiles/snapshot/gameover
public/src/game/gameView.js     snapshot buffer + interpolation (plain mutable module, NOT in the store)
public/src/game/loop.js         rAF loop: getFrame -> build vnode tree -> render(#app)
public/src/game/input.js        keyboard -> direction/bomb messages
public/src/game/boardView.js    tile grid vnode (cached) + players layer vnode
public/src/game/hud.js          players / lives / my stats vnode (cached)
public/styles/board.css         board, cells, sprites, animations
public/styles/hud.css           HUD
```

## Features in detail

### 1. `index.js` — wiring (contract in `ARCHITECTURE.md` §7.5)
- `socket.on("start", d)`: `gameView.reset(d)`; stop any existing loop, clear held keys; `store.setState({ phase: "playing", screen: "game", me: { ...me, slot: d.you }, players: d.players, result: null })`; `loop.start()`.
- `socket.on("tiles", d)`: `gameView.setTiles(d.tiles)`.
- `socket.on("snapshot", d)`: `gameView.pushSnapshot(d)`.
- `socket.on("gameover", d)`: `loop.stop()`; `store.setState({ screen: "over", result: d })` (ayoub's `over` screen takes over `#app`).
- Subscribe to socket status once: on `closed` during a match, stop/cancel the loop, clear held input, set a connection error, and switch to `screen: "nickname"`. `initGame` returns cleanup for its subscriptions/listeners.
- Do not subscribe to the store inside the frame function (subscribe once, or just read `store.getState()` each frame).

### 2. `gameView.js` — fast data path
- Keeps: `cols, rows, tiles, tilesVersion` (+1 on `reset`/`setTiles`), `you`, and a bounded history of **whole snapshots covering `SNAPSHOT_HISTORY_MS` (500 ms)** with `tick` and local receive time (`performance.now()`). Do not keep just two snapshots: 66 ms delay exceeds their 33 ms spacing.
- `getFrame(nowMs)` returns `{ tiles, tilesVersion, players }` where positions are interpolated: use simulation timestamps `tick * TICK_MS`, mapped to the local performance clock, and target **`INTERP_DELAY_MS` (66 ms)** behind estimated simulation time; find the two retained snapshots surrounding the target and lerp `x`,`y`. Start the clock mapping from a received tick/local time pair; receive-time gaps must not be used as simulated step durations. Ignore duplicate/older ticks. All other fields (`dir, moving, alive, lives, invulnerable, maxBombs, range, speedLevel`) come from the newest snapshot. Before the first snapshot, show starting corner positions; with one snapshot, show it directly. Clamp a target outside buffered history to the nearest available snapshot; never extrapolate unbounded movement. If the distance between two snapshots is > 1.5 tiles, or no snapshot arrived for > `SNAPSHOT_STALE_MS` (250 ms), snap to the newest (no sliding across the map). If the tab was hidden, clear the buffer on `visibilitychange` → visible.
- Add focused interpolation tests for a regular 30 Hz stream at 66 ms delay, irregular arrival times, catch-up snapshots, startup, stale data, visibility reset, and a second match. Test real-server control latency during M3 before considering prediction.
- Reuse frame data objects between frames (no per-frame allocation storm). Positions rounded to 3 decimals when turned into styles.

### 3. `boardView.js` — the board (the key to 60 fps)
**Tile grid:** one `div.tiles` containing **exactly `COLS*ROWS` cells**, always in the same order. Each cell is one `div` whose class depends only on the tile code: `cell t-floor | t-wall | t-block | t-bomb | t-flame | t-pu-bomb | t-pu-flame | t-pu-speed`. Draw bombs/flames/power-ups with `::before/::after` pseudo-elements (no extra child nodes → 195 nodes only).
- **Cache** the grid vnode: rebuild it only when `frame.tilesVersion` changes; otherwise return the *same object* (the framework patch skips identical vnodes). Never mutate a vnode after rendering.
- Positional diffing is perfectly fine here because the structure never changes — only classes do.

**Players layer:** `div.players` with **exactly 4 children in slot order** (never added/removed). A slot without a player gets the `hidden` attribute; a dead player gets class `dead` (sprite faded/hidden), a hit player `invulnerable` (blink via CSS `opacity` animation), plus `p0..p3` for the colour and `moving` / `dir-*` for a simple walk effect. Position via the framework's style object:
```js
style: { transform: `translate3d(calc(var(--tile) * ${(x - 0.5).toFixed(3)}), calc(var(--tile) * ${(y - 0.5).toFixed(3)}), 0)` }
```
Unchanged properties cost nothing (the framework diffs the object).

### 4. `board.css`
- `--tile` is the cell size; **the whole board must be visible without scrolling at 1366×768** and scale down/up with CSS only, e.g. `--tile: min(calc((100vw - 560px) / 15), calc((100vh - 24px) / 13))` (tune it; never measure in JS).
- `.tiles { display: grid; grid-template-columns: repeat(15, var(--tile)); }` `.cell { width: var(--tile); height: var(--tile); }`
- `.board { position: relative; contain: layout paint; }` `.players { position: absolute; inset: 0; pointer-events: none; }`
- `.player { position: absolute; top: 0; left: 0; width: var(--tile); height: var(--tile); will-change: transform; }` — **`will-change` on the player sprites only, NEVER on `.cell`.**
- Flat colours or simple gradients. No `box-shadow`, `filter`, `blur`, `backdrop-filter` on board/cells. Only `transform`/`opacity` may animate (bomb pulse = `transform: scale`, invulnerability blink = `opacity`). No `transition` on `left/top/width/height/transform` of anything that moves.
- Colours from `--p0..--p3`. Sprites = CSS shapes (or `<img>`), your choice.

### 5. `hud.js`
Pure function `hud(players, frame, me)` → vnode: each player's nickname (in their colour), lives (`♥`×n or a number), eliminated state; for **me**: bombs (`maxBombs`), flame `range`, speed level; a banner "You are out — spectating" when `me` is dead. **Cache by a string key** built from the displayed values (`slot:lives:alive|…|maxBombs|range|speedLevel`); rebuild the vnode only when the key changes.

### 6. `input.js`
- Register with the framework helper: `import { listen } from "../framework/index.js"`; `listen(window, "keydown", onKeyDown)`, `keyup`, `blur`, and `document` `visibilitychange`. Handlers are module-level functions.
- Keys by **physical code**: `ArrowUp/Down/Left/Right` and `KeyW/KeyA/KeyS/KeyD` (AZERTY users get ZQSD for free); bomb = `Space`; `Enter` focuses `#chat-input`.
- Ignore movement/bomb **keydown** events whose target is an input/textarea/contenteditable. Handle key releases for already-held keys even if the release targets chat. Observe `focusin` through `listen(document, "focusin", ...)`; whenever an editable element gains focus, clear held keys and send `input { dir: null }`. Enter must send stop before focusing chat. Chat typing must never move the player. `preventDefault()` on arrows/space when the game is active (stops page scrolling).
- Keep a **stack of held direction keys** (ignore `e.repeat`); the effective direction = most recently pressed key still held. Send `input {dir}` **only when the effective direction changes**; on key release fall back to the previous held key or `null`.
- On `window` blur or tab hidden: clear the stack and send `input {dir: null}`.
- Only send while `screen === "game"` and the socket is open. Don't send input if I'm dead.
- Bomb: send `bomb` on `keydown` (ignore repeat).

### 7. `loop.js`
```
start(): if (running) return; running = true; rafId = requestAnimationFrame(frame)
frame(now): if (!running) return;
  const f = gameView.getFrame(now)
  render(gameScreen(f), document.getElementById("app"))
  if (running) rafId = requestAnimationFrame(frame)
stop(): running = false; cancelAnimationFrame(rafId); rafId = null
```
`gameScreen(f)` = `h("div", { class: "game" }, hudVNode, h("div", { class: "board" }, tilesVNode, playersVNode), chatVNode)`.
- `chatVNode = chatPanel(store.getState().chat)` **cached by the `chat` array reference** (rebuild only when it changes). ayoub's chat input uses stable module-level handlers so the cached vnode stays valid.
- Store the pending rAF id, make start/stop idempotent, and clear held input on every game exit. Keep the screen check before rendering so a queued callback cannot overwrite another screen.
- Do not render outside the loop while the game screen is active. Do not call `render` twice per frame.
- Optimisation only if the profiler says so: skip `render()` on frames where nothing changed.

## Phases and definition of done

| Phase | Deliver | Done when (with `?fake=1`) |
|---|---|---|
| 1 | `board.css` + `boardView` static grid from a hard-coded array | the whole map is visible at 1366×768, classes correct for all 8 tile codes |
| 2 | `gameView` + interpolation + players layer + `loop` | 4 players glide smoothly, no jitter at 60 fps |
| 3 | `input.js` + `hud.js` + `index.js` wiring | keys send the right messages (check Network/WS frames), bomb key works; hold W → focus chat → release W stops movement; clicking chat also stops movement |
| 4 | **performance pass** with the real server | DevTools checklist below passes |
| 5 | polish: sprites, bomb pulse, blink, dead/spectator state | |

## Performance checklist (you run it, ayoub's `AUDIT_CHECKLIST.md` has the procedure)

- Performance tab, record 10 s of play: steady ~60 fps, inspect dropped frames and frame-time spikes against the display refresh rate (about 16.7 ms at 60 Hz), scripting per frame ≲ 4 ms.
- Rendering → **Paint flashing**: changed cells may flash on tile changes; composited player translation should ideally cause no repaint. Investigate flashing on moving sprites, the whole board, or unchanged HUD/chat.
- Rendering → **Layer borders** / Layers panel: few layers (root, board, ≤ 4 players, a few bombs). If you see 195 layers, something has `will-change`/animation on cells.
- Memory: no growth while playing (no leaking listeners/arrays).

## Audit questions you are responsible for

- Can players see the whole map at once? Can I move and place bombs? Can I confirm no canvas/WebGL?
- Game runs without frame drops / at or around 60 fps / paint as little as possible / layers as few as possible and promoted properly.

## Pitfalls

- Inline arrow handlers in a per-frame vnode = listeners re-registered every frame. Use constants.
- Building a new tiles vnode every frame (instead of reusing the cached object) will cost frames and GC.
- Reading layout (`getBoundingClientRect`, `offsetWidth`) in the frame loop forces reflow.
- A CSS `transition` on `transform` makes players "swim" when we already interpolate in JS.
- Resetting between matches: `gameView.reset` must clear old snapshots, and the loop must be stopped on `gameover`.
