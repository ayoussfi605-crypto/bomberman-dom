import h from "../framework/dom/h.js";
import { send } from "../services/websocket.js";
import { gameState } from "../state/gameState.js";
import {router} from "../framework/index.js";

export function NicknamePage() {
  function HandleInput(event) {
    gameState.setState({
      nickname: event.target.value,
    });
  }

  function HandleClick() {
    const name = gameState.getState().nickname.trim();

    if (!name) {
      console.log("Please enter your nickname.");
      return;
    }

    gameState.setState({ nickname: name });

    send("join", { nickname: name });
    router.navigate("/lobby");
  }

  return h("div", { class: "container" }, [
    h("h1", { class: "nameHeader" }, ["Welcome to Bomberman!"]),
    h("p", {}, ["Enter your nickname to continue."]),
    h("input", {
      type: "text",
      id: "nickname",
      placeholder: "Enter your nickname",
      onInput: HandleInput,
    }),
    h("button", { id: "continueBtn", onClick: HandleClick }, ["Continue"]),
  ]);
}
