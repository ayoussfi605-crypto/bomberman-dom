# Audit checklist — implementation pending

This starter does not pass the game audit yet. Ayoub maintains this record;
each owner records results and evidence as the relevant milestone lands.

| Check | How to verify / expected result | Owner | Status |
|---|---|---|---|
| Framework prerequisite | `npm test`; browser `/dev/framework-check.html` all PASS | Hichame | See framework patch record; game performance still pending |
| Allowed rendering | Inspect application imports and DOM; only our framework, no canvas/WebGL/other client framework | Hichame + Ayoub | Pending |
| Nickname and waiting page | New browser asks for nickname, then shows counter and chat | Ayoub | Pending |
| Counter and real chat | Join in second browser/private window; counter increments; messages work both ways via WS | Yacobe + Ayoub | Pending |
| Two-player timers | From second join, wait 20 s; then 10 s countdown; game starts | Yacobe | Pending |
| Four-player timer | Fourth join immediately starts 10 s countdown | Yacobe | Pending |
| Lobby cancellation | Drop below two during wait/countdown; cancel; second join starts fresh wait | Yacobe | Pending |
| Map and controls | All map visible; corner spawns; movement and bomb placement work | Hichame + Mohamed | Pending |
| First-bomb escape | All four starting corners have a traversable safe route beyond default blast before fuse expires | Mohamed | Pending |
| Lives and elimination | Own bomb costs one of three lives; another player can take damage; zero lives disables play | Mohamed | Pending |
| Blocks and power-ups | Destroy blocks; power-ups appear; all three types exist and affect stats | Mohamed | Pending |
| Chain and dirty flag | Chain reactions resolve once per bomb; placement between ticks appears on every client | Mohamed + Yacobe | Pending |
| Input/chat focus | Hold movement, focus chat by Enter/click, release key; movement stops and typing does not move | Hichame | Pending |
| Interpolation | 30 Hz snapshots produce smooth motion; test jitter/catch-up/stale data and measure actual control latency | Hichame | Pending |
| Finish and replay | Winner/draw agrees across clients; second full match has no stale slots, timers or duplicate loops | Whole team | Pending |
| Disconnects | Close/refresh a player; lobby updates or player is eliminated; local closed socket exits stale gameplay | Yacobe + Hichame | Pending |
| Transport robustness | Malformed/rate-limited messages do not affect other users; oversized frames close with 1009; heartbeat removes silent peers | Yacobe | Pending |
| Frame rate | Record active gameplay in foreground, including bombs/chat; inspect dropped frames and ~60 fps on documented hardware/browser | Hichame + Ayoub | Pending |
| Paint | Paint flashing: changed cells may paint; composited movement should ideally avoid repaint; unchanged board/HUD/chat do not repaint each frame | Hichame | Pending |
| Layers | Inspect Layers panel; a small number of layers, no promotion of all 195 cells | Hichame | Pending |
| Memory | Repeated matches/disconnects do not accumulate listeners, loops, snapshot history or fake timers | Whole team | Pending |

Record hardware/browser/viewport, player count, recording duration, result, and
screenshots/trace links for performance evidence. Background tabs throttle rAF;
measure foreground tabs and use separate devices where available for four-player
checks. Debug FPS numbers supplement DevTools recordings; they do not replace them.
Bonus features are excluded from the initial scope.
