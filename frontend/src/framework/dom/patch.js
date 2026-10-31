import createDom from "./createDom.js";
import { addEvent, removeEvents } from "../events/index.js";

function updateProps(element, oldProps = {}, newProps = {}) {
  const keys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  for (const key of keys) {
    const oldValue = oldProps[key];
    const newValue = newProps[key];

    if (oldValue === newValue) continue;
    if (key === "key") continue;

    if (key.startsWith("on")) {
      addEvent(element, key, newValue);
      continue;
    }

    if (key === "value" && "value" in element) {
      const value = newValue == null ? "" : String(newValue);

      if (element.value !== value) {
        element.value = value;
      }

      continue;
    }

    if (key === "checked" && "checked" in element) {
      element.checked = Boolean(newValue);
      continue;
    }

    if (key === "selected" && "selected" in element) {
      element.selected = Boolean(newValue);
      continue;
    }
    if (newValue == null || newValue === false) {
      element.removeAttribute(key);
      continue;
    }

    if (newValue === true) {
      element.setAttribute(key, "");
      continue;
    }

    element.setAttribute(key, String(newValue));
  }
}

// Reconcile a list of children positionally inside `parent`.
function patchChildren(parent, oldChildren = [], newChildren = []) {
  const sharedLength = Math.min(oldChildren.length, newChildren.length);

  for (let i = 0; i < sharedLength; i++) {
    updateDOM(parent, newChildren[i], oldChildren[i], i);
  }

  for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
    const childToRemove = parent.childNodes[i];
    if (childToRemove) {
      removeEvents(childToRemove);
      parent.removeChild(childToRemove);
    }
  }

  for (let i = oldChildren.length; i < newChildren.length; i++) {
    parent.appendChild(createDom(newChildren[i]));
  }
}

function updateDOM(parent, newVNode, oldVNode, index = 0) {
  const current = parent.childNodes[index];

  if (newVNode == null) {
    if (current) {
      removeEvents(current); 
      parent.removeChild(current);
    }
    return;
  }

  if (oldVNode == null) {
    parent.insertBefore(createDom(newVNode), current ?? null);
    return;
  }

  const newIsPrimitive =
    typeof newVNode === "string" || typeof newVNode === "number";

  const oldIsPrimitive =
    typeof oldVNode === "string" || typeof oldVNode === "number";

  if (newIsPrimitive || oldIsPrimitive) {
    if (
      newIsPrimitive &&
      oldIsPrimitive &&
      typeof newVNode === typeof oldVNode
    ) {
      if (String(newVNode) !== String(oldVNode)) {
        current.nodeValue = String(newVNode);
      }
    } else {
      removeEvents(current); 
      parent.replaceChild(createDom(newVNode), current);
    }

    return;
  }

  if (newVNode.type !== oldVNode.type) {
    removeEvents(current); 
    parent.replaceChild(createDom(newVNode), current);
    return;
  }

  updateProps(current, oldVNode.props, newVNode.props);

  patchChildren(current, oldVNode.children ?? [], newVNode.children ?? []);
}

export default function patch(oldVNode, newVNode, container) {
  // A fragment root is a flat list of siblings inside the container.
  if (Array.isArray(oldVNode) || Array.isArray(newVNode)) {
    patchChildren(
      container,
      Array.isArray(oldVNode) ? oldVNode : [oldVNode],
      Array.isArray(newVNode) ? newVNode : [newVNode]
    );
    return;
  }

  updateDOM(container, newVNode, oldVNode, 0);
}
