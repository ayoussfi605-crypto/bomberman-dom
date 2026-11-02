# TASKS — mohamed: game engine (server-side rules, pure module)

Read first: `ARCHITECTURE.md` (§4, §5, §7.1), `PROTOCOL.md` (the `snapshot` and `tiles` messages), `../shared/constants.js` (from these docs; use `../../shared/constants.js` from `server/game/`).

## Mission

Write the **authoritative game simulation**: map generation, smooth movement with collisions, bombs, explosions, power-ups, lives, win/draw. It is a **pure Node module**: no sockets, no timers, no `Date.now()` (time only comes from `step(dt)`), no randomness except the seeded RNG. yacobe's room calls it 30 times per second; hichame renders what it returns.

## Boundaries

- You own `server/game/` and its tests. You never import `ws`, `http`, or anything from `server/net` / `server/lobby`.
- External imports are limited to `../../shared/constants.js` from `server/game/`; importing your own engine modules is allowed.
- The public API is shared (`ARCHITECTURE.md` §7.1). Coordinate corrections during M1, then stabilize it. Internals are yours.

## Files to create

```
server/game/rng.js            mulberry32(seed) -> () => float [0,1)
server/game/map.js            generateMap(seed) -> { tiles: Uint8Array, hidden: Map<cellIndex, TILE.POWERUP_*> }
server/game/player.js         createPlayer(slot, nickname): stats + derived speed
server/game/movement.js       movePlayer(game, player, dtSec): collision + corner assist
server/game/bombs.js          placeBomb, updateBombs, explode (chain), updateFlames
server/game/powerups.js       pickupPowerup, revealHidden
server/game/damage.js         applyFlameDamage, eliminate
server/game/game.js           createGame: public API, tick order, snapshot/result
server/__tests__/map.test.js
server/__tests__/movement.test.js
server/__tests__/bombs.test.js
server/__tests__/game.test.js
```

## Public API (integration contract)

```js
createGame(players, seed) -> game       // players: [{ slot, nickname }], slots are 0..n-1
game.setInput(slot, dir)                // "up"|"down"|"left"|"right"|null   (ignore invalid / dead players)
game.placeBomb(slot)
game.removePlayer(slot)                 // lives = 0, alive = false (bombs already placed still explode)
game.step(dtMs) -> { tilesChanged }     // dtMs is normally TICK_MS; if > 100 split into sub-steps
game.getSnapshot() -> { tick, players: [ { slot, x, y, dir, moving, alive, lives, invulnerable, maxBombs, range, speedLevel } ] }   // x,y rounded to 3 decimals
game.getTiles() -> number[]             // COLS*ROWS TILE codes. Hidden power-ups are NEVER included (a BLOCK is a BLOCK).
game.getResult() -> null | { winner: slot|null, players: [ { slot, nickname, lives } ] }
```

## Features in detail

### 1. Map generation (`map.js`) — deterministic for a given seed
1. Border = `WALL`. Pillars: `WALL` at every interior `(x even, y even)`. Everything else `FLOOR`.
2. Safe zones for **all 4 corners** (even with fewer players): corner cell + `SAFE_ZONE_ARM` (3) cells along each edge, e.g. top-left: (1,1),(2,1),(3,1),(4,1),(1,2),(1,3),(1,4). Never a block there. Require `SAFE_ZONE_ARM > BASE_RANGE`; verify each corner has a reachable cell outside its first bomb blast, with enough time to reach it at base speed before the fuse ends. The former two-cell arms were entirely inside the default blast.
3. Every other `FLOOR` cell becomes `BLOCK` with probability `BLOCK_DENSITY` (seeded RNG).
4. **Hidden power-ups:** choose `max(round(blocks * POWERUP_CHANCE), 3 * POWERUP_MIN_PER_TYPE)` blocks. Build the deck so each of the 3 types appears at least `POWERUP_MIN_PER_TYPE` times, fill the rest randomly, shuffle (seeded), assign to the chosen blocks in a `Map<cellIndex, tileCode>`. This guarantees the audit question "at least 3 types of power-ups". Ensure at least six blocks exist before assigning the deck (deterministically add blocks to eligible cells if necessary); never select more hidden-item cells than actual blocks.

