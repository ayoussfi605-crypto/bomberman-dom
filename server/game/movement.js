import {
  COLS,
  ROWS,
  TILE,
  DIR,
  PLAYER_HITBOX_HALF,
  CORNER_ASSIST,
} from "../../shared/constants.js";

// Smaller than the 0.25 limit, so a player never jumps over a wall.
const MAX_MOVE_STEP = 0.1;

function isSolid(game, player, cellX, cellY) {
  if (cellX < 0 || cellY < 0 || cellX >= COLS || cellY >= ROWS) return true;

  const cell = cellY * COLS + cellX;
  const tile = game.tiles[cell];

  if (tile === TILE.WALL || tile === TILE.BLOCK) return true;

  if (tile === TILE.BOMB) {
    // A bomb is passable only for players still standing on it.
    const bomb = game.bombsByCell?.get(cell);
    return !(bomb && bomb.passable.has(player.slot));
  }

  return false;
}

// The hitbox is a square around the player's centre. Every cell it touches
// must be free before the new position is allowed.
function canStand(game, player, x, y) {
  const minX = Math.floor(x - PLAYER_HITBOX_HALF);
  const maxX = Math.floor(x + PLAYER_HITBOX_HALF);
  const minY = Math.floor(y - PLAYER_HITBOX_HALF);
  const maxY = Math.floor(y + PLAYER_HITBOX_HALF);

  for (let cellY = minY; cellY <= maxY; cellY++) {
    for (let cellX = minX; cellX <= maxX; cellX++) {
      if (isSolid(game, player, cellX, cellY)) return false;
    }
  }

  return true;
}

// When a move is blocked only because the player is slightly off the lane,
// slide toward the lane centre. The caller tries the forward move again next.
function tryCornerAssist(game, player, horizontal, sign, step) {
  if (horizontal) {
    const laneCenterY = Math.floor(player.y) + 0.5;
    const offset = player.y - laneCenterY;
    if (offset === 0 || Math.abs(offset) > CORNER_ASSIST) return false;

    const aheadX = Math.floor(player.x) + sign;
    const laneCellY = Math.floor(laneCenterY);
    if (isSolid(game, player, aheadX, laneCellY)) return false;

    const nudge = Math.min(step, Math.abs(offset));
    const newY = player.y - Math.sign(offset) * nudge;
    if (!canStand(game, player, player.x, newY)) return false;

    player.y = newY;
    return true;
  }

  const laneCenterX = Math.floor(player.x) + 0.5;
  const offset = player.x - laneCenterX;
  if (offset === 0 || Math.abs(offset) > CORNER_ASSIST) return false;

  const aheadY = Math.floor(player.y) + sign;
  const laneCellX = Math.floor(laneCenterX);
  if (isSolid(game, player, laneCellX, aheadY)) return false;

  const nudge = Math.min(step, Math.abs(offset));
  const newX = player.x - Math.sign(offset) * nudge;
  if (!canStand(game, player, newX, player.y)) return false;

  player.x = newX;
  return true;
}

export function movePlayer(game, player, dtSec) {
  if (!player.alive || !player.input) {
    player.moving = false;
    return;
  }

  const distance = player.speed * dtSec;
  if (distance <= 0) {
    player.moving = false;
    return;
  }

  const horizontal = player.input === DIR.LEFT || player.input === DIR.RIGHT;
  const sign = player.input === DIR.RIGHT || player.input === DIR.DOWN ? 1 : -1;

  let remaining = distance;
  let moved = false;

  while (remaining > 0) {
    const step = Math.min(remaining, MAX_MOVE_STEP);
    remaining -= step;

    const dx = horizontal ? sign * step : 0;
    const dy = horizontal ? 0 : sign * step;

    if (canStand(game, player, player.x + dx, player.y + dy)) {
      player.x += dx;
      player.y += dy;
      moved = true;
      continue;
    }

    if (tryCornerAssist(game, player, horizontal, sign, step)) {
      moved = true;
      continue;
    }

    break;
  }

  player.moving = moved;
}
