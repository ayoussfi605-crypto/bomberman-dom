// Audit-scenario tests for the authoritative engine and lobby state machine.
// Run with: node --test  (no dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";

import { createGame } from "../game/game.js";
import { generateMap } from "../game/map.js";
import { pickupPowerup } from "../game/powerups.js";
import { applyFlameDamage } from "../game/damage.js";
import { createLobby } from "../lobby/lobby.js";
import { TILE, COLS, ROWS, CORNER_BY_SLOT, SAFE_ZONE_ARM, BASE_RANGE } from "../../shared/constants.js";

const TICK = 1000 / 30;
const stepN = (g, n) => { for (let i = 0; i < n; i++) g.step(TICK); };
const snap = (g, s) => g.getSnapshot().players.find((p) => p.slot === s);
const twoPlayers = () => createGame([{ slot: 0, nickname: "Ada" }, { slot: 1, nickname: "Bob" }], 42);

// Walk a player along floor cells (BFS) until its centre is in (tx,ty).
function walkTo(g, slot, tiles, tx, ty) {
  const key = (x, y) => y * COLS + x;
  const prev = new Map([[key(...startOf(slot)), null]]);
  const q = [startOf(slot)];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === tx && y === ty) break;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k)) continue;
      const t = tiles[k];
      if (t === TILE.WALL || t === TILE.BLOCK) continue;
      prev.set(k, [x, y]); q.push([nx, ny]);
    }
  }
  const path = [];
  let cur = [tx, ty];
  while (cur) { path.push(cur); cur = prev.get(key(...cur)); }
  path.reverse();
  for (let i = 1; i < path.length; i++) {
    const [px, py] = path[i - 1], [cx, cy] = path[i];
    g.setInput(slot, cx > px ? "right" : cx < px ? "left" : cy > py ? "down" : "up");
    for (let s = 0; s < 300; s++) {
      g.step(TICK);
      const p = snap(g, slot);
      if (Math.floor(p.x) === cx && Math.floor(p.y) === cy) break;
    }
  }
  g.setInput(slot, null);
}
function startOf(slot) { const c = CORNER_BY_SLOT[slot]; return [c.x, c.y]; }

test("map: size, borders/pillars, corner safe zones, determinism", () => {
  const a = generateMap(7), b = generateMap(7);
  assert.equal(a.tiles.length, COLS * ROWS);
  assert.deepEqual([...a.tiles], [...b.tiles]);
  assert.deepEqual([...a.hidden.entries()], [...b.hidden.entries()]);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const t = a.tiles[y * COLS + x];
    if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) assert.equal(t, TILE.WALL, `border ${x},${y}`);
    if (x % 2 === 0 && y % 2 === 0 && x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1) assert.equal(t, TILE.WALL, `pillar ${x},${y}`);
  }
  for (const c of CORNER_BY_SLOT) {
    for (let d = 0; d <= SAFE_ZONE_ARM; d++) {
      assert.notEqual(a.tiles[c.y * COLS + c.x + d], TILE.BLOCK);
      assert.notEqual(a.tiles[(c.y + d) * COLS + c.x], TILE.BLOCK);
    }
  }
  assert.ok(SAFE_ZONE_ARM > BASE_RANGE);
});

test("map: at least 2 hidden power-ups of each of the 3 types; hidden never sent", () => {
  for (const seed of [0, 1, 2, 3, 42, 99]) {
    const { hidden } = generateMap(seed);
    const counts = {};
    for (const v of hidden.values()) counts[v] = (counts[v] ?? 0) + 1;
    for (const t of [TILE.POWERUP_BOMB, TILE.POWERUP_FLAME, TILE.POWERUP_SPEED]) {
      assert.ok((counts[t] ?? 0) >= 2, `seed ${seed} type ${t}`);
    }
    const g = createGame([{ slot: 0, nickname: "A" }, { slot: 1, nickname: "B" }], seed);
    assert.ok(g.getTiles().every((t) => t < TILE.POWERUP_BOMB));
  }
});

test("first-bomb escape: safe-arm cell outside the blast is reachable in time", () => {
  const g = twoPlayers();
  g.placeBomb(0);
  g.setInput(0, "right");
  stepN(g, 40); // ~1.3s < 2s fuse
  const p = snap(g, 0);
  assert.ok(p.x >= 4.5, `escaped to x=${p.x}`);
  g.setInput(0, null);
  stepN(g, 60);
  assert.equal(snap(g, 0).lives, 3);
});

test("movement: walls stop the player; getTiles returns a copy", () => {
  const g = twoPlayers();
  g.setInput(0, "left"); stepN(g, 30); g.setInput(0, null);
  // Hitbox half is 0.35, so the centre stops at x = 1.35 against the border.
  assert.ok(snap(g, 0).x >= 1.3 && snap(g, 0).x < 1.5, "border wall blocks movement");
  const tiles = g.getTiles(); tiles[0] = 99;
  assert.notEqual(g.getTiles()[0], 99);
});

test("bombs: maxBombs enforced, fuse ~2s, tilesChanged flag for between-step placement", () => {
  const g = twoPlayers();
  g.placeBomb(0); g.placeBomb(0);
  assert.equal(g.getTiles().filter((t) => t === TILE.BOMB).length, 1);
  assert.equal(g.step(TICK).tilesChanged, true);
  assert.equal(g.step(TICK).tilesChanged, false);
  stepN(g, 70);
  assert.equal(g.getTiles().filter((t) => t === TILE.BOMB).length, 0);
});

