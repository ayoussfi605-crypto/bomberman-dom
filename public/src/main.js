// M0 smoke page. Ayoub replaces this with initUI/initGame/socket wiring in M1.
import { h, render } from "./framework/index.js";

render(h("main", { class: "starter" },
  h("h1", {}, "Bomberman DOM"),
  h("p", {}, "The development starter is ready. Multiplayer gameplay is under construction."),
  h("a", { href: "/dev/framework-check.html" }, "Run framework checks"),
), document.getElementById("app"));
