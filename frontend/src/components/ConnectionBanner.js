import h from "../framework/dom/h.js";

export function ConnectionBanner() {
  return h(
    "div",
    {
      class: "connection-banner is-connecting",
      id: "connection-banner",
      role: "status",
      "aria-live": "polite",
    },
    [
      h("span", { class: "connection-banner__dot" }, []),
      h("span", { class: "connection-banner__text" }, [
        "Connecting to game server...",
      ]),
    ],
  );
}
