import { render } from "./src/framework/dom/render.js";
import { createRouter } from "./src/framework/router/index.js";
import { NamePage } from "./src/views/namePage.js";

const app = document.getElementById("app");

const router = createRouter({
  "/": () => render(NamePage(), app),
});

router.start();
