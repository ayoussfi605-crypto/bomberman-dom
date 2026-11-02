# Task 03 — Bombs, Explosions, Lives, Power-ups & Victory

**Owner:** Developer 3
**Technology:** JavaScript, Socket.IO, server-authoritative game logic

## Mission
Own the authoritative match simulation: accept validated requests, simulate
bombs, explosions, damage, power-ups and eliminations, and decide the match
outcome. Clients display your state; they never decide it.

## Step 1 — Match state and validated movement
- Create a match when the lobby emits `game:start`; keep one match per lobby.
- Track `matchId`, tick, every player's grid position, lives and upgrades.
- Handle `player:move` by validating identity, direction, alive state, cooldown
  and collision against the shared map (Task 02) before applying it.
- Broadcast accepted state through `game:state`.
- Reset match data before a new match and release it after `game:over`.

## Step 2 — Bomb system
- Allow placement only from a living player in the match, on a free tile.
- Enforce the player's bomb capacity and prevent overlapping bombs.
- Give bombs a configurable fuse, an owner and a server-generated id.
- Run fuse timers on the server and broadcast placement/removal.

## Step 3 — Explosions and block destruction
- Expand flames in four directions from the bomb tile.
- Use the player's flame range, one tile minimum.
- Stop at indestructible walls; destroy only the first destructible block in a
  direction and stop there.
- Trigger chain reactions between bombs without duplicating damage.
- Emit `game:explosion` and `game:blockDestroyed` with authoritative results.

## Step 4 — Lives, damage and elimination
- Start every player with three lives.
- Apply damage only from valid explosion events, once per player per explosion.
- Remove eliminated players from active gameplay immediately.
- Emit `game:playerEliminated` and stop accepting their actions.
- Handle forfeits from the lobby's existing `onPlayerLeft` hook.

## Step 5 — Power-ups
- On block destruction, decide randomly whether a power-up appears.
- Support Bomb (+1 capacity), Flame (+1 range) and Speed (+ movement) types.
- Define and enforce stacking caps.
- Validate pickup on the server, remove the item and synchronise upgrades.
- Keep power-ups in the shared game state so late joiners/screens stay correct.

## Step 6 — Victory and match end
- Track active versus eliminated players after every damage event.
- End the match when one active player remains; declare that player the winner.
- Treat simultaneous elimination of all remaining players as a draw.
- Emit `game:over` once, tell the lobby via `endMatch()`, and reset state.
- Unit-test bomb capacity, propagation, chained bombs, damage dedupe, power-up
  caps, victory and draw.

## Suggested files
```
backend/src/game/
├── GameManager.js
├── BombService.js
├── ExplosionService.js
├── CombatService.js
├── PowerUpService.js
└── VictoryService.js
backend/test/game.test.js
```

## Deliverables
- Authoritative match state with validated movement.
- Bomb placement, fuses and capacity rules.
- Explosion resolution, block destruction and chain reactions.
- Three-life damage system, elimination and forfeit handling.
- Three power-up types with caps and synchronised stats.
- Winner/draw detection and match reset.
- Server-side tests for the combat rules.

## Acceptance checklist
- [ ] Illegal moves and bombs are rejected by the server.
- [ ] Bomb capacity and fuse rules are enforced.
- [ ] Flames stop at walls and destroy the correct blocks.
- [ ] Chained bombs explode correctly and damage is applied once.
- [ ] Each player starts with three lives and is eliminated at zero.
- [ ] Eliminated players cannot act or win.
- [ ] Power-ups apply the right upgrade and respect caps.
- [ ] Winner or draw is broadcast exactly once.

## Coordination
- Use the map, tile codes and collision rules delivered by Task 02; do not
  duplicate a second map definition.
- Reuse the completed lobby hooks (`onMatchStart`, `onPlayerLeft`, `endMatch`)
  instead of editing lobby timers.
- Agree `game:*` payload shapes with Task 04 before UI work starts.
- Never trust client-reported positions, damage, lives or victory.
