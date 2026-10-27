# Developer 2 — Map Generation, Mini-Framework DOM Renderer & 60 FPS Performance  <AYOUB>

**Assigned to:** Developer 2  
**Domain:** Frontend Engine, DOM Graphics Rendering (Strictly No Canvas / WebGL), Mini-Framework VDOM Integration, 60 FPS `requestAnimationFrame` Pipeline, Map Generation & Performance HUD

---

## 🎯 Mission

Build the core DOM rendering pipeline using the team's custom **mini-framework** (no `<canvas>`, no WebGL, no third-party UI libraries). Implement the fixed grid map generator with fixed walls, randomly placed destructible blocks, and guaranteed 4-corner safe zones. Guarantee a rock-solid **60 FPS at all times with zero frame drops** using `requestAnimationFrame`, and build an in-game FPS counter & performance profiling HUD to measure and prove frame rate stability.

---

## ⚖️ Why This Workload is Fair & Balanced

Developer 2 solves the **hardest technical performance challenge of the subject**:
1. **Pure DOM Rendering at 60 FPS:** Rendering a fast-paced multiplayer arcade game without `<canvas>` or WebGL requires deep understanding of the browser layout pipeline, composite layers, and minimizing reflows/repaints.
2. **Mini-Framework Mastery:** Bridging the team's custom virtual DOM with high-frequency updates using CSS transforms (`translate3d`) and efficient DOM patching.
3. **Procedural Map Generator:** Designing the grid matrix with indestructible perimeter and pillar walls, random destructible blocks, and guaranteed safe zones in the 4 corners so players don't blow themselves up immediately.
4. **Mandatory Performance Instrumentation:** Building the FPS counter, frame time measurement utilities, and verifying 60 FPS compliance on Chrome and Firefox DevTools as required by the subject.

---

## 📐 Public Contract & Coordinate System

### Grid System & Dimensions
The game board is a fixed discrete 2D matrix (standard arcade dimensions: **15 columns × 13 rows** or **13 columns × 11 rows**).

- **Tile Size:** 48px × 48px (or 40px × 40px depending on screen scaling).
- **Tile Types Enum (`frontend/src/engine/map.js`):**
  ```js
  export const TileType = {
    EMPTY: 0,
    WALL: 1,        // Indestructible pillar/border
    BLOCK: 2,       // Destructible block
    BOMB: 3,        // Active bomb
    EXPLOSION: 4,   // Active blast flame
    POWERUP: 5      // Dropped power-up item
  };
  ```

### Map Matrix API provided to Dev 3 & Dev 4:
```js
export class GameMap {
  constructor(width = 15, height = 13, seed = null) { ... }
  getTile(x, y): TileType;
  setTile(x, y, tileType): void;
  isWalkable(x, y): boolean;       // Returns true only for EMPTY or POWERUP
  isDestructible(x, y): boolean;   // Returns true for BLOCK
  getGrid(): TileType[][];
  getCornerSpawns(): { x: number, y: number }[]; // 4 corners: TL, TR, BL, BR
}
```

### Guaranteed Safe Zones
At each of the 4 starting corners, the spawn tile and its directly adjacent tiles **must remain free of destructible blocks**:
- **Top-Left:** `(1,1)` spawn; `(1,2)` and `(2,1)` guaranteed EMPTY.
- **Top-Right:** `(w-2,1)` spawn; `(w-3,1)` and `(w-2,2)` guaranteed EMPTY.
- **Bottom-Left:** `(1,h-2)` spawn; `(1,h-3)` and `(2,h-2)` guaranteed EMPTY.
- **Bottom-Right:** `(w-2,h-2)` spawn; `(w-3,h-2)` and `(w-2,h-3)` guaranteed EMPTY.

---

## 🛠️ Step-by-Step Tasks

