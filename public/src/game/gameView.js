import {
  TICK_MS,
  INTERP_DELAY_MS,
  SNAPSHOT_HISTORY_MS,
  SNAPSHOT_STALE_MS,
  CORNER_BY_SLOT,
} from "/shared/constants.js";

const MAX_LERP_DISTANCE = 1.5;

let _tiles = [];
let _tilesVersion = 0;
let _you = 0;

let _localBaseTime = 0;
let _simBaseTime = 0;
let _clockSet = false;

const _snapshots = [];

const _framePlayers = [
  { slot: 0, present: false, nickname: "", x: 0, y: 0, dir: null, moving: false, alive: true, lives: 3, invulnerable: false, maxBombs: 1, range: 2, speedLevel: 0 },
  { slot: 1, present: false, nickname: "", x: 0, y: 0, dir: null, moving: false, alive: true, lives: 3, invulnerable: false, maxBombs: 1, range: 2, speedLevel: 0 },
  { slot: 2, present: false, nickname: "", x: 0, y: 0, dir: null, moving: false, alive: true, lives: 3, invulnerable: false, maxBombs: 1, range: 2, speedLevel: 0 },
  { slot: 3, present: false, nickname: "", x: 0, y: 0, dir: null, moving: false, alive: true, lives: 3, invulnerable: false, maxBombs: 1, range: 2, speedLevel: 0 },
];

const _frameResult = { tiles: _tiles, tilesVersion: _tilesVersion, players: _framePlayers };

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    _snapshots.length = 0;
    _clockSet = false;
  }
});

export function reset(startData) {
  _tiles = startData.tiles.slice();
  _tilesVersion++;
  _you = startData.you;
  _snapshots.length = 0;
  _clockSet = false;

  const bySlot = new Map((startData.players ?? []).map((p) => [p.slot, p]));

  for (let slot = 0; slot < 4; slot++) {
    const corner = CORNER_BY_SLOT[slot];
    const fp = _framePlayers[slot];
    const start = bySlot.get(slot);
    fp.slot = slot;
    fp.present = Boolean(start);
    fp.nickname = start?.nickname ?? "";
    fp.x = corner.x + 0.5;
    fp.y = corner.y + 0.5;
    fp.dir = null;
    fp.moving = false;
    fp.alive = true;
    fp.lives = 3;
    fp.invulnerable = false;
    fp.maxBombs = 1;
    fp.range = 2;
    fp.speedLevel = 0;
  }
}

export function setTiles(tiles) {
  _tiles = tiles.slice();
  _tilesVersion++;
}

export function pushSnapshot(snapshot) {
  if (_snapshots.length > 0 && snapshot.tick <= _snapshots[_snapshots.length - 1].tick) {
    return;
  }

  const receiveTime = performance.now();

  if (!_clockSet) {
    _simBaseTime = snapshot.tick * TICK_MS;
    _localBaseTime = receiveTime;
    _clockSet = true;
  }

  _snapshots.push({ tick: snapshot.tick, receiveTime, players: snapshot.players });

  const cutoff = receiveTime - SNAPSHOT_HISTORY_MS;
  while (_snapshots.length > 2 && _snapshots[0].receiveTime < cutoff) {
    _snapshots.shift();
  }
}

function copyPlayerFields(dest, src) {
  dest.dir          = src.dir;
  dest.moving       = src.moving;
  dest.alive        = src.alive;
  dest.lives        = src.lives;
  dest.invulnerable = src.invulnerable;
  dest.maxBombs     = src.maxBombs;
  dest.range        = src.range;
  dest.speedLevel   = src.speedLevel;
}

export function getFrame(nowMs) {
  _frameResult.tiles        = _tiles;
  _frameResult.tilesVersion = _tilesVersion;

  if (_snapshots.length === 0) {
    return _frameResult;
  }

  const newest = _snapshots[_snapshots.length - 1];

  if (nowMs - newest.receiveTime > SNAPSHOT_STALE_MS) {
    applySnapshot(newest);
    return _frameResult;
  }

  if (_snapshots.length === 1 || !_clockSet) {
    applySnapshot(newest);
    return _frameResult;
  }

  const target = _simBaseTime + (nowMs - _localBaseTime) - INTERP_DELAY_MS;

  const oldest = _snapshots[0];
  const oldestSimTime = oldest.tick * TICK_MS;
  const newestSimTime = newest.tick * TICK_MS;

  if (target <= oldestSimTime) {
    applySnapshot(oldest);
    return _frameResult;
  }

  if (target >= newestSimTime) {
    applySnapshot(newest);
    return _frameResult;
  }

  let snapA = oldest;
  let snapB = _snapshots[1];
  for (let i = 1; i < _snapshots.length; i++) {
    if (_snapshots[i].tick * TICK_MS >= target) {
      snapA = _snapshots[i - 1];
      snapB = _snapshots[i];
      break;
    }
  }

  const tA = snapA.tick * TICK_MS;
  const tB = snapB.tick * TICK_MS;
  const t = tB === tA ? 1 : (target - tA) / (tB - tA);

  for (let slot = 0; slot < 4; slot++) {
    const fp = _framePlayers[slot];
    fp.slot = slot;

    const pA = snapA.players.find(p => p.slot === slot);
    const pB = snapB.players.find(p => p.slot === slot);
    const pNewest = newest.players.find(p => p.slot === slot);

    if (!pNewest) {
      fp.present = false;
      continue;
    }
    fp.present = true;
    copyPlayerFields(fp, pNewest);

    if (!pA || !pB) {
      fp.x = pNewest.x;
      fp.y = pNewest.y;
      continue;
    }

    const dx = Math.abs(pB.x - pA.x);
    const dy = Math.abs(pB.y - pA.y);

    if (dx > MAX_LERP_DISTANCE || dy > MAX_LERP_DISTANCE) {
      fp.x = pNewest.x;
      fp.y = pNewest.y;
      continue;
    }

    fp.x = Math.round((pA.x + (pB.x - pA.x) * t) * 1000) / 1000;
    fp.y = Math.round((pA.y + (pB.y - pA.y) * t) * 1000) / 1000;
  }

  return _frameResult;
}

function applySnapshot(snap) {
  for (let slot = 0; slot < 4; slot++) {
    const fp = _framePlayers[slot];
    fp.slot = slot;
    const p = snap.players.find(pl => pl.slot === slot);
    if (!p) {
      fp.present = false;
      continue;
    }
    fp.present = true;
    fp.x = p.x;
    fp.y = p.y;
    copyPlayerFields(fp, p);
  }
}
