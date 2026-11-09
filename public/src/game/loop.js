import { h, render } from "../framework/index.js";
import * as gameView from "./gameView.js";
import { getTilesVNode, getPlayersVNode } from "./boardView.js";
import { hudVNode as renderHud } from "./hud.js";
import { setAlive as setInputAlive } from "./input.js";
import { headerVNode } from "../ui/components/header.js";
import { chatSidebar } from "../ui/components/chatPanel.js";

let _running = false;
let _rafId = null;
let _container = null;
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

// The chat vnode is cached by the chat array reference (ARCHITECTURE §7.5):
// rebuilding it every frame would diff the whole chat tree at 60 fps.
let _cachedChat = null;
let _cachedChatVNode = null;

function chatVNodeFor(chat) {
  if (chat !== _cachedChat) {
    _cachedChat = chat;
    _cachedChatVNode = chatSidebar(chat, _chatPanel);
  }
  return _cachedChatVNode;
}

function gameScreen(f) {
  const state = _store.getState();
  const hud = renderHud(f, state.me?.slot);
  const tilesVNode = getTilesVNode(f);
  const playersVNode = getPlayersVNode(f);
  const chatVNode = chatVNodeFor(state.chat);
  const perf = _perfOverlay();

  return h(
    "div",
    { class: "game-page" },
    headerVNode(),
    h(
      "div",
      { class: "game" },
      hud,
      h("div", { class: "board" }, tilesVNode, playersVNode),
      perf,
    ),
    chatVNode,
  );
}

function frame(now) {
  if (!_running) return;
  _fpsMeter.frame(now);
  const f = gameView.getFrame(now);
  // Dead players must not send input/bombs (server also ignores them).
  const me = f.players.find((p) => p.slot === _store.getState().me?.slot);
  setInputAlive(!me || me.alive !== false);
  if (!_container) _container = document.getElementById("app");
  render(gameScreen(f), _container);
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