### Phase 1: Fixed Map & Procedural Generation Algorithm (`frontend/src/engine/map.js`)
- [ ] Construct the outer boundary walls (row 0, row H-1, col 0, col W-1 are all `WALL`).
- [ ] Place fixed indestructible interior pillars at even grid intersections: `x % 2 === 0 && y % 2 === 0` are `WALL`.
- [ ] Reserve safe zones for the 4 player spawn corners: ensure `(1,1)`, `(w-2,1)`, `(1,h-2)`, `(w-2,h-2)` and their 2 adjacent cells are `EMPTY`.
- [ ] Populate remaining open grid cells with destructible `BLOCK` tiles based on a configurable density factor (e.g. ~60% spawn chance).
- [ ] Support seeded generation or matrix synchronization so all 4 players render the exact same map layout.

### Phase 2: Mini-Framework DOM Rendering Pipeline (`frontend/src/engine/renderer.js`)
- [ ] Mount the fixed game viewport in `frontend/src/views/GameArena.js` using the team's mini-framework (`h()` hyperscript).
- [ ] **Crucial Performance Rule:** DO NOT recreate or re-diff the entire DOM tree on every frame. Instead:
  - Generate the static board tiles (walls and floor) once.
  - Represent dynamic entities (players, bombs, explosions, power-ups) as dedicated DOM nodes.
  - Update entity positions using GPU-accelerated CSS `transform: translate3d(x * tileSize, y * tileSize, 0)`.
  - Update dynamic tile state (block destruction, flame animations) via class toggles.
- [ ] Ensure the entire map fits on screen simultaneously so every player sees the whole map without scrolling.

### Phase 3: 60 FPS Game Loop (`frontend/src/engine/gameLoop.js`)
- [ ] Implement game loop driven strictly by `requestAnimationFrame`.
- [ ] Calculate delta time (`dt = (currentTime - lastTime) / 1000`) and clamp to prevent spiral-of-death.
- [ ] Decouple fixed-timestep physics updates (`update(dt)`) from rendering updates (`render()`).
- [ ] Avoid object allocations, garbage collection pauses, and layout thrashing (e.g., reading `offsetWidth` / `getBoundingClientRect` inside the loop).

### Phase 4: Performance Monitoring HUD (`frontend/src/ui/PerformanceHud.js`)
- [ ] Build an on-screen performance overlay displaying:
  - **Live FPS:** Instantaneous and rolling average frame rate (target: 60 FPS).
  - **Frame Time:** Milliseconds taken per frame (budget: < 16.6ms).
  - **Frame Drop Detector:** Visual alert if frame rate drops below 58 FPS.
- [ ] Profile memory usage and paint times in Chrome DevTools ("Performance" tab) and Firefox Developer Tools.

### Phase 5: Game Arena UI & HUD Layout (`frontend/src/ui/HUD.js`)
- [ ] Build the top HUD bar displaying player nicknames, lives (3 hearts), active power-ups, and game timer.
- [ ] Integrate Dev 1's real-time chat box alongside or docked with the game board.
- [ ] Create an end-game overlay / results modal for Dev 4's game-over event.

---

## 📦 Deliverables & File Locations

- `frontend/src/engine/map.js` — Fixed map layout, random block generator, corner safe zones.
- `frontend/src/engine/renderer.js` — High-performance DOM rendering engine using mini-framework.
- `frontend/src/engine/gameLoop.js` — `requestAnimationFrame` game loop and delta-time tracker.
- `frontend/src/ui/PerformanceHud.js` — Real-time 60 FPS counter and performance measurement widget.
- `frontend/src/ui/HUD.js` — In-game player status header (lives, powerups, timer).
- `frontend/src/views/GameArena.js` — Main game viewport container component.

---

## ✅ Definition of Done

- [ ] Strictly NO Canvas and NO WebGL used in the codebase.
- [ ] Map renders cleanly with fixed walls, random destructible blocks, and empty safe corner zones.
- [ ] Game runs continuously at **60 FPS** at all times without frame drops.
- [ ] Live FPS counter displays 60 FPS on-screen and updates smoothly.
- [ ] Entire map is visible to all players without viewport scrolling.
- [ ] Moving entities update smoothly using hardware-accelerated CSS transforms.
- [ ] Performance verified and documented using Chrome & Firefox DevTools.
