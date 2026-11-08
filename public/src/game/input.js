import { listen } from "../framework/index.js";

const DIR_CODES = {
  ArrowUp: "up",   KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

const PREVENT_CODES = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);

let _socket = null;
let _store  = null;
let _alive  = true;

const _held = [];
let _lastDir = null;

function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

function canSend() {
  if (!_store || !_socket) return false;
  const s = _store.getState();
  return s.screen === "game" && _alive;
}

// Called by the render loop from the latest snapshot frame: a dead
// (spectating) player must not send movement or bomb messages.
export function setAlive(alive) {
  _alive = Boolean(alive);
  if (!_alive) {
    clearHeld();
    sendDir(null);
  }
}

function effectiveDir() {
  for (let i = _held.length - 1; i >= 0; i--) {
    const d = DIR_CODES[_held[i]];
    if (d) return d;
  }
  return null;
}

function sendDir(dir) {
  if (dir === _lastDir) return;
  _lastDir = dir;
  if (canSend()) _socket.send("input", { dir });
}

function clearHeld() {
  _held.length = 0;
}

export function resetDir() {
  _alive = true;
  const prev = _lastDir;
  _lastDir = null;
  clearHeld();
  if (prev !== null && _socket) _socket.send("input", { dir: null });
}

const onKeyDown = function (e) {
  if (PREVENT_CODES.has(e.code) && canSend()) e.preventDefault();
  if (e.repeat) return;
  if (isEditable(e.target)) return;

  if (e.code === "Enter") {
    sendDir(null);
    document.getElementById("chat-input")?.focus();
    return;
  }

  if (e.code === "Space") {
    if (canSend()) _socket.send("bomb", {});
    return;
  }

  if (DIR_CODES[e.code]) {
    _held.push(e.code);
    sendDir(effectiveDir());
  }
};

const onKeyUp = function (e) {
  const idx = _held.lastIndexOf(e.code);
  if (idx !== -1) _held.splice(idx, 1);
  if (DIR_CODES[e.code]) sendDir(effectiveDir());
};

const onBlur = function () {
  clearHeld();
  sendDir(null);
};

const onFocusIn = function (e) {
  if (isEditable(e.target)) {
    clearHeld();
    sendDir(null);
  }
};

const onVisChange = function () {
  if (document.hidden) {
    clearHeld();
    sendDir(null);
  }
};

let _unsubs = [];

export function init({ socket, store }) {
  _socket = socket;
  _store  = store;
  _unsubs = [
    listen(window,   "keydown",          onKeyDown),
    listen(window,   "keyup",            onKeyUp),
    listen(window,   "blur",             onBlur),
    listen(document, "visibilitychange", onVisChange),
    listen(document, "focusin",          onFocusIn),
  ];
}

export function cleanup() {
  _unsubs.forEach(fn => fn());
  _unsubs = [];
  clearHeld();
  _lastDir = null;
}
