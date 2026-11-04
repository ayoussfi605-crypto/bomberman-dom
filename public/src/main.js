// M0 smoke page. Ayoub replaces this with initUI/initGame/socket wiring in M1.
import { h, render } from "./framework/index.js";
import { createSocket } from "./net/socket.js";

const socket = createSocket();

socket.connect();

function Handleclick() {
  console.log("click");

  socket.send("join", { nickname: "heloo" });
}

function HandleSendMessage() {
  socket.send("chat", { text: "fiiiine" });
}
//

render(
  h(
    "main",
    { class: "starter" },
    h("h1", {}, "Bomberman DOM"),
    h(
      "p",
      {},
      "The development starter is ready. Multiplayer gameplay is under construction.",
    ),
    h("button", { onClick: Handleclick }, "Run framework checks"),
    h("button", { onClick: HandleSendMessage }, "send Message"),
  ),
  document.getElementById("app"),
);