### 2. Players (`player.js`)
- Start at the centre of `CORNER_BY_SLOT[slot]` (e.g. `(1.5, 1.5)`), `dir: "down"`, `lives: LIVES`, `maxBombs: BASE_BOMBS`, `range: BASE_RANGE`, `speedLevel: 0`, `alive: true`, `invulnerableUntil: 0`, `activeBombs: 0`.
- `speed = BASE_SPEED + speedLevel * SPEED_STEP` tiles/s.

### 3. Movement (`movement.js`) — smooth, 4-directional, tile-based collision
- Input = desired direction (or null). Move `speed * dt` tiles along it. Split the movement into sub-steps of ≤ 0.25 tile so nobody tunnels through a wall.
- Hitbox = square centred on `(x, y)` with half-size `PLAYER_HITBOX_HALF` (0.35). A move is allowed only if every cell overlapped by the hitbox at the new position is **not solid**. Solid = `WALL`, `BLOCK`, `BOMB` (see exception below). Do the move per axis (only one axis moves at a time since there is no diagonal).
- **Corner assist** (mandatory, otherwise cornering feels awful): if the move is blocked, *and* the cell straight ahead in the player's centred lane is free, *and* the player's offset from the lane centre is ≤ `CORNER_ASSIST` (0.3), slide the player perpendicular toward the lane centre (by the same distance, never overshooting the centre) instead of stopping. Example: moving right at `y = row + 0.5 + 0.2` next to a pillar → nudge `y` toward `row + 0.5` until the move passes.
- **Own-bomb exception:** when a bomb is placed, every player whose hitbox overlaps that cell may pass through it (`bomb.passable` = set of slots). A slot is removed from the set as soon as its hitbox no longer overlaps the bomb cell; after that the bomb is solid for everybody.
- `dir` field = last non-null direction. `moving` = the position really changed this tick (blocked by a wall → false).
- Dead players don't move, don't collide, don't take damage.

### 4. Bombs (`bombs.js`)
- `placeBomb(slot)`: alive, `activeBombs < maxBombs`, the cell under the player's **centre** is `FLOOR` → tile becomes `BOMB`; store `{ ownerSlot, cell, range: player.range (captured now), explodeAt: now + BOMB_FUSE_MS, passable }`; `activeBombs++`.
- Every tick: bombs whose `explodeAt <= now` explode. Use a queue so **chain reactions** resolve in the same tick.
- **Explosion** from cell `c` with `range r`: `c` becomes `FLAME`. For each of the 4 directions, up to `r` cells:
  - `WALL` → stop (no flame);
  - `BLOCK` → becomes `FLAME`, remember to reveal its hidden power-up when the flame ends, **stop**;
  - `BOMB` (other bomb) → add to the explode queue, **stop**;
  - exposed `POWERUP_*` → destroyed, becomes `FLAME`, **continue**;
  - `FLOOR` / `FLAME` → becomes `FLAME`, continue.
  - Each flame cell stores `expiresAt = now + FLAME_MS` (take the max when overlapping).
- Explosion: `owner.activeBombs--`, `tilesChanged = true`. Process each bomb at most once, even when several rays queue it during one tick.
- Flame expiry: cell becomes the revealed power-up tile if one was hidden there, else `FLOOR`.

### 5. Power-ups (`powerups.js`)
- Each tick, for every alive player, look at the cell of the centre: if it is `POWERUP_BOMB/FLAME/SPEED` → apply and set the tile to `FLOOR`, `tilesChanged = true`:
  - bomb: `maxBombs + 1` (max `MAX_BOMBS`), flame: `range + 1` (max `MAX_RANGE`), speed: `speedLevel + 1` (max `MAX_SPEED_LEVEL`). Over the cap: tile is still consumed, no effect.