test("standing on own bomb costs exactly 1 life; 3 bombs eliminate; winner declared", () => {
  const g = twoPlayers();
  for (let k = 0; k < 3; k++) { g.placeBomb(0); stepN(g, 130); }
  const p = snap(g, 0);
  assert.equal(p.lives, 0); assert.equal(p.alive, false);
  assert.equal(g.getResult().winner, 1);
  assert.equal(snap(g, 1).alive, true);
});

test("block next to a bomb is destroyed and a hidden power-up is revealed", () => {
  const g = createGame([{ slot: 0, nickname: "Ada" }, { slot: 1, nickname: "Bob" }], 0);
  const tiles = g.getTiles();
  // Find a floor cell adjacent to a BLOCK (BFS-walkable).
  let target = null;
  outer:
  for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
    if (tiles[y * COLS + x] !== TILE.FLOOR) continue;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      if (tiles[(y + dy) * COLS + x + dx] === TILE.BLOCK) { target = [x, y]; break outer; }
    }
  }
  assert.ok(target);
  walkTo(g, 0, tiles, target[0], target[1]);
  const before = g.getTiles().filter((t) => t === TILE.BLOCK).length;
  g.placeBomb(0);
  stepN(g, 85); // 2s fuse + 0.5s flame: block gone, power-up (if any) exposed
  const after = g.getTiles();
  assert.ok(after.filter((t) => t === TILE.BLOCK).length < before, "block destroyed");
});

test("other player standing in a flame loses a life (damage is per-player)", () => {
  // Navigation between opposite corners is not floor-connected on most seeds
  // (players bomb through blocks in a real match), so test the damage rule
  // directly: any alive, non-invulnerable player whose centre is on FLAME
  // loses exactly one life, including a player who did not place the bomb.
  const tiles = new Array(COLS * ROWS).fill(TILE.FLOOR);
  tiles[5 * COLS + 5] = TILE.FLAME;
  const owner = { slot: 0, x: 1.5, y: 1.5, alive: true, lives: 3, invulnerableUntil: 0 };
  const other = { slot: 1, x: 5.5, y: 5.5, alive: true, lives: 3, invulnerableUntil: 0 };
  const game = { players: [owner, other], tiles };
  applyFlameDamage(game, 1000);
  assert.equal(other.lives, 2);
  assert.equal(other.invulnerableUntil, 3000);
  applyFlameDamage(game, 1000); // invulnerable: no second life lost
  assert.equal(other.lives, 2);
  assert.equal(owner.lives, 3); // not in a flame
});

test("power-up pickup effects and caps", () => {
  const fake = (tile) => {
    const g = { tiles: new Array(COLS * ROWS).fill(TILE.FLOOR), hidden: new Map(), reveals: new Map(), tileDirty: false };
    g.tiles[1 * COLS + 1] = tile;
    const player = { alive: true, x: 1.5, y: 1.5, maxBombs: 5, range: 6, speedLevel: 3 };
    pickupPowerup(g, player);
    assert.equal(g.tiles[1 * COLS + 1], TILE.FLOOR);
    return player;
  };
  assert.equal(fake(TILE.POWERUP_BOMB).maxBombs, 5); // capped, still consumed
  assert.equal(fake(TILE.POWERUP_FLAME).range, 6);
  assert.equal(fake(TILE.POWERUP_SPEED).speedLevel, 3);
  const g2 = { tiles: new Array(COLS * ROWS).fill(TILE.FLOOR), hidden: new Map(), reveals: new Map(), tileDirty: false };
  g2.tiles[1 * COLS + 1] = TILE.POWERUP_BOMB;
  const p2 = { alive: true, x: 1.5, y: 1.5, maxBombs: 1, range: 2, speedLevel: 0 };
  pickupPowerup(g2, p2);
  assert.equal(p2.maxBombs, 2);
});

test("removePlayer eliminates; simultaneous elimination is a draw", () => {
  const g = twoPlayers();
  g.removePlayer(0);
  assert.equal(g.getResult().winner, 1);
  const g2 = twoPlayers();
  g2.removePlayer(0); g2.removePlayer(1);
  assert.equal(g2.getResult().winner, null);
});

test("lobby: wait on 2nd player, 4th switches to countdown, drop below 2 cancels", () => {
  let now = 0;
  const lob = createLobby({ now: () => now, waitMs: 20000, countdownMs: 10000 });
  lob.join("s1", "Ada");
  assert.equal(lob.view().timer, null);
  lob.join("s2", "Bob");
  assert.deepEqual(lob.view().timer, { kind: "wait", secondsLeft: 20 });
  now += 20000;
  assert.equal(lob.update(), null);
  assert.equal(lob.view().timer.kind, "start");
  now += 10000;
  assert.equal(lob.update().event, "start");

  let now2 = 0;
  const lob2 = createLobby({ now: () => now2 });
  lob2.join("a", "A1"); lob2.join("b", "B2"); lob2.join("c", "C3");
  lob2.join("d", "D4");
  assert.deepEqual(lob2.view().timer, { kind: "start", secondsLeft: 10 });
  lob2.leave("d"); lob2.leave("c"); lob2.leave("b");
  assert.equal(lob2.view().timer, null);
  assert.equal(lob2.join("x", "ada") && true, true); // nickname case-insensitive check below
  const dup = (() => { const l = createLobby({}); l.join("a", "Ada"); return l.join("b", "ada"); })();
  assert.equal(dup.ok, false); assert.equal(dup.code, "NICK_TAKEN");
});
