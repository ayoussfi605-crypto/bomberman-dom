import { h } from "../../framework/index.js";

function timerLabel(timer, count) {
  if (!timer)
    return count < 2 ? "Waiting for players…" : "Waiting for more players…";
  if (timer.kind === "wait") {
    return `Waiting for more players… Countdown begins in ${timer.secondsLeft}s`;
  }
  if (timer.kind === "start")
    return `Get ready! Starting in ${timer.secondsLeft}s`;
  return "Waiting for players…";
}

export function lobbyScreen(state) {
  const { count, max, players, timer } = state.lobby;
  const playerRows = players.map((nickname, index) =>
    h(
      "li",
      { class: "player-slot" },
      h("span", {
        class: `color-indicator p${index % 4}-bg`,
        "aria-hidden": "true",
      }),
      h("span", {}, nickname),
    ),
  );

  return h(
    "main",
    { class: "lobby-layout" },
    h(
      "section",
      { class: "screen-card lobby-card" },
      h("p", { class: "eyebrow" }, "Waiting room"),
      h("h1", { class: "screen-title" }, "Lobby"),
      h(
        "p",
        { class: "counter-badge", "aria-live": "polite" },
        `Players ${count} / ${max}`,
      ),
      h(
        "p",
        { class: "timer-badge", "aria-live": "polite" },
        timerLabel(timer, count),
      ),
      h(
        "ul",
        { class: "player-list", "aria-label": "Players in lobby" },
        ...playerRows,
      ),
    ),
  );
}
