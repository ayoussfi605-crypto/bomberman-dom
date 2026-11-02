import addprop from "./setProp.js";

export default function createDom(vnode) {
  // A fragment (array of vnodes) renders as sibling nodes with no wrapper element.
  if (Array.isArray(vnode)) {
    const fragment = document.createDocumentFragment();

    vnode.forEach((child) => {
      fragment.appendChild(createDom(child));
    });

    return fragment;
  }

  if (typeof vnode === "string" || typeof vnode === "number") {
    return document.createTextNode(vnode);
  }

  let element = document.createElement(vnode.type);

  if (vnode.props) {
     addprop(vnode, element);
  }

  if (vnode.children) {
    vnode.children.forEach((child) => {
      element.appendChild(createDom(child));
    });
  }

  return element;
}
