import { h } from "../framework/dom/h.js";
import { PlayerState } from "../state/PlayerState.js";
import { CountdownState } from "../state/CountdownState.js";

export function LobbyPage() {
  const { players } = PlayerState.getState();
  const { time } = CountdownState.getState();

  return h(
    "section",
    { class: "lobby-page" },

    h("h1", {}, "Bomberman Lobby"),

    h(
      "div",
      { class: "player-counter" },
      h("h2", {}, "Players"),
      h("p", {}, `${players.length} / 4 players`),
    ),

    h(
      "h2",
      {},
      time === null ? "Waiting for countdown..." : `Starting in ${time}`,
    ),

    h(
      "table",
      { class: "player-table" },
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          h("th", {}, "#"),
          h("th", {}, "Player Name"),
          h("th", {}, "Lives"),
          h("th", {}, "Status"),
        ),
      ),

      h(
        "tbody",
        {},
        ...players.map((player, index) =>
          h(
            "tr",
            { key: player.playerId },
            h("td", {}, String(index + 1)),
            h("td", {}, player.name),
            h("td", {}, String(player.lives)),
            h("td", {}, player.connected ? "Connected" : "Disconnected"),
          ),
        ),
      ),
    ),

    players.length === 0 ? h("p", {}, "Waiting for players...") : null,
  );
}
