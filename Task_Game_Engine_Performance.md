# README 3: Game Engine, DOM Rendering (No Canvas) & Performance (60 FPS)

## Overview
This phase builds the core game engine using **pure DOM manipulation** (strictly no Canvas, WebGL, or heavy external frameworks). It implements the fixed grid map, player movement mechanics, collision detection, bomb placement, explosion physics, and strict 60 FPS performance optimization using `requestAnimationFrame`.

---

## Step-by-Step Tasks

### Phase 3.1: Map Generation & Grid DOM Rendering
1. Design a fixed grid map (e.g., 13x13 or 15x13) containing:
   * **Walls:** Indestructible perimeter and interior pillars placed at fixed coordinates.
   * **Blocks:** Destructible barriers generated randomly across open grid cells, leaving guaranteed safe zones at the 4 corner starting positions.
2. Render the map efficiently using DOM elements managed by your custom mini-framework. Minimize reflows by updating CSS transforms or element classes rather than recreating DOM trees every frame.

### Phase 3.2: Player Movement & Corner Spawning
1. Position the 2–4 players in the 4 distinct corners of the map.
2. Implement smooth keyboard event handling (`keydown`, `keyup`) for movement (Arrow keys or WASD).
3. Implement grid-based collision detection preventing players from walking through walls and destructible blocks.

### Phase 3.3: Bomb Placement & Explosion Engine
1. Implement bomb placement mechanics linked to player inventory limits.
2. Create explosion expansion logic radiating outwards in 4 directions (Up, Down, Left, Right) up to the flame range limit.
3. Handle raycasting collision: explosions stop when hitting indestructible walls or destroying blocks.
4. Implement player life deduction (3 lives total) when caught in an explosion.

### Phase 3.4: Performance & 60 FPS Optimization
1. Implement the game loop utilizing `requestAnimationFrame`.
2. Build an FPS counter and performance measurement utility to ensure the game consistently runs at 60 FPS without frame drops.
3. Optimize DOM updates by batching style changes and avoiding expensive layout recalculations during active gameplay.

---

## Folder Structures

### Frontend Folder Structure (`frontend/`)
```text
frontend/
└── src/
    ├── engine/
    │   ├── gameLoop.js     # requestAnimationFrame main loop & FPS monitor
    │   ├── renderer.js     # DOM-based grid & sprite/element rendering
    │   ├── physics.js      # Collision detection & grid boundaries
    │   └── input.js        # Keyboard listeners & state tracker
    ├── entities/
    │   ├── Player.js       # Player movement, lives, state
    │   ├── Bomb.js         # Bomb timer & explosion calculation
    │   └── Block.js        # Destructible vs indestructible blocks
    └── views/
        └── GameArena.js    # Main game board container
```

### Backend Folder Structure (`backend/`)
```text
backend/
└── internal/
    ├── game/
    │   ├── engine.go       # Server-side authoritative state validation
    │   ├── map.go          # Map generation & random block seed
    │   ├── collision.go    # Server collision validation
    │   └── state.go        # Player positions, bombs, and health sync
    └── ws/
        └── gamestream.go   # Game state synchronization handlers
```
