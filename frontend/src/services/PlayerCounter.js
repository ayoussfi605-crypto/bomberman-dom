import h from "../framework/dom/h.js";
import { gameState } from "../state/gameState.js";

export function PlayerCounter() {


  const name = gameState.getState().nickname.trim()
  console.log(name);
  
  return h("h1", { class: "playerCounter" }, "this is player counter function");
}
