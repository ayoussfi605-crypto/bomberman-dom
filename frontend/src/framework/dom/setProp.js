import { addEvent } from "../events/index.js";

export default function addprop(vnode, element) {
  if (!vnode.props) return element;

  for (const [key, value] of Object.entries(vnode.props)) {
    if (key === "key") continue;

    // Attach custom events
    if (key.startsWith("on")) {
      addEvent(element, key, value);
      continue;
    }

    // Handle live form properties
    if (key === "value" && "value" in element) {
      element.value = value == null ? "" : String(value);
      continue;
    }

    if (key === "checked" && "checked" in element) {
      element.checked = Boolean(value);
      continue;
    }

    if (key === "selected" && "selected" in element) {
      element.selected = Boolean(value);
      continue;
    }

    // Handle standard HTML attributes
    if (value == null || value === false) {
      element.removeAttribute(key);
      continue;
    }

    if (value === true) {
      element.setAttribute(key, "");
    } else {
      element.setAttribute(key, String(value));
    }
  }

  return element;
}