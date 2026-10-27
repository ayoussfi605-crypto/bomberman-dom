# Developer 4 — Bomb Mechanics, Explosion Raycasting, Power-Ups & Combat Rules <MOHAMMED>

**Assigned to:** Developer 4  
**Domain:** Bomb Placement, 4-Directional Explosion Raycasting, Chain Reactions, Block Destruction, Loot Drops & Core Power-Ups (Bombs, Flames, Speed), Player Damage (3 Lives), Elimination & Last Man Standing Victory

---

## 🎯 Mission

Implement the core combat system of Bomberman: bomb placement with inventory caps, 3-second fuse timers, the 4-way explosion raycasting engine with obstacle penetration rules and recursive chain reactions, destructible block drops, core power-up collection (Bombs, Flames, Speed), player damage detection with invincibility frames, the 3-lives elimination system ("Then you are out!"), and the last-man-standing victory condition.

---

## ⚖️ Why This Workload is Fair & Balanced

Developer 4 owns the **heart of Bomberman gameplay and combat**:
1. **The Raycasting Explosion Engine:** Implementing 4-directional raycasting that checks tile obstructions, destroys blocks, and terminates at walls.
2. **Chain Reaction Physics:** Detonating bombs caught inside another bomb's explosion path, requiring clean queueing/recursion to prevent infinite loops.
3. **Core Power-Up Loot System:** Managing random loot tables, drop probabilities, power-up rendering, pickup collision detection, and player stat progression (Bombs +1, Flames +1, Speed +1).
4. **Damage & Life Management:** Decrementing from 3 lives, applying temporary invulnerability frames (i-frames) with blinking effects, and eliminating defeated players.
5. **Win / Loss Orchestration:** Detecting the last player standing, broadcasting victory events to Dev 1, and displaying the end-game summary modal.

---

## 📐 Public Contract & Combat Specifications

### Core Power-Up Types & Stat Modifiers (`frontend/src/entities/PowerUp.js`):
```js
export const PowerUpType = {
  BOMBS: "bombs",   // Increases max active bombs by +1
  FLAMES: "flames", // Increases explosion radius by +1 block in all 4 directions
  SPEED: "speed"    // Increases player movement speed
};
```

### Loot Table Drop Probability:
- When a destructible block is destroyed:
  - **40% chance:** No drop (empty).
  - **20% chance:** `PowerUpType.BOMBS` (+1 bomb capacity)
  - **20% chance:** `PowerUpType.FLAMES` (+1 flame range)
  - **20% chance:** `PowerUpType.SPEED` (+speed modifier)

---

## 🛠️ Step-by-Step Tasks

### Phase 1: Bomb Placement & Fuse Timer (`frontend/src/entities/Bomb.js`)
- [ ] Implement bomb drop trigger on `Spacebar` press.
- [ ] Snap bomb position to the nearest integer grid cell: `tileX = Math.round(player.x)`, `tileY = Math.round(player.y)`.
- [ ] Check player bomb limit: ensure `player.activeBombs < player.maxBombs` before placing.
- [ ] Register bomb in map matrix: `map.setTile(tileX, tileY, TileType.BOMB)`.
- [ ] Start a **3-second fuse timer** with a pulsing visual animation before detonation.
- [ ] When the bomb detonates, notify Dev 1 via `BOMB_EXPLODED` for multiplayer synchronization.

### Phase 2: 4-Way Explosion Raycasting Algorithm (`frontend/src/engine/explosion.js`)
- [ ] When a bomb detonates, calculate flame spread in the 4 cardinal directions: Up `(0, -1)`, Down `(0, 1)`, Left `(-1, 0)`, Right `(1, 0)`.
- [ ] For each direction, step outward up to `player.flameRange` tiles:
  - **If tile is `WALL` (Indestructible Pillar/Border):** Explosion stops immediately. Do not destroy the wall, and do not continue in this direction.
  - **If tile is `BLOCK` (Destructible):** Mark block for destruction, trigger loot drop check, and stop the explosion from continuing further in this direction.
  - **If tile is `BOMB` (Chain Reaction):** Detonate that bomb immediately without waiting for its 3-second timer!
  - **If tile is `EMPTY` or `POWERUP`:** Place flame on tile, destroy any existing power-up on that tile, and continue to the next tile in this direction.
- [ ] Retain active flame tiles for **500ms**, then clear them back to `EMPTY`.

### Phase 3: Block Loot Drop & Power-Up Collection (`frontend/src/entities/PowerUp.js`)
- [ ] On block destruction, roll RNG against the loot table.
- [ ] If a power-up spawns, render it in the DOM via the mini-framework at `(tileX, tileY)`.
- [ ] Check collision with active players:
  - If a player enters the power-up tile:
    - Apply stat upgrade:
      - `BOMBS`: `player.maxBombs += 1`
      - `FLAMES`: `player.flameRange += 1`
      - `SPEED`: `player.speedModifier += 0.25`
    - Remove power-up from map and DOM.
    - Play pickup audio/visual feedback.

### Phase 4: Player Damage, 3-Lives System & Elimination
- [ ] During the 500ms explosion window, check if any player's hitbox overlaps an active flame tile.
- [ ] If a player is hit and not currently invulnerable:
  - Deduct 1 life: `player.lives -= 1`.
  - Trigger **1.5 seconds of invincibility** with sprite blinking/flashing so one explosion doesn't instantly deplete all 3 lives.
  - Update player lives UI in Dev 2's HUD (3 hearts counter).
- [ ] When `player.lives <= 0`:
  - Set `player.isAlive = false`.
  - Play elimination animation and remove player hitbox from the active game ("Then you are out!").
  - Broadcast `PLAYER_HIT` / `PLAYER_ELIMINATED` over WebSockets.

### Phase 5: Win Condition & Game Over Modal (`frontend/src/ui/GameOverModal.js`)
- [ ] After any player elimination, count remaining alive players.
- [ ] **Victory Condition:** When exactly **1 player remains alive**, declare that player the winner!
- [ ] Broadcast `GAME_OVER` event with the winner's nickname.
- [ ] Display end-game modal:
  - Announce winner's nickname and victory banner.
  - Show match summary (eliminations, power-ups collected).
  - Button: "Return to Lobby" to restart match cycle.

---

## 📦 Deliverables & File Locations

- `frontend/src/entities/Bomb.js` — Bomb placement, fuse timer, and chain reaction triggers.
- `frontend/src/engine/explosion.js` — 4-way raycasting algorithm and flame lifecycle.
- `frontend/src/entities/PowerUp.js` — Loot drop table, power-up entities, and pickup handlers.
- `frontend/src/ui/GameOverModal.js` — Victory announcement modal and rematch flow.

---

## ✅ Definition of Done

- [ ] Players can drop bombs up to their current capacity limit.
- [ ] Bombs explode after a 3-second fuse timer.
- [ ] Explosions radiate in 4 directions according to the player's flame range.
- [ ] Explosions are blocked by indestructible walls and stop upon destroying blocks.
- [ ] Explosions trigger chain-reaction detonations of any bombs caught in the blast.
- [ ] Destroyed blocks have a chance to drop Bombs, Flames, or Speed power-ups.
- [ ] Collecting power-ups updates player stats correctly.
- [ ] Players take damage in explosions, have 3 lives, and receive brief invulnerability frames.
- [ ] Player is eliminated when lives reach 0 ("Then you are out!").
- [ ] Last surviving player is declared victorious with the GameOverModal displayed.
