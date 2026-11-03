function clearStyle(element) {
  // Synchronize pending CSSOM writes before removing the attribute.
  if (element.hasAttribute("style")) element.removeAttribute("style");
}

function isStyleObject(value) {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function setStyleProp(element, name, value) {
  const text = value == null || value === false ? "" : String(value);
  if (name.includes("-")) {
    if (text === "") element.style.removeProperty(name);
    else element.style.setProperty(name, text);
  } else {
    element.style[name] = text;
  }
}

export default function applyStyle(element, oldStyle, newStyle) {
  if (newStyle == null || newStyle === false || newStyle === "") {
    clearStyle(element);
    return;
  }
  if (typeof newStyle === "string") {
    element.setAttribute("style", newStyle);
    return;
  }
  if (!isStyleObject(newStyle)) {
    throw new TypeError("style must be a CSS string or a plain object");
  }
  if (!isStyleObject(oldStyle)) {
    clearStyle(element);
    for (const [name, value] of Object.entries(newStyle))
      setStyleProp(element, name, value);
    return;
  }
  for (const name of Object.keys(oldStyle)) {
    if (!Object.hasOwn(newStyle, name)) setStyleProp(element, name, "");
  }
  for (const [name, value] of Object.entries(newStyle)) {
    if (oldStyle[name] !== value) setStyleProp(element, name, value);
  }
}
