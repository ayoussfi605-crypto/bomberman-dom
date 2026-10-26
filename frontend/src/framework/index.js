export { addEvent, removeEvents, handleKey } from "./events/index.js";
export { createRouter } from "./router/index.js";
import { PlayerCounter } from "../services/PlayerCounter.js";
import { NicknamePage } from "../views/NicknameView.js";
import h from "./dom/h.js";
import render from "./dom/render.js";
import { createRouter } from "./router/index.js";
const container = document.getElementById("app");

const router = createRouter({
  "/": () => render(PlayerCounter(), container),
  "/name": () => render(NicknamePage(), container),
  
});

router.start();
