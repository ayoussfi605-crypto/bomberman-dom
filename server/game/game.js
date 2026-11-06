import { DIR } from "../../shared/constants.js";
import {
  placeBomb as placeBombInWorld,
  updateBombPassability,
  updateBombs,
  updateFlames,
} from "./bombs.js";
import { applyFlameDamage } from "./damage.js";
import { generateMap } from "./map.js";
import { movePlayer } from "./movement.js";
import { createPlayer } from "./player.js";
import { pickupPowerup } from "./powerups.js";

const VALID_DIRECTIONS = new Set(Object.values(DIR));
const MAX_SUB_STEP_MS = 100;

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

export function createGame(players = [], seed = 0) {
  const { tiles, hidden } = generateMap(seed);

  const playerList = players.map(({ slot, nickname }) =>
    createPlayer(slot, nickname),
  );
  const playersBySlot = new Map(
    playerList.map((player) => [player.slot, player]),
  );

  const world = {
    tiles,
    hidden,
    players: playerList,
    playersBySlot,
    bombs: [],
    bombsByCell: new Map(),
    flames: new Map(),
    reveals: new Map(),
    tileDirty: false,
  };

  let tick = 0;
  let timeMs = 0;

  function setInput(slot, dir) {
    const player = playersBySlot.get(slot);
    if (!player || !player.alive) return;
    if (dir !== null && !VALID_DIRECTIONS.has(dir)) return;

    player.input = dir;
    if (dir !== null) player.dir = dir;
  }

  function placeBomb(slot) {
    const player = playersBySlot.get(slot);
    if (!player) return;

    placeBombInWorld(world, player, timeMs);
  }

  function removePlayer(slot) {
    const player = playersBySlot.get(slot);
    if (!player) return;

    player.alive = false;
    player.lives = 0;
    player.input = null;
    player.moving = false;
  }

  function step(dtMs) {
    let remaining = Math.max(0, Number(dtMs) || 0);

    // A long frame is split so movement cannot tunnel through walls later.
    while (remaining > 0) {
      const subStep = Math.min(remaining, MAX_SUB_STEP_MS);
      remaining -= subStep;
      simulate(subStep);
    }

    const changed = world.tileDirty;
    world.tileDirty = false;
    return { tilesChanged: changed };
  }

  function simulate(dtMs) {
    timeMs += dtMs;

    for (const player of playerList) {
      movePlayer(world, player, dtMs / 1000);
    }
    updateBombPassability(world);

    for (const player of playerList) {
      if (player.alive) pickupPowerup(world, player);
    }

    updateBombs(world, timeMs);
    updateFlames(world, timeMs);
    applyFlameDamage(world, timeMs);

    tick += 1;
  }

  function getSnapshot() {
    return {
      tick,
      players: playerList.map((player) => ({
        slot: player.slot,
        x: round3(player.x),
        y: round3(player.y),
        dir: player.dir,
        moving: player.moving,
        alive: player.alive,
        lives: player.lives,
        invulnerable: timeMs < player.invulnerableUntil,
        maxBombs: player.maxBombs,
        range: player.range,
        speedLevel: player.speedLevel,
      })),
    };
  }

  function getTiles() {
    // A copy: callers must never change the engine's board.
    return Array.from(tiles);
  }

  function getResult() {
    const alivePlayers = playerList.filter((player) => player.alive);
    if (alivePlayers.length >= 2) return null;

    return {
      winner: alivePlayers.length === 1 ? alivePlayers[0].slot : null,
      players: playerList.map((player) => ({
        slot: player.slot,
        nickname: player.nickname,
        lives: player.lives,
      })),
    };
  }

  return {
    setInput,
    placeBomb,
    removePlayer,
    step,
    getSnapshot,
    getTiles,
    getResult,
  };
}
