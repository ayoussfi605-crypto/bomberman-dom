import addprop from "./setProp.js";

export default function createDom(vnode) {
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
