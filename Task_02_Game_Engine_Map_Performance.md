# Task 02 — Shared Map, Movement, Game Loop & Performance

**Owner:** Developer 2
**Technology:** JavaScript, custom DOM framework, requestAnimationFrame

## Mission
Own the foundation every other gameplay task builds on: one map shared by
server and client, grid/collision rules, client input and movement, the game
loop, and the performance instrumentation that proves the game holds its frame
budget.

## Step 1 — Shared map
- Agree one representation with Developer 3: dimensions, tile codes, wall lattice.
- Use fixed dimensions with a deterministic indestructible wall layout.
- Generate destructible blocks randomly but keep spawn areas and their escape
  routes clear and safe.
- Provide spawn slots for 2–4 players, one per corner area.
- Put the generator/config in a location both backend and frontend import, so
  both sides always build the identical map.
- Freeze the format in `docs/` (tile codes and coordinates) before other tasks
  consume it.

## Step 2 — Grid and collision API
- Provide `inBounds`, `isWall`, `isBlock`, `isFree`, and bomb-occupancy checks.
- Give movement collision one implementation shared with the authoritative
  rules used in Task 03.
- Provide a serialisable map snapshot for `game:start` / `game:state`.
- Unit-test bounds, wall blocking, block blocking and safe spawn tiles.

## Step 3 — Input and movement
- Track keyboard state for arrows and WASD with keydown/keyup listeners.
- Remove keyboard listeners when the game view is destroyed.
- Move on the grid at a cadence derived from the player speed stat.
- Reject diagonal shortcuts and movement into walls, blocks or bombs.
- Keep optional client prediction clearly separate from authoritative state.

## Step 4 — Game loop
- Implement the main loop with requestAnimationFrame and a fixed timestep.
- Separate simulation updates from rendering; rendering is a callback the UI
  layer (Task 04) supplies.
- Clamp large deltas and pause the loop when no match is active.
- Stop all loop work when leaving the game screen.

## Step 5 — Performance monitor
- Sample frame intervals and compute FPS.
- Track long frames and the cost of map/player updates.
- Expose the results (console and/or a lightweight DOM overlay).
- Keep monitoring itself cheap enough to stay enabled during a match.

## Step 6 — Profiling and handoff
- Profile 4 players, many blocks and repeated explosions (Task 03 stubs are fine).
- Record before/after FPS numbers and the optimisations that helped in `docs/`.
- Provide test vectors proving the server and client generate the same map.
- Document the loop start/stop API and map/collision contract for the other tasks.

## Suggested files
```
shared/map.js
frontend/src/engine/
├── Map.js
├── Collision.js
├── Movement.js
├── GameLoop.js
└── PerformanceMonitor.js
frontend/src/entities/Player.js
backend/test/map.test.js
```

## Deliverables
- Shared map generator and serialised map snapshot.
- Collision and occupancy utilities.
- Keyboard input and grid movement.
- Frame-driven game loop with start/pause/stop.
- FPS/long-frame monitor and a short performance report.
- Map and collision unit tests.

## Acceptance checklist
- [ ] No Canvas or WebGL; the custom DOM framework is used.
- [ ] Server and client build identical maps from the same source.
- [ ] Walls and destructible blocks behave differently for movement.
- [ ] Spawn areas are clear, safe and reachable.
- [ ] Movement follows grid rules and the speed stat.
- [ ] The loop does no work when inactive and stops on navigation.
- [ ] FPS is measured in a 4-player profile and documented.

## Coordination
- Task 03 reuses your map, tile codes and collision rules for authoritative
  movement and explosions; agree on them in step 1.
- Task 04 consumes your render callback, map snapshot and player positions.
- Announce any map-format change to all developers.
