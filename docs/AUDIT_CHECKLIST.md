# Audit checklist

Record browser, OS, viewport, player count, recording duration, result, and
trace/screenshot links for every manual run. Automated passes do not replace
real-browser or integrated-match evidence.

| Check | How to test / expected result | Owner | Status / evidence |
|---|---|---|---|
| Allowed rendering | Search runtime files for `canvas`, `getContext`, `webgl`, `innerHTML`, `<svg`, and non-framework imports; inspect matches. User content must render as text. | Hichame + Ayoub | Pass: `rg` scan of `public/src`, `public/styles`, and `public/index.html` found no restricted API matches (2026-11-06) |
| Nickname and waiting room | Open `/?fake=1`, join with a nickname; nickname form disappears and the lobby counter, player list, timer, and chat appear. Try `taken` to check the error path. | Ayoub | Pass: browser smoke test joined `BrowserTest`; rejected `taken` displayed the error (2026-11-06) |
| Lobby count and chat | With `/?fake=1`, watch bot joins update the count and send chat; in real mode use two browsers and exchange messages. | Yacobe + Ayoub | Pass: fake browser flow; real two-client WebSocket run verified counter sync, system join messages and bidirectional chat echo (scripted audit, 2026-11-08); two-browser visual run pending |
| Lobby timers | Fake mode follows wait → start → match; real mode: two players wait 20 s then count down 10 s; fourth player switches immediately to the 10 s countdown. | Yacobe + Ayoub | Pass: lobby unit tests (wait on 2nd join, wait→start transition, 4th join switches immediately, drop below 2 cancels) + real server emitted `wait/20` after the 2nd join (2026-11-08); full 20s+10s wall-clock run pending |
| Nickname rejection and replay | Try invalid/taken names; rejected join returns to nickname with an error. After result, Back to lobby sends the remembered nickname; server response controls the transition. | Ayoub + Yacobe | Handler unit tests; real-server replay pending |
| In-game chat and focus | During an integrated match, send chat from both lobby and game; Enter sends, Escape blurs, and typing does not move the player. | Ayoub + Hichame | Component implemented; game renderer/focus integration pending |
| Map and controls | Start a real match; inspect complete map, corner spawns, movement, and bomb placement. | Hichame + Mohamed | Pass (engine): map invariants over 50 seeds (195 cells, borders/pillars, corner spawns), wall collision, maxBombs=1 limit; client renders the full 15×13 board from `start` tiles. Browser run pending |
| First-bomb escape | Verify all four spawn corners have a traversable safe route outside the default blast before fuse expiry. | Mohamed | Pass: `SAFE_ZONE_ARM (3) > BASE_RANGE (2)`; engine test walks out of the blast (~1.3s < 2s fuse) and takes no damage |
| Lives, elimination, blocks, power-ups | Verify bomb damage, three-life elimination, block destruction, and all three power-up types and effects. | Mohamed | Pass: engine tests — own bomb costs exactly 1 life (invulnerability), 3 hits eliminate and declare the winner, block destruction reveals hidden power-ups, ≥2 hidden of each of the 3 types, pickup effects + caps; damage rule verified for non-owner players |
| Chain reactions and tile updates | Place bombs between ticks and cause a chain; each bomb resolves once and all clients receive the updated full tile array. | Mohamed + Yacobe | Partial: `tilesChanged` flag verified for between-tick bomb placement (true once, false next tick) and chain logic reviewed; two-client chain broadcast pending real match |
| Interpolation and stale data | Inspect motion at 30 Hz under jitter/catch-up; measure control latency and ensure stale/disconnected gameplay stops. | Hichame + Yacobe | Pending game integration |
| Real multiplayer / disconnects | Four people finish a match, disconnect/refresh players, then play a second match; no stale timers, slots, listeners, or loops. | Whole team | Pending integrated team run |
| DevTools Performance | Record 10 s of foreground gameplay with bombs/chat; target ~60 fps and save the frames chart and trace with hardware/browser details. | Hichame + Ayoub | Pending playable match and captured evidence |
| Paint flashing | Enable Paint flashing; changed tiles may paint, while composited movement should avoid repainting unchanged board/HUD/chat. | Hichame | Pending playable match |
| Layers | Inspect Layers panel; keep layer count low and avoid promoting all 195 board cells. | Hichame | Pending playable match |
| Browser framework check | Run `npm run test:browser` or open `/dev/framework-check.html`; all checks should pass. | Hichame | Run before release; attach output |

Background tabs throttle animation frames. Use foreground tabs, close unrelated
applications/extensions, and prefer separate devices for four-player
performance checks. Use DevTools Performance recordings to inspect frame time.
