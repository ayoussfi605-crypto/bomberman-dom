import { h } from "../framework/index.js";
import { COLS, ROWS } from "/shared/constants.js";

const TILE_CLASS = [
  "cell t-floor",
  "cell t-wall",
  "cell t-block",
  "cell t-bomb",
  "cell t-flame",
  "cell t-pu-bomb",
  "cell t-pu-flame",
  "cell t-pu-speed",
];

let _tilesVNode = null;
let _tilesVersion = -1;

function buildTilesVNode(tiles) {
  const cells = new Array(COLS * ROWS);
  for (let i = 0; i < cells.length; i++) {
    cells[i] = h("div", { class: TILE_CLASS[tiles[i]] ?? "cell t-floor" });
  }
  return h("div", { class: "tiles" }, ...cells);
}

export function getTilesVNode(frame) {
  if (frame.tilesVersion === _tilesVersion && _tilesVNode !== null) {
    return _tilesVNode;
  }
  _tilesVNode = buildTilesVNode(frame.tiles);
  _tilesVersion = frame.tilesVersion;
  return _tilesVNode;
}

const _lastTransform = ["", "", "", ""];

function buildPlayerClass(slot, p) {
  let cls = `player p${slot}`;
  if (!p.alive)       cls += " dead";
  if (p.invulnerable) cls += " invulnerable";
  if (p.moving)       cls += " moving";
  if (p.dir)          cls += ` dir-${p.dir}`;
  return cls;
}

function playerVNode(slot, frame) {
  const p = frame.players.find(pl => pl.slot === slot);

  if (p == null) {
    return h("div", { class: `player p${slot}`, hidden: true });
  }

  const tx = `translate3d(calc(var(--tile) * ${(p.x - 0.5).toFixed(3)}), calc(var(--tile) * ${(p.y - 0.5).toFixed(3)}), 0)`;
  if (tx !== _lastTransform[slot]) _lastTransform[slot] = tx;

  return h("div", {
    class: buildPlayerClass(slot, p),
    style: { transform: _lastTransform[slot] },
  });
}

export function getPlayersVNode(frame) {
  return h("div", { class: "players" },
    playerVNode(0, frame),
    playerVNode(1, frame),
    playerVNode(2, frame),
    playerVNode(3, frame),
  );
}
