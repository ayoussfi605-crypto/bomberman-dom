import { render } from "./src/framework/dom/render.js";
import { createRouter } from "./src/framework/router/index.js";
import { socketConnection } from "./src/services/socket.js";
import { LobbyPage } from "./src/views/lobbyPage.js";
import { NamePage } from "./src/views/namePage.js";

socketConnection.on("connect", () => {
  const token = localStorage.getItem("token");
  if (token) {
    socketConnection.emit("player:reconnect", { token });
  }
  console.log("Connected: form main", socketConnection.id);
  router.navigate("/");
});

socketConnection.on("player:error", (message) => {
  console.log("Registration error: from main", message);
});

socketConnection.on("lobby:players", (players) => {
  console.log("Lobby players: from main", players);
});

const app = document.getElementById("app");

export const router = createRouter({
  "/": () => render(NamePage(), app),
  "/lobby": () => render(LobbyPage(), app),
});

router.start();
