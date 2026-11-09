import { h, render } from "../framework/index.js";
import { chatSidebar } from "./components/chatPanel.js";
import { nicknameScreen } from "./screens/nickname.js";
import { lobbyScreen } from "./screens/lobby.js";
import { overScreen } from "./screens/over.js";
import { perfOverlay } from "../perf/perfOverlay.js";
import { fpsMeter } from "../perf/fpsMeter.js";

let joinAction = () => {};
let replayAction = () => {};
let container = null;
let currentStore = null;
let perfFrame = null;
let lastPerfRender = 0;
const debugEnabled = new URLSearchParams(globalThis.location?.search ?? "").has(
  "debug",
);

function runPerfFrame(now) {
  perfFrame = null;
  const state = currentStore?.getState();
  if (!state || state.screen === "game") return;

  fpsMeter.frame(now);
  if (now - lastPerfRender >= 250) {
    lastPerfRender = now;
    renderApp(state);
  }
  perfFrame = requestAnimationFrame(runPerfFrame);
}

function startPerfFrames() {
  if (
    debugEnabled &&
    perfFrame === null &&
    currentStore?.getState().screen !== "game"
  ) {
    perfFrame = requestAnimationFrame(runPerfFrame);
  }
}

export function configureRenderActions({ onJoin, onReplay }) {
  joinAction = onJoin;
  replayAction = onReplay;
}

export function renderApp(state) {
  if (state.screen === "game") return;
  if (!container) container = document.getElementById("app");
  if (!container) return;

  let screen;
  switch (state.screen) {
    case "nickname":
      screen = nicknameScreen(state, joinAction);
      break;
    case "lobby":
      screen = lobbyScreen(state);
      break;
    case "over":
      screen = overScreen(state, replayAction);
      break;
    default:
      screen = nicknameScreen(state, joinAction);
  }
  render(
    h(
      "div",
      { class: "app-shell" },
      screen,
      chatSidebar(state.chat),
      perfOverlay(),
    ),
    container,
  );
}

export function initRenderer(store, actions) {
  configureRenderActions(actions);
  currentStore = store;
  const unsubscribe = store.subscribe((state) => {
    renderApp(state);
    startPerfFrames();
  });
  renderApp(store.getState());
  startPerfFrames();
  return () => {
    unsubscribe();
    if (perfFrame !== null) cancelAnimationFrame(perfFrame);
    perfFrame = null;
    currentStore = null;
  };
}
