# Task 04 — Game Screen, Rendering, HUD, Outcomes & Integration

**Owner:** Developer 4
**Technology:** JavaScript, HTML, CSS, custom DOM framework, Socket.IO client

## Mission
Own everything the player sees during a match: the game screen, efficient DOM
rendering of the board and entities, the HUD, the game-over experience, and the
end-to-end integration and multiplayer testing of the finished game.

## Step 1 — Game screen and board rendering
- Add the game route and mount a game screen from `game:start`.
- Render the fixed grid with DOM elements only, using the map snapshot from
  Task 02 (walls, blocks and empty tiles).
- Convert grid coordinates to screen positions exactly once per update.
- Update only cells whose tile changed; never rebuild the whole board.
- Keep cell elements reusable across matches.

## Step 2 — Player views and animation
- Render every player with a clear identity and colour.
- Update player positions from authoritative state.
- Animate movement between tiles without blocking input.
- Show eliminated players distinctly instead of removing them abruptly.

## Step 3 — Entity views
- Render bombs with a visible fuse state.
- Render explosion flames per direction and tile.
- Render power-ups by type (bomb, flame, speed).
- Drive all entity views from `game:*` events only; no client-side rule guessing.

## Step 4 — HUD and match information
- Show lives, bomb capacity, flame range and speed for the local player.
- Show the other players' lives/status compactly.
- Display match status and the current player count.
- Update through `game:playerUpdated`/`game:state` without flicker.

## Step 5 — Outcomes and disconnects
- Show the winner or draw from `game:over`.
- Show a forfeit result when a player leaves mid-match.
- Handle being eliminated while still watching the match.
- Return to the lobby cleanly (or offer a rematch path) and reset view state.
- Keep the refreshed-tab case working with the existing session resume.

## Step 6 — Socket integration and multiplayer testing
- Register game listeners once, next to the existing lobby listeners in
  `main.js`; remove/unsubscribe when views are destroyed.
- Send `player:move` and `bomb:place` requests and surface rejections.
- Handle connection loss/reconnect during a match without duplicate listeners.
- Test 2, 3 and 4 browser sessions: countdown, duplicate nicknames, invalid
  inputs, chat, disconnects, power-ups and match end.
- Record FPS observations from Task 02's monitor and write the multiplayer test
  report in `docs/`.

## Suggested files
```
frontend/src/views/
├── GamePage.js
└── GameOverPage.js
frontend/src/components/
├── GameBoard.js
├── PlayerView.js
├── BombView.js
├── ExplosionView.js
├── PowerUpView.js
└── PlayerHUD.js
frontend/src/styles/
docs/MULTIPLAYER_TEST_REPORT.md
```

## Deliverables
- Game screen and game-over screen.
- DOM board rendering with minimal updates.
- Player, bomb, explosion and power-up views.
- Player HUD with lives and upgrades.
- Game-over, draw and forfeit handling.
- Socket integration with listener cleanup.
- Multiplayer test report with FPS observations.

## Acceptance checklist
- [ ] All screens use the custom DOM framework; no Canvas or WebGL.
- [ ] The board is rendered with DOM elements and patched, not rebuilt.
- [ ] Players, bombs, explosions and power-ups are displayed correctly.
- [ ] The UI mirrors server-confirmed state only.
- [ ] Player movement is animated as tiles are crossed.
- [ ] HUD values match the authoritative game state.
- [ ] Winner, draw and forfeit are shown correctly.
- [ ] No duplicate Socket.IO listeners after navigation.
- [ ] Disconnects and rejected actions are handled in the UI.
- [ ] The multiplayer test report covers 2–4 player sessions.

## Coordination
- Consume the map/collision contract from Task 02 and the `game:*` payloads from
  Task 03; agree on shapes before building views.
- Reuse the completed lobby, chat, toast and session-resume work rather than
  duplicating listeners or state.
- Report integration bugs back to the owning developer instead of patching game
  rules in the view layer.
