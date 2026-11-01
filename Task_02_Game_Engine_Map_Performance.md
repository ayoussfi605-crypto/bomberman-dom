# Task 02 — Game Engine, Map & Performance
Owner: Developer 2
Technology: JavaScript, custom DOM framework

## Mission
Implement the core game engine, fixed grid map, movement rules, collision detection and performance monitoring.

## Step 1 — Integrate the custom framework
- Reuse the framework from the mini-framework project.
- Do not introduce React, Vue, Angular or another UI framework.
- Keep game logic independent of DOM implementation details.
## Step 2 — Create the map
- Define map dimensions and grid structure.
- Define a deterministic layout for indestructible walls.
- Generate destructible blocks randomly.
- Keep all starting areas clear and safe.
- Ensure players have enough space to escape bombs at spawn points.
- Coordinate the map representation with the backend game module.
## Step 3 — Movement and collisions
- Represent player positions using grid coordinates.
- Implement movement rules.
- Prevent movement through indestructible walls and intact blocks.
- Validate movement against the game map.
- Coordinate movement requests with the authoritative server.
- Keep optional client prediction/interpolation separate.
## Step 4 — Game loop
- Implement the main game loop using requestAnimationFrame.
- Separate game updates from visual rendering.
- Manage game timing.
- Avoid unnecessary calculations every frame.
- Stop or pause animation work when the game is inactive.
## Step 5 — Performance monitoring
- Measure frame intervals and calculate FPS.
- Track long frames and expensive calculations.
- Use browser developer tools to profile performance.
- Test with four players, many blocks and repeated explosions.
- Target 60 FPS and document performance results.

`Suggested files`
frontend/src/engine/
├── GameLoop.js
├── Map.js
├── Collision.js
├── Movement.js
└── PerformanceMonitor.js

`frontend/src/entities/`
 ├── Player.js
 ├── Block.js
 └── Wall.js

## Deliverables
- Fixed grid map.
- Random destructible blocks.
- Safe starting corners.
- Movement and collision logic.
- Main game loop.
- FPS monitoring and performance report.

## Acceptance checklist
- [ ] No Canvas or WebGL.
- [ ] Custom DOM framework is used.
- [ ] All players share the same logical map.
- [ ] Walls and blocks have different collision behavior.
- [ ] Starting areas are safe.
- [ ] Movement rules work correctly.
- [ ] Rendering updates are coordinated with the game loop.
- [ ] Performance is measured in a four-player test.
