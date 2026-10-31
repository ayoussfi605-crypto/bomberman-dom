import { render } from "./src/framework/dom/render.js";
import { createRouter } from "./src/framework/router/index.js";
import { NamePage } from "./src/views/namePage.js";

const socket = io("http://localhost:8080");

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("player:join", "Yaacoub");
});

socket.on("player:joined", (player) => {
  console.log("Player registered:", player);
});

socket.on("player:error", (message) => {
  console.log("Registration error:", message);
});

socket.on("lobby:players", (players) => {
  console.log("Lobby players:", players);
});

const app = document.getElementById("app");

const router = createRouter({
  "/": () => render(NamePage(), app),
});

router.start();
