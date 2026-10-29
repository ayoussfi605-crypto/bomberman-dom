import h from "../framework/dom/h.js";
import { on, send, connect } from "../services/websocket.js";
import { gameState } from "../state/gameState.js";
import { router } from "../framework/index.js";
import { notify } from "../components/Notification.js";

export function NicknamePage() {
  function HandleInput(event) {
    gameState.setState({
      nickname: event.target.value,
    });
  }

  function HandleJoin(payload) {
    console.log("Joined successfully:", payload);
    notify("you are in room now", "info", 1000);
    router.navigate("/lobby");
  }

  function HandleClick() {
    const name = gameState.getState().nickname.trim();

    if (!name) {
      console.log("Please enter your nickname.");
      return;
    }

    gameState.setState({ nickname: name });

    if (!send("join", { nickname: name })) {
      console.error("WebSocket is not connected.");
    }
    on("joined", HandleJoin);
  }

  // Start or reuse the WebSocket connection.
  connect();

  return h("div", { class: "container" }, [
    h("h1", { class: "nameHeader" }, ["Welcome to Bomberman!"]),

    h("p", {}, ["Enter your nickname to continue."]),

    h("input", {
      type: "text",
      id: "nickname",
      placeholder: "Enter your nickname",
      maxLength: 16,
      onInput: HandleInput,
    }),

    h(
      "button",
      {
        id: "continueBtn",
        onClick: HandleClick,
      },
      ["Continue"],
    ),
  ]);
}
