import { h } from "../../framework/index.js";

// The header is static content, so build its vnode once and reuse the
// identical object on every render: patch() then skips it entirely.
let _cachedHeader = null;

export function headerVNode() {
  if (_cachedHeader !== null) return _cachedHeader;
  _cachedHeader = h("header", { class: "site-header" },
    h("span", { class: "header-bomb", "aria-hidden": "true" },
      h("span", { class: "bomb-spark" }),
    ),
    h("span", { class: "header-title" }, "BOMBERMAN"),
    h("span", { class: "header-sub" }, "DOM"),
  );
  return _cachedHeader;
}
