import { COLS, INVULN_MS, TILE } from "../../shared/constants.js";

export function eliminate(player) {
  player.lives = 0;
  player.alive = false;
  player.input = null;
  player.moving = false;
}

// Damage is decided by the cell under the player's centre. Invulnerability
// prevents a single explosion from taking more than one life.
export function applyFlameDamage(game, now) {
  for (const player of game.players) {
    if (!player.alive) continue;
    if (now < player.invulnerableUntil) continue;

    const cellX = Math.floor(player.x);
    const cellY = Math.floor(player.y);
    const cell = cellY * COLS + cellX;

    if (game.tiles[cell] !== TILE.FLAME) continue;

    player.lives -= 1;
    player.invulnerableUntil = now + INVULN_MS;

    if (player.lives <= 0) eliminate(player);
  }
}
