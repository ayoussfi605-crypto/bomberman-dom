# Task 03 — Bombs, Combat & Power-ups

**Owner:** Developer 3  
**Technology:** JavaScript, server-authoritative game logic

## Mission
Implement bomb placement, explosions, player damage, lives, power-ups,
death handling, and victory conditions.

## Step 1 — Bomb system
- Allow bombs according to each player's bomb capacity.
- Give bombs a configurable fuse duration.
- Prevent illegal placement and overlapping bomb placement.
- Track bomb ownership and explosion timing.
- Validate bomb requests on the server.

## Step 2 — Explosions
- Explosions extend in four directions.
- Base flame range is one tile in each direction.
- Flames stop at indestructible walls.
- Destructible blocks stop propagation and can be destroyed.
- Define consistent interactions between explosions, bombs, and blocks.
- Prevent duplicate damage from the same explosion event.
- Synchronize results with clients.

## Step 3 — Lives and elimination
- Each player starts with three lives.
- Apply damage only for valid damaging events.
- Eliminate a player when lives reach zero.
- Remove eliminated players from active gameplay.
- Notify the match manager when a player dies or forfeits.

## Step 4 — Power-ups
When a destructible block is destroyed, randomly decide whether a power-up
appears. Implement:
- Bomb: increase simultaneous bomb capacity by one.
- Flame: increase explosion range by one tile.
- Speed: increase movement speed.

Also:
- Define limits for stacking upgrades.
- Represent power-ups in shared game state.
- Validate pickup eligibility on the server.
- Remove collected power-ups and synchronize upgrades.

## Step 5 — Victory conditions
- Track active and eliminated players.
- End the match when only one active player remains.
- Handle simultaneous eliminations consistently.
- Define what happens if all remaining players die together.
- Broadcast the winner or draw.
- Reset match-specific state before the next match.

## Suggested files
- `backend/src/game/GameManager.js`
- `backend/src/game/BombService.js`
- `backend/src/game/ExplosionService.js`
- `backend/src/game/CombatService.js`
- `backend/src/game/PowerUpService.js`
- `backend/src/game/VictoryService.js`
- `frontend/src/entities/Bomb.js`
- `frontend/src/entities/PowerUp.js`

The frontend files are visual representations; authoritative game rules stay
on the server.

## Deliverables
Bomb placement, explosions, block interactions, three-life system, power-ups,
player elimination, and victory detection.

## Acceptance checklist
- [ ] Bomb capacity is enforced.
- [ ] Flames stop at walls and destroy blocks correctly.
- [ ] Damage is validated on the server.
- [ ] Each player begins with three lives.
- [ ] Power-ups apply the correct upgrades.
- [ ] Eliminated players cannot continue playing.
- [ ] Match end is broadcast consistently.
