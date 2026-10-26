import h from "../framework/dom/h.js";

export function NicknamePage() {
  function HandleClick() {
    console.log("Heliiii");
  }

  return h("div", { class: "container" }, [
    h("h1", { class: "nameHeader" }, ["Welcome to Bomberman!"]),
    h("p", {}, ["Enter your nickname to continue."]),
    h("input", {
      type: "text",
      id: "nickname",
      placeholder: "Enter your nickname",
    }),
    h("button", { id: "continueBtn", onClick: HandleClick }, ["Continue"]),
  ]);
}
