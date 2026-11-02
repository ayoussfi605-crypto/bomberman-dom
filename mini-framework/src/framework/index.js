// Public entry point for the Mini Framework.
// Application code should import from this file instead of reaching into
// individual modules.

export { default as h } from "./dom/h.js";
export { default as normalizeChildren } from "./dom/normalize.js";
export { default as createDom } from "./dom/createDom.js";
export { default as patch } from "./dom/patch.js";
export { default as render } from "./dom/render.js";

export { State } from "./state/index.js";
export { addEvent, removeEvent, removeEvents, handleKey } from "./events/index.js";
export { createRouter } from "./router/index.js";