### 6. Damage, lives, elimination (`damage.js`)
- After bombs/flames are updated: for each alive, **non-invulnerable** player whose centre cell is `FLAME` → `lives--`, `invulnerableUntil = now + INVULN_MS`. At `lives === 0` → `alive = false`.
- `invulnerable` in the snapshot = `now < invulnerableUntil`.
- **This must hold:** standing on a bomb when it explodes costs exactly **1 life** (the flame lasts 15 ticks; invulnerability prevents more). A player can hurt himself. Another player next to the bomb also loses 1.

### 7. Tick order (`game.step`)
1. apply nothing for dead players; 2. move players; 3. pick up power-ups; 4. bomb fuses + chain explosions; 5. flame expiry (+ reveal); 6. damage; 7. eliminations; 8. `tick++`. Return `{ tilesChanged }`. Maintain a persistent tile-dirty flag: a `placeBomb()` call between steps must make the next step return true. OR together changes across internal sub-steps. At step end, capture the flag, clear the internal flag, then return the captured value; getters never clear it.

### 8. Result (`getResult`)
- `null` while ≥ 2 players are alive. When ≤ 1 alive: `winner` = that slot, or `null` if nobody is alive (draw). `players` = all players with their final `lives`. Works also right after `removePlayer`.

## Phases and definition of done

| Phase | Deliver | Done when |
|---|---|---|
| **0 — unblock (first!)** | `rng.js`, `map.js`, a `createGame` skeleton with the full API where players don't move yet; `getTiles()` real | yacobe can start a game on the real map; map tests green |
| 1 | movement + collision + corner assist | tests: stops at walls/blocks/bombs, passes corners, speed values, no tunnelling |
| 2 | bombs, explosions, flames, chain, block destruction, own-bomb rule | tests for range, stop rules, chain, bomb limit, fuse timing ±1 tick |
| 3 | power-ups + damage + lives + invulnerability + win/draw + `removePlayer` | the 3 audit damage scenarios pass in `game.test.js` |
| 4 | tuning and balance with the real client | 4 humans can play a full match |

## Tests (`node --test`, no dependencies)

- map: borders/pillars in the right places; safe zones empty for all corners; first-bomb escape route exists and can be traversed before fuse expiry even with blocks immediately beyond the reserved cells; same seed → same map; ≥ 2 hidden power-ups of each type; blocks never hide in walls.
- movement: blocked by WALL/BLOCK/BOMB; walks into a corridor with offset 0.25; can't with offset 0.45; own bomb passable then solid; speed = base + level × step; large `dt` doesn't tunnel.
- bombs: explodes at 2000 ms (±1 tick); flames last 500 ms; range respected; stops at WALL; destroys first BLOCK and stops; chain reaction in the same tick; a bomb queued twice explodes only once; flames continue past exposed power-ups; `maxBombs` enforced; can't place on a bomb.
- game: standing on own bomb = −1 life exactly (not −2/−3); second player next to the bomb −1; invulnerability 2 s; 3 hits → `alive false`; destroy all blocks → ≥ 3 power-up types appeared; pickup effects and caps; last player standing → result; simultaneous death → draw; `removePlayer` ends a 2-player game.

## Audit questions you are responsible for

- Lose 1 of 3 lives next to your own bomb; lose all 3 → out; another player loses a life when the bomb explodes next to them.
- Destructible block disappears when bombed; destroying every block shows power-ups; ≥ 3 power-up types.
- Players start in the corners and can survive their own first bomb.

## Pitfalls

- Never use `Math.random()` or `Date.now()` inside the engine (use the seeded RNG and the accumulated game time).
- Don't mutate arrays you return: `getTiles()` returns a **copy** (`Array.from`), `getSnapshot()` fresh objects.
- `tilesChanged` must be true for: bomb placed, any explosion, flame expiry, power-up revealed, power-up picked up. Missing one = a stale tile on the clients. Include a regression test: call `placeBomb()`, call getters, then `step()`; it must report `tilesChanged: true`. The following unchanged tick reports false.
- Keep `step` allocation-light (it runs 30×/s for the whole match) but correctness first.
