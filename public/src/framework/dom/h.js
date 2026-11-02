import normalizeChildren from "./normalize.js";

export default function h(type, props, ...children) {
  if (typeof type !== "string" || type.trim() === "") {
    throw new TypeError("h(): type must be a non-empty string");
  }

  if (props == null) {
    props = {};
  }

  if (typeof props !== "object" || Array.isArray(props)) {
    throw new TypeError("h(): props must be a plain object or null");
  }

  const prototype = Object.getPrototypeOf(props);

  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("h(): props must be a plain object or null");
  }

  return {
    type,
    props,
    children: normalizeChildren(children),
  };
}
