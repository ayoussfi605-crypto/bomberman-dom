import {
  COLS,
  ROWS,
  TILE,
  CORNER_BY_SLOT,
  SAFE_ZONE_ARM,
  BLOCK_DENSITY,
} from "../../shared/constants.js";
import { mulberry32 } from "./rng.js";

function isSafeZone(x, y) {
  for (const corner of CORNER_BY_SLOT) {
    const onHorizontalArm = y === corner.y && Math.abs(x - corner.x) <= SAFE_ZONE_ARM;
    const onVerticalArm = x === corner.x && Math.abs(y - corner.y) <= SAFE_ZONE_ARM;

    if (onHorizontalArm || onVerticalArm) return true;
  }

  return false;
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

  // Hidden power-ups will be added in the next step.
  return { tiles, hidden: new Map() };
}
