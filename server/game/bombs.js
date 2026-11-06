import {
  COLS,
  ROWS,
  TILE,
  BOMB_FUSE_MS,
  FLAME_MS,
  PLAYER_HITBOX_HALF,
} from "../../shared/constants.js";

const DIRECTIONS = [
  { dx: 0, dy: -1 }, // up
  { dx: 0, dy: 1 }, // down
  { dx: -1, dy: 0 }, // left
  { dx: 1, dy: 0 }, // right
];

function cellIndex(x, y) {
  return y * COLS + x;
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < COLS && y < ROWS;
}

function hitboxOverlapsCell(player, cellX, cellY) {
  return (
    player.x + PLAYER_HITBOX_HALF > cellX &&
    player.x - PLAYER_HITBOX_HALF < cellX + 1 &&
    player.y + PLAYER_HITBOX_HALF > cellY &&
    player.y - PLAYER_HITBOX_HALF < cellY + 1
  );
}

export function placeBomb(game, player, now) {
  if (!player.alive || player.activeBombs >= player.maxBombs) return false;

  const cellX = Math.floor(player.x);
  const cellY = Math.floor(player.y);
  const cell = cellIndex(cellX, cellY);
  if (game.tiles[cell] !== TILE.FLOOR) return false;

  const bomb = {
    ownerSlot: player.slot,
    cell,
    range: player.range,
    explodeAt: now + BOMB_FUSE_MS,
    passable: new Set(),
    exploded: false,
  };

  // Anyone standing on the new bomb may walk off it.
  for (const other of game.players) {
    if (other.alive && hitboxOverlapsCell(other, cellX, cellY)) {
      bomb.passable.add(other.slot);
    }
  }

  game.tiles[cell] = TILE.BOMB;
  game.bombs.push(bomb);
  game.bombsByCell.set(cell, bomb);
  player.activeBombs += 1;
  game.tileDirty = true;
  return true;
}

function addFlame(game, cell, now) {
  const expiresAt = now + FLAME_MS;
  const current = game.flames.get(cell);

  // Overlapping explosions keep the longest-lasting flame.
  if (current === undefined || expiresAt > current) {
    game.flames.set(cell, expiresAt);
  }

  game.tiles[cell] = TILE.FLAME;
  game.tileDirty = true;
}

function explodeBomb(game, bomb, now, queue) {
  game.bombsByCell.delete(bomb.cell);

  const owner = game.playersBySlot.get(bomb.ownerSlot);
  if (owner) owner.activeBombs -= 1;

  addFlame(game, bomb.cell, now);

  const cellX = bomb.cell % COLS;
  const cellY = Math.floor(bomb.cell / COLS);

  for (const { dx, dy } of DIRECTIONS) {
    for (let distance = 1; distance <= bomb.range; distance++) {
      const x = cellX + dx * distance;
      const y = cellY + dy * distance;
      if (!inBounds(x, y)) break;

      const cell = cellIndex(x, y);
      const tile = game.tiles[cell];

      if (tile === TILE.WALL) break;

      if (tile === TILE.BLOCK) {
        // Remember the hidden item. It appears when the flame ends.
        const powerup = game.hidden.get(cell);
        if (powerup !== undefined) {
          game.reveals.set(cell, powerup);
          game.hidden.delete(cell);
        }
        addFlame(game, cell, now);
        break;
      }

      if (tile === TILE.BOMB) {
        const other = game.bombsByCell.get(cell);
        if (other && !other.exploded) queue.push(other);
        break;
      }

      // FLOOR, FLAME, or an exposed power-up: burn it and continue.
      addFlame(game, cell, now);
    }
  }
}

export function updateBombs(game, now) {
  const queue = [];

  for (const bomb of game.bombs) {
    if (!bomb.exploded && bomb.explodeAt <= now) queue.push(bomb);
  }

  // A bomb can be queued by several rays. Explode each one only once.
  const processed = new Set();

  while (queue.length > 0) {
    const bomb = queue.shift();
    if (processed.has(bomb) || bomb.exploded) continue;

    processed.add(bomb);
    bomb.exploded = true;
    explodeBomb(game, bomb, now, queue);
  }

  if (processed.size > 0) {
    game.bombs = game.bombs.filter((bomb) => !processed.has(bomb));
  }
}

export function updateFlames(game, now) {
  for (const [cell, expiresAt] of game.flames) {
    if (expiresAt > now) continue;

    const powerup = game.reveals.get(cell);
    game.tiles[cell] = powerup === undefined ? TILE.FLOOR : powerup;
    game.reveals.delete(cell);
    game.flames.delete(cell);
    game.tileDirty = true;
  }
}

// Once a player's hitbox leaves the bomb cell, the bomb becomes solid for them.
export function updateBombPassability(game) {
  for (const bomb of game.bombs) {
    if (bomb.passable.size === 0) continue;

    const cellX = bomb.cell % COLS;
    const cellY = Math.floor(bomb.cell / COLS);

    for (const slot of bomb.passable) {
      const player = game.playersBySlot.get(slot);
      if (
        !player ||
        !player.alive ||
        !hitboxOverlapsCell(player, cellX, cellY)
      ) {
        bomb.passable.delete(slot);
      }
    }
  }
}
