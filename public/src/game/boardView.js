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

// Per-slot vnode cache: returning the identical vnode object lets patch()
// skip the player subtree entirely when transform + class are unchanged,
// instead of walking and re-styling it every frame.
const _lastTransform = ["", "", "", ""];
const _lastClass = ["", "", "", ""];
const _lastPlayerVNode = [null, null, null, null];

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

  if (p == null || p.present === false) {
    const hiddenClass = `player p${slot}`;
    if (_lastPlayerVNode[slot] && _lastClass[slot] === hiddenClass && _lastTransform[slot] === "hidden") {
      return _lastPlayerVNode[slot];
    }
    _lastClass[slot] = hiddenClass;
    _lastTransform[slot] = "hidden";
    _lastPlayerVNode[slot] = h("div", { class: hiddenClass, hidden: true });
    return _lastPlayerVNode[slot];
  }

  const tx = `translate3d(calc(var(--tile) * ${(p.x - 0.5).toFixed(3)}), calc(var(--tile) * ${(p.y - 0.5).toFixed(3)}), 0)`;
  const cls = buildPlayerClass(slot, p);
  if (_lastPlayerVNode[slot] && _lastTransform[slot] === tx && _lastClass[slot] === cls) {
    return _lastPlayerVNode[slot];
  }
  _lastTransform[slot] = tx;
  _lastClass[slot] = cls;
  _lastPlayerVNode[slot] = h("div", {
    class: cls,
    style: { transform: tx },
  });
  return _lastPlayerVNode[slot];
}

let _playersVNode = null;

export function getPlayersVNode(frame) {
  const first = playerVNode(0, frame);
  const second = playerVNode(1, frame);
  const third = playerVNode(2, frame);
  const fourth = playerVNode(3, frame);
  if (
    _playersVNode &&
    _playersVNode.children[0] === first &&
    _playersVNode.children[1] === second &&
    _playersVNode.children[2] === third &&
    _playersVNode.children[3] === fourth
  ) {
    return _playersVNode;
  }
  _playersVNode = h("div", { class: "players" }, first, second, third, fourth);
  return _playersVNode;
}
