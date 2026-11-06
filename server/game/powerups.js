import {
  COLS,
  MAX_BOMBS,
  MAX_RANGE,
  MAX_SPEED_LEVEL,
  TILE,
} from "../../shared/constants.js";

// A destroyed block may hide an item. Remember it until its flame ends.
export function revealHidden(game, cell) {
  const powerup = game.hidden.get(cell);
  if (powerup === undefined) return;

  game.reveals.set(cell, powerup);
  game.hidden.delete(cell);
}

// Pick up the item under the player's centre. Over the cap the item is
// still consumed, but the stat does not grow.
export function pickupPowerup(game, player) {
  if (!player.alive) return false;

  const cellX = Math.floor(player.x);
  const cellY = Math.floor(player.y);
  const cell = cellY * COLS + cellX;
  const tile = game.tiles[cell];

  if (tile === TILE.POWERUP_BOMB) {
    player.maxBombs = Math.min(player.maxBombs + 1, MAX_BOMBS);
  } else if (tile === TILE.POWERUP_FLAME) {
    player.range = Math.min(player.range + 1, MAX_RANGE);
  } else if (tile === TILE.POWERUP_SPEED) {
    player.speedLevel = Math.min(player.speedLevel + 1, MAX_SPEED_LEVEL);
  } else {
    return false;
  }

  game.tiles[cell] = TILE.FLOOR;
  game.tileDirty = true;
  return true;
}
