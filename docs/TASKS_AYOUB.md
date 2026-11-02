# TASKS — ayoub: app shell, store, screens, chat UI, styling, performance tooling

Read first: `ARCHITECTURE.md` (§6, §7.3, §7.5, §7.6), `PROTOCOL.md`, `../shared/constants.js` (repository path: `shared/constants.js`).

## Mission

Everything around the match: the page, the **nickname** page, the **waiting page with player counter and chat**, the game-over page, the chat panel used in lobby *and* in-game, the app store, the wiring, the global styling, and the **performance tooling** (FPS meter + audit checklist) that proves the 60 fps claims.

## Boundaries

- You own `public/index.html`, `public/styles/base.css|screens.css|chat.css`, `public/src/main.js`, `public/src/state/`, `public/src/ui/`, `public/src/perf/`, `docs/AUDIT_CHECKLIST.md`, root `README.md`.
- You consume the framework (`h, render, State, handleKey`) and the socket (yacobe). hichame consumes your `store`, `chatPanel`, `fpsMeter`, `perfOverlay`. Publish these exports in your first PR, using clearly marked minimal implementations until their features land.
- Framework only: **no `innerHTML`, no other library, no canvas, no `<svg>`**. The only direct DOM calls allowed are `scrollTop` for the chat log and `focus()/blur()`.
- Develop with `?fake=1`: yacobe's fake socket gives you the whole lobby flow with real message shapes.

## Files to create

```
public/index.html
public/styles/base.css            tokens, reset, typography, buttons, inputs
public/styles/screens.css         nickname / lobby / over screens
public/styles/chat.css            chat panel (used in lobby and in game)
public/src/main.js                wiring only
public/src/state/store.js         the app store (State)
public/src/ui/render.js           subscribes to the store, renders the current screen into #app
public/src/ui/index.js            initUI({ socket, store }) -> cleanup; exports UI setup
public/src/ui/netHandlers.js      socket handlers for hello/joined/error/lobby/chat
public/src/ui/screens/nickname.js
public/src/ui/screens/lobby.js
public/src/ui/screens/over.js
public/src/ui/components/chatPanel.js
public/src/ui/chatScroll.js       keeps #chat-log scrolled to the bottom
public/src/perf/fpsMeter.js
public/src/perf/perfOverlay.js
docs/AUDIT_CHECKLIST.md
README.md                         how to install/run/test (npm i, npm start, 4 tabs)
```

## Features in detail

### 1. `index.html`
`<div id="app"></div>`, the three/five CSS files, `<script type="module" src="/src/main.js">`, `<meta name="viewport">`, a title. Nothing else is managed outside `#app`.

### 2. `store.js` — shape is the integration contract (`ARCHITECTURE.md` §7.3)
`export const store = new State(initialState, { batch: "microtask" })` with the exact shape: `connection, phase, screen, me, error, lobby, chat, players, result`. Plus helpers: `pushChat(message)` (immutable append, cap 100), `setError(code, message)`, `clearError()`. Always update immutably (new arrays/objects).

### 3. `main.js`
```
const socket = new URLSearchParams(location.search).has("fake") ? createFakeSocket() : createSocket();
socket.onStatus((s) => store.setState({ connection: s }));
initUI({ socket, store });     // your module: handlers + renderer + chat scroll
initGame({ socket, store });   // hichame's module
socket.connect();
```
Nothing else. (Wiring only, so it never conflicts.)

### 4. `ui/netHandlers.js`
- `hello` → `store.setState({ phase, lobby: { ...lobby, count, max } })`; if `screen === "over"` keep it.
- `joined` → `{ me: { nickname, slot: null }, screen: "lobby", error: null, result: null, players: [] }`. Reset stale lobby/timer data before the following `lobby` message.
- `error` → `setError(code, message)`; for a rejected initial/replay join (`NICK_INVALID/NICK_TAKEN/ROOM_FULL/GAME_IN_PROGRESS`) show the nickname screen. Suppress duplicate join submissions until success/error. `ALREADY_JOINED` must preserve the current lobby/game screen: it does not cancel membership.
- `lobby` → `{ lobby: data }`.
- `chat` → `pushChat(data)`.

