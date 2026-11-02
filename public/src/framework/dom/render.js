import createDom from "./createDom.js";
import patch from "./patch.js";

const previousVNodes = new WeakMap();

export default function render(vnode, container) {
  if (!(container instanceof Element)) {
    throw new TypeError("render(): container must be a valid DOM element");
  }

  if (!vnode || typeof vnode !== "object") {
    throw new TypeError("render(): vnode must be a valid VNode");
  }

  const oldVNode = previousVNodes.get(container);

  if (!oldVNode) {
    const dom = createDom(vnode);
    container.replaceChildren(dom);
  } else {
    patch(oldVNode, vnode, container);
  }

  previousVNodes.set(container, vnode);
}
