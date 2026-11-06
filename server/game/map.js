import { COLS, ROWS, TILE } from "../../shared/constants.js";

export function generateMap() {
  // One number per cell, stored row by row. Start with floor everywhere.
  const tiles = new Uint8Array(COLS * ROWS);
  tiles.fill(TILE.FLOOR);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const isBorder = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
      const isPillar = x % 2 === 0 && y % 2 === 0;

      if (isBorder || isPillar) {
        tiles[y * COLS + x] = TILE.WALL;
      }
    }
  }

  // Hidden power-ups will be added when we implement destructible blocks.
  return { tiles, hidden: new Map() };
}