### 5. `ui/render.js`
Subscribe **once**: `store.subscribe(renderApp)` and call `renderApp()` once at startup. `renderApp`: **if `state.screen === "game"` return** (hichame's rAF loop owns `#app` then); otherwise `render(screenVNode, document.getElementById("app"))` with `nickname | lobby | over`. Handlers in vnodes are **module-level constants** (not inline arrows).

### 6. Screens
- **Nickname** (`screens/nickname.js`): title, a form with a text input (`maxlength=12`, autofocus) and a "Join" button (`onSubmit` + `preventDefault`), then `send("join", { nickname })`. Show the `error.message` under the input (NICK_TAKEN, NICK_INVALID, ROOM_FULL, GAME_IN_PROGRESS). Disable the button while `connection !== "open"`; show "Connecting…" / "Disconnected — refresh the page". If `phase === "playing"` show "A game is in progress, you can join when it ends". Pre-fill with the last nickname after a game.
- **Lobby / waiting page** (`screens/lobby.js`) — audit-critical: a big **player counter** `count / max` (e.g. "Players 2 / 4"); the list of nicknames (coloured dots by join order); the timer text from `lobby.timer`: `null` + count < 2 → "Waiting for players…", `wait` → "Waiting for more players… Countdown begins in {secondsLeft}s", `start` → "Get ready! Starting in {secondsLeft}s"; and the **chat panel**.
- **Game over** (`screens/over.js`): "X wins!" or "Draw", table of players with lives, button "Back to lobby" → `send("join", { nickname: me.nickname })` (the server un-joined everybody). `joined` brings the lobby back; an `error` brings the nickname page back with the message.

### 7. `components/chatPanel.js` — used in lobby AND in game
`chatPanel(messages)` → vnode: `div.chat > ul#chat-log (li per message; system messages styled differently; use text children, never HTML) + form with input#chat-input`.
- The input is **uncontrolled** (no `value` prop): read it from `event.target`, clear it in the handler.
- Handlers are module-level constants: `onKeyDown` using `handleKey(e, onEnter, onEscape)`: Enter → `preventDefault()`, trim, ignore empty, `send("chat", { text })`, clear; Escape → `e.target.blur()`. `maxlength=200`. Stop the keydown from bubbling (`e.stopPropagation()`) so game keys never fire while typing.
- Game input independently observes editable focus through a framework global listener and sends stop; do not import the game module into the chat component.
- `chatPanel` must be a **pure function** of `messages` (hichame caches its vnode by the array reference).
- `ui/chatScroll.js`: subscribe to the store; when `chat` changes, `requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })` on `#chat-log`.
- `initUI` gives the panel access to the socket (module-level reference set in `initUI`).

### 8. Styling (`base.css`, `screens.css`, `chat.css`)
- Tokens: `--bg --fg --panel --accent` and the player palette `--p0:#e63946; --p1:#2a9df4; --p2:#2ecc71; --p3:#f1c40f;` (hichame depends on them — publish `base.css` early).
- A readable dark theme, responsive (works from 1024 px wide). Chat panel fixed width (~260 px) with scrolling log so it fits next to the board in game.
- **No** heavy effects on anything that is on screen during the game (no blur, big shadows, backdrop-filter). Keep the lobby pretty, keep the game screen cheap.

### 9. Performance tooling (`perf/`)
- `fpsMeter.js`: `fpsMeter.frame(now)` records frame deltas (ring buffer ~120); `fpsMeter.getStats()` → `{ fps, frameMsAvg, frameMsMax, over20ms, over33ms }` over the last second; `fpsMeter.reset()`. No allocations per frame.
- `perfOverlay.js`: `perfOverlay()` → vnode or `null`. Only active when the URL has `?debug`. It shows fps / avg & max frame ms / long-frame counts and **refreshes its text at most 4×/s** (return the cached vnode otherwise), so it doesn't cost frames itself.
- `docs/AUDIT_CHECKLIST.md`: the procedure and evidence for every audit question (below).

## `docs/AUDIT_CHECKLIST.md` (starter included; you maintain it, the whole team uses it)

For each item: how to test, expected result, who owns a fix. Cover at least:
1. Source inspection: only the mini-framework (no canvas/WebGL/lib) — `rg` over runtime sources for `canvas`, `getContext`, `webgl`, `innerHTML`, `<svg`, imports; inspect matches rather than treating comments/reference files as violations.
2. Nickname asked → waiting page with counter → chat visible.
3. Second user in a private window: counter increments; chat both ways, real time.
4. 2 users wait 20 s → 10 s countdown → game starts. 4 users → countdown right at the 4th.
5. Move, place bombs, see the whole map.
6. Own bomb → −1 life; lose 3 → out; bomb next to another player → they lose a life.
7. Block disappears; destroy all blocks → power-ups appear, ≥ 3 types.
8. DevTools **Performance**: record 10 s; no frame drops; ~60 fps (screenshot the frames chart).
9. **Paint flashing** ON: changed tiles may flash; composited player movement should ideally cause no repaint. Investigate repeated paint on unchanged board/HUD/chat.
10. **Layer borders** ON + Layers panel: few layers; only the player sprites (and a few bombs) are promoted.
11. Tips: close other tabs, use the foreground tab for recording (background tabs pause rAF), disable extensions, 4 tabs on one laptop lowers fps — test with 2 tabs visible.

## Phases and definition of done

| Phase | Deliver | Done when |
|---|---|---|
| 1 | Extend starter `index.html`, `base.css`, `main.js`; publish `store.js`, `ui/index.js`, `render.js`, `chatPanel`, `fpsMeter`/`perfOverlay` exports (minimal versions allowed) | page renders the nickname screen with `?fake=1` |
| 2 | nickname + lobby screens + `netHandlers` + `chatPanel` + `chatScroll` | full lobby flow works with the fake socket, incl. error messages and timers |
| 3 | `over.js`, styling pass | game-over → back to lobby works |
| 4 | `fpsMeter` + `perfOverlay` (hichame needs `fpsMeter.frame` early; the first-PR exports must already exist) | `?debug` overlay shows live numbers |
| 5 | `AUDIT_CHECKLIST.md` + root `README.md`; run it against the real server with the team | every checklist item has a result |

## Audit questions you are responsible for

- Nickname asked; waiting page with player counter; access to chat from the waiting page; chat usable in-game.
- Evidence for the performance questions (the checklist + screenshots), and the "only the mini-framework" source inspection.

## Pitfalls

- `render.js` must **not** render while `screen === "game"`, or it will fight hichame's loop.
- A controlled chat input (`value` bound to state) fights the caret; keep it uncontrolled.
- Never mutate `store.chat` in place; the framework's no-op detection and the cached chat vnode rely on a new array reference.
- `joined` can come after a game (play again): reset `error`, `result`, and old `players`.
