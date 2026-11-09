import { h, render } from "../framework/index.js";
import { chatSidebar } from "./components/chatPanel.js";
import { nicknameScreen } from "./screens/nickname.js";
import { lobbyScreen } from "./screens/lobby.js";
import { overScreen } from "./screens/over.js";

let joinAction = () => {};
let replayAction = () => {};
let container = null;

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
    ),
    container,
  );
}

export function initRenderer(store, actions) {
  configureRenderActions(actions);
  const unsubscribe = store.subscribe(renderApp);
  renderApp(store.getState());
  return unsubscribe;
}
