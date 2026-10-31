# Task 02 — Game Engine, Map & Performance

**Owner:** Developer 2  
**Technology:** JavaScript, custom DOM framework

## Mission
Implement the fixed grid map, efficient rendering, movement, collision
detection, and main game loop.

## Step 1 — Integrate the custom framework
- Reuse the framework from the mini-framework project.
- Do not introduce React, Vue, Angular, or another UI framework.
- Keep game logic independent of DOM implementation details.

## Step 2 — Create the map
- Use a fixed grid visible to every player.
- Define map dimensions and tile size.
- Use a deterministic layout for indestructible walls.
- Generate destructible blocks randomly.
- Keep all starting areas clear and safe.
- Leave enough space for players to escape bombs at spawn points.
- Coordinate the map representation with the backend game module.

## Step 3 — Movement and collisions
- Represent player positions using grid coordinates.
- Convert grid coordinates to visual positions.
- Prevent movement through walls and intact blocks.
- Coordinate movement requests with the authoritative server.
- Keep optional client prediction/interpolation separate.

## Step 4 — Rendering loop
- Use `requestAnimationFrame` for visual updates.
- Avoid recreating the whole map every frame.
- Update only DOM elements that changed.
- Avoid unnecessary layout reads and repeated style recalculations.
- Stop or pause animation work when the game is inactive.
- Keep network events separate from frame rendering.

## Step 5 — Measure performance
- Measure frame intervals and calculate FPS.
- Track long frames and expensive rendering.
- Use browser developer tools to profile CPU, layout, and paint.
- Test with four players, many blocks, and repeated explosions.
- Target 60 FPS on agreed reference hardware and document test results.

## Suggested files
- `frontend/src/engine/GameLoop.js`
- `frontend/src/engine/Map.js`
- `frontend/src/engine/Collision.js`
- `frontend/src/engine/Movement.js`
- `frontend/src/engine/PerformanceMonitor.js`
- `frontend/src/entities/Player.js`
- `frontend/src/entities/Block.js`
- `frontend/src/entities/Wall.js`

## Deliverables
- Fixed grid map and safe starting corners.
- Collision and movement system.
- Efficient DOM rendering.
- FPS/frame-time monitoring and performance notes.

## Acceptance checklist
- [ ] No Canvas or WebGL.
- [ ] Custom DOM framework is used.
- [ ] All players see the same logical map.
- [ ] Walls and blocks have different collision behavior.
- [ ] Starting areas are safe.
- [ ] Rendering uses `requestAnimationFrame`.
- [ ] Performance is measured in a four-player test.
