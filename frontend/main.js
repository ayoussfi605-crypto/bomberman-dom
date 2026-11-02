import { render } from "./src/framework/dom/render.js";
import { createRouter } from "./src/framework/router/index.js";
import { socketConnection } from "./src/services/socket.js";
import { PlayerState } from "./src/state/PlayerState.js";
import { LobbyPage } from "./src/views/lobbyPage.js";
import { MatchPage } from "./src/views/matche.js";
import { NamePage } from "./src/views/namePage.js";
import { CountdownState } from "./src/state/CountdownState.js";

const app = document.getElementById("app");

export const router = createRouter({
  "/": () => render(NamePage(), app),
  "/lobby": () => render(LobbyPage(), app),
  "/match": () => render(MatchPage(), app),
});

socketConnection.on("connect", () => {
  console.log("Connected:", socketConnection.id);
  router.navigate("/");
});

socketConnection.on("player:error", (message) => {
  console.log("Registration error:", message);
});

socketConnection.on("game:start", (data) => {
  router.navigate("/match");
  console.log(data);
});

socketConnection.on("lobby:players", (players) => {
  PlayerState.setState({ players });
});

let countdownInterval = null;

socketConnection.on("lobby:count", (time) => {
  // Cancel the previous countdown
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
  }

  // Start the new countdown
  let remainingTime = time;

  CountdownState.setState({ time: remainingTime });

  countdownInterval = setInterval(() => {
    remainingTime--;

    CountdownState.setState({ time: remainingTime });

    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      socketConnection.emit("counter:end", () => {
        {
          ("end");
        }
      });
      countdownInterval = null;
    }
  }, 1000);
});

socketConnection.on("lobby:start", () => {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  router.navigate("/match");
});

CountdownState.subscribe(() => {
  if (window.location.hash === "#/lobby") {
    render(LobbyPage(), app);
  }
});

PlayerState.subscribe(() => {
  if (window.location.hash === "#/lobby") {
    render(LobbyPage(), app);
  }
});

socketConnection.on("lobby:countdown-cancelled", () => {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  CountdownState.setState({ time: null });
});

PlayerState.subscribe(() => {
  if (window.location.hash === "#/lobby") {
    render(LobbyPage(), app);
  }
});

router.start();
