import {
  BASE_BOMBS,
  BASE_RANGE,
  BASE_SPEED,
  CORNER_BY_SLOT,
  LIVES,
  SPEED_STEP,
} from "../../shared/constants.js";

// Create one player at the centre of their corner cell, with base stats.
export function createPlayer(slot, nickname) {
  const corner = CORNER_BY_SLOT[slot];

  return {
    slot,
    nickname,
    x: corner.x + 0.5,
    y: corner.y + 0.5,
    dir: "down",
    input: null,
    moving: false,
    alive: true,
    lives: LIVES,
    invulnerableUntil: 0,
    maxBombs: BASE_BOMBS,
    range: BASE_RANGE,
    speedLevel: 0,
    activeBombs: 0,

    // Speed grows with each speed power-up. A getter keeps it in sync.
    get speed() {
      return BASE_SPEED + this.speedLevel * SPEED_STEP;
    },
  };
}
