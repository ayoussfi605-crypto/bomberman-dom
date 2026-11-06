import { h, render } from "../framework/index.js";
import * as gameView from "./gameView.js";
import { getTilesVNode, getPlayersVNode } from "./boardView.js";

let _running = false;
let _rafId = null;
let _store = null;
let _fpsMeter = null;
let _chatPanel = null;
let _perfOverlay = null;

export function init({ store, fpsMeter, chatPanel, perfOverlay }) {
  _store = store;
  _fpsMeter = fpsMeter;
  _chatPanel = chatPanel;
  _perfOverlay = perfOverlay;
}

function gameScreen(f) {
  const state = _store.getState();
  const tilesVNode   = getTilesVNode(f);
  const playersVNode = getPlayersVNode(f);
  const chatVNode    = _chatPanel(state.chat);
  const perf         = _perfOverlay();

  return h("div", { class: "game" },
    h("div", { class: "board" }, tilesVNode, playersVNode),
    chatVNode,
    perf,
  );
}

function frame(now) {
  if (!_running) return;
  _fpsMeter.frame(now);
  const f = gameView.getFrame(now);
  render(gameScreen(f), document.getElementById("app"));
  if (_running) _rafId = requestAnimationFrame(frame);
}

export function start() {
  if (_running) return;
  _running = true;
  _rafId = requestAnimationFrame(frame);
}

export function stop() {
  _running = false;
  cancelAnimationFrame(_rafId);
  _rafId = null;
}
