# Developer 3 — Player Physics, Controls, Movement & Collision Engine <HICHAME>

**Assigned to:** Developer 3  
**Domain:** Player Entities, Mini-Framework Keyboard Controls, Sub-Tile Physics, AABB Collision Detection, Corner-Sliding Alignment, Remote Player Synchronization

---

## 🎯 Mission

Implement the player entity architecture for 2–4 players, smooth multi-key keyboard input handling via the custom mini-framework, continuous 2D sub-tile physics, strict collision detection against walls, destructible blocks, and bombs (including the exit-bomb pass rule), classic Bomberman **corner-sliding / alignment assist**, and real-time remote player position interpolation.

---

## ⚖️ Why This Workload is Fair & Balanced

Developer 3 owns the **game feel, character physics, and collision accuracy**:
1. **Responsive Input Engine:** Overcoming OS keyboard repeat delays using an event-driven keystate tracker built on the team's mini-framework.
2. **Sub-Tile Continuous Physics:** Translating discrete grid tiles (Dev 2) into smooth, responsive pixel/fractional coordinates without player stuttering.
3. **Advanced Collision Detection:** Implementing Axis-Aligned Bounding Box (AABB) checks against walls, blocks, and dynamic bomb obstacles.
4. **The "Bomb Step-Off" State Machine:** Players must be able to walk away from a bomb they just dropped, but cannot re-enter that tile once exited.
5. **Corner-Sliding Algorithm:** The signature Bomberman movement mechanic that prevents players from getting stuck on 90-degree corners when turning into narrow corridors.
6. **Network Position Interpolation:** Rendering other connected players' movements smoothly at 60 FPS without rubber-banding.

---

## 📐 Public Contract & Player State Specification

### Player Model (`frontend/src/entities/Player.js`):
```js
export class Player {
  constructor(id, nickname, cornerIndex) {
    this.id = id;
    this.nickname = nickname;
    this.cornerIndex = cornerIndex; // 0: TL (1,1), 1: TR (w-2,1), 2: BL (1,h-2), 3: BR (w-2,h-2)
    
    // Fractional grid coordinates (e.g. 1.0, 1.0)
    this.x = 1.0;
    this.y = 1.0;
    this.vx = 0;
    this.vy = 0;
    
    // Stats
    this.lives = 3;             // Subject requirement: 3 lives total
    this.baseSpeed = 4.0;       // Grid tiles per second
    this.speedModifier = 1.0;   // Boosted by Speed power-up
    this.direction = "down";    // "up" | "down" | "left" | "right"
    this.isMoving = false;
    this.isAlive = true;
    
    // Inventory & Combat Stats (coordinated with Dev 4)
    this.maxBombs = 1;          // Boosted by Bomb power-up
    this.activeBombs = 0;
    this.flameRange = 1;        // Boosted by Flame power-up
    
    // Bomb overlap tracking
    this.insideBombId = null;   // Set when dropping a bomb until fully exited
  }

  update(dt, map, input): void;
  takeDamage(): boolean;        // Decrements lives; returns false if eliminated
  applyPowerUp(type): void;     // Called by Dev 4 when collecting power-up
}
```

### Corner Starting Coordinates:
- **Player 1 (Top-Left):** `(1, 1)`
- **Player 2 (Top-Right):** `(mapWidth - 2, 1)`
- **Player 3 (Bottom-Left):** `(1, mapHeight - 2)`
- **Player 4 (Bottom-Right):** `(mapWidth - 2, mapHeight - 2)`

---

## 🛠️ Step-by-Step Tasks

### Phase 1: Input Controller via Mini-Framework (`frontend/src/engine/input.js`)
- [ ] Bind keyboard listeners (`keydown`, `keyup`) using the mini-framework event system.
- [ ] Maintain an active key-map state dictionary (prevent default for Arrow keys, WASD, and Spacebar).
- [ ] Support simultaneous key presses (e.g., holding `ArrowRight` while tapping `ArrowDown` or `Space`).
- [ ] Map movement directions:
  - Up: `KeyW` / `ArrowUp`
  - Down: `KeyS` / `ArrowDown`
  - Left: `KeyA` / `ArrowLeft`
  - Right: `KeyD` / `ArrowRight`
  - Drop Bomb: `Space` (triggers Dev 4's bomb drop)

### Phase 2: Player Movement & Continuous Physics (`frontend/src/entities/Player.js`)
- [ ] Compute displacement based on `speed = baseSpeed * speedModifier * dt`.
- [ ] Update `x` and `y` coordinates with direction tracking (`up`, `down`, `left`, `right`).
- [ ] Animate player DOM element using directional CSS classes or sprite frames.
- [ ] Scale movement speed dynamically when Dev 4 grants a "Speed" power-up.

### Phase 3: Collision Engine & Bounding Boxes (`frontend/src/engine/physics.js`)
- [ ] Implement AABB (Axis-Aligned Bounding Box) collision detection with an inset player hitbox (e.g., 70% of tile size for smooth maneuvering).
- [ ] **Collision vs Walls & Blocks:** Prevent player bounding box from penetrating any grid tile where `isWalkable(tileX, tileY)` is `false`.
- [ ] **Collision vs Bombs (The Step-Off Rule):**
  - When a player drops a bomb, register `insideBombId = bomb.id`.
  - While inside, allow the player to move off the bomb without getting stuck.
  - Once the player's bounding box completely exits the bomb's tile, clear `insideBombId`.
  - From that moment forward, treat the bomb tile as solid, preventing the player from walking back into it.

### Phase 4: Corner-Sliding / Alignment Assist Algorithm
- [ ] In classic Bomberman, turning into a perpendicular 1-tile corridor is difficult if the player's coordinate is slightly off-center.
- [ ] Implement corner sliding:
  - If a player is moving horizontally into an intersection, check if their `y` coordinate is within a tolerance threshold (e.g. ±0.3 tiles of the tile center).
  - Automatically apply a gentle correction velocity on the `y` axis to slide the player smoothly around the corner into the open corridor.
  - Apply the symmetric logic for vertical movement sliding onto `x`.

### Phase 5: Multiplayer Position Synchronization & Remote Interpolation
- [ ] When the local player moves, throttle/send position updates (`PLAYER_MOVE`) to Dev 1's WebSocket client.
- [ ] Listen for remote players' `PLAYER_MOVE` messages.
- [ ] Interpolate remote player positions smoothly (using linear interpolation `lerp`) in the 60 FPS loop to prevent jerky stutter.
- [ ] Update player death states when Dev 4 broadcasts `PLAYER_HIT` or elimination.

---

## 📦 Deliverables & File Locations

- `frontend/src/engine/input.js` — Keystate tracker using mini-framework events.
- `frontend/src/engine/physics.js` — Collision detection, AABB checks, and corner-sliding math.
- `frontend/src/entities/Player.js` — Player entity class, corner spawning, and life tracking.
- `frontend/src/services/playerSync.js` — Network position dispatch and remote player interpolation.

---

## ✅ Definition of Done

- [ ] Players spawn precisely in the 4 corners: (1,1), (TR), (BL), (BR).
- [ ] Controls are ultra-responsive with zero OS key-repeat stutter or delay.
- [ ] Players cannot walk through perimeter walls, interior pillars, or destructible blocks.
- [ ] Players can walk off a dropped bomb, but cannot re-enter the bomb tile once outside.
- [ ] Corner-sliding allows players to turn smoothly into 1-tile corridors without snagging on corners.
- [ ] Remote players' positions render smoothly without teleporting or jittering.
