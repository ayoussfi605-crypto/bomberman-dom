import {
  COLS,
  ROWS,
  TILE,
  CORNER_BY_SLOT,
  SAFE_ZONE_ARM,
  BLOCK_DENSITY,
  POWERUP_CHANCE,
  POWERUP_MIN_PER_TYPE,
} from "../../shared/constants.js";
import { mulberry32 } from "./rng.js";

const POWERUP_TYPES = [
  TILE.POWERUP_BOMB,
  TILE.POWERUP_FLAME,
  TILE.POWERUP_SPEED,
];

function isSafeZone(x, y) {
  for (const corner of CORNER_BY_SLOT) {
    const onHorizontalArm = y === corner.y && Math.abs(x - corner.x) <= SAFE_ZONE_ARM;
    const onVerticalArm = x === corner.x && Math.abs(y - corner.y) <= SAFE_ZONE_ARM;

    if (onHorizontalArm || onVerticalArm) return true;
  }

  return false;
}

// Shuffle a copy with the seeded generator, so the same seed gives the same order.
function shuffle(items, random) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function collectBlocks(tiles) {
  const blocks = [];
  for (let cell = 0; cell < tiles.length; cell++) {
    if (tiles[cell] === TILE.BLOCK) blocks.push(cell);
  }
  return blocks;
}

// The power-up deck needs at least six blocks. If a seed produced fewer,
// turn the first eligible floor cells into blocks (same order every time).
function ensureBlocks(tiles, minimum) {
  const blocks = collectBlocks(tiles);
  if (blocks.length >= minimum) return blocks;

  for (let cell = 0; cell < tiles.length && blocks.length < minimum; cell++) {
    const x = cell % COLS;
    const y = Math.floor(cell / COLS);
    if (tiles[cell] === TILE.FLOOR && !isSafeZone(x, y)) {
      tiles[cell] = TILE.BLOCK;
      blocks.push(cell);
    }
  }

  return blocks;
}

// Build a deck with at least POWERUP_MIN_PER_TYPE of each type, then fill the
// rest with random types. The shuffle hides which type sits under which block.
function buildDeck(count, random) {
  const deck = [];
  for (const type of POWERUP_TYPES) {
    for (let i = 0; i < POWERUP_MIN_PER_TYPE; i++) deck.push(type);
  }

  while (deck.length < count) {
    const type = POWERUP_TYPES[Math.floor(random() * POWERUP_TYPES.length)];
    deck.push(type);
  }

  return shuffle(deck, random);
}

export function generateMap(seed = 0) {
  const random = mulberry32(seed);

  // One number per cell, stored row by row. Start with floor everywhere.
  const tiles = new Uint8Array(COLS * ROWS);
  tiles.fill(TILE.FLOOR);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const isBorder = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
      const isPillar = x % 2 === 0 && y % 2 === 0;

      if (isBorder || isPillar) {
        tiles[y * COLS + x] = TILE.WALL;
      } else if (!isSafeZone(x, y) && random() < BLOCK_DENSITY) {
        tiles[y * COLS + x] = TILE.BLOCK;
      }
    }
  }

  // Hide power-ups under blocks. The deck guarantees every type appears.
  const blocks = ensureBlocks(tiles, 3 * POWERUP_MIN_PER_TYPE);
  const hiddenCount = Math.min(
    Math.max(
      Math.round(blocks.length * POWERUP_CHANCE),
      3 * POWERUP_MIN_PER_TYPE,
    ),
    blocks.length,
  );
  const deck = buildDeck(hiddenCount, random);
  const chosenBlocks = shuffle(blocks, random).slice(0, hiddenCount);

  const hidden = new Map();
  chosenBlocks.forEach((cell, index) => {
    hidden.set(cell, deck[index]);
  });

  return { tiles, hidden };
}
