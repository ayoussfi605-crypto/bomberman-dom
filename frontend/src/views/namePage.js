import { router } from "../../main.js";
import { h } from "../framework/dom/h.js";
import { State } from "../framework/state/index.js";
import { socketConnection } from "../services/socket.js";
import { PlayerState } from "../state/PlayerState.js";

export function NamePage() {
  const playerName = new State({ name: "" });

  const error = h("p", {
    id: "name-error",
    className: "name-error",
  });

  function HandleClick(e) {
    e.preventDefault();

    const { name } = playerName.getState();
    const username = name.trim();

    if (username.length < 3) {
      error.textContent = "Username must be at least 3 characters";
      return;
    }

    if (!socketConnection.connected) {
      error.textContent = "Server connection unavailable";
      return;
    }

    socketConnection.emit("player:join", {
      username,
      playerId: username + "_123",
    });
  }

  socketConnection.off("player:joined");

  socketConnection.on("player:joined", (data) => {
    PlayerState.setState({
      name: data.player.name,
    });
    router.navigate("/lobby");
  });

  socketConnection.off("player:error");
  socketConnection.on("player:error", (message) => {
    error.textContent = message;
  });

  return h(
    "div",
    { className: "name-page" },
    h(
      "div",
      { className: "name-card" },
      h("h1", {}, "BOMBERMAN"),
      h("p", {}, "Choose your player name"),

      h(
        "div",
        { id: "name-form" },
        h("input", {
          type: "text",
          id: "player-name",
          placeholder: "Enter your username",
          minLength: 3,
          maxLength: 16,
          autocomplete: "off",
          required: true,

          onInput: (e) => {
            playerName.setState({ name: e.target.value });
            error.textContent = "";
          },
        }),

        error,

        h(
          "button",
          {
            id: "play-button",
            onClick: HandleClick,
          },
          "PLAY",
        ),
      ),
    ),
  );
}
