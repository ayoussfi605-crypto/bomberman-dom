import { h, render, State, listen } from "../src/framework/index.js";

const out = document.getElementById("out");
const fixtures = document.getElementById("fixtures");
const results = [];
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const mount = () => fixtures.appendChild(document.createElement("div"));
async function check(name, run) {
  try {
    await run();
    results.push(`PASS  ${name}`);
  } catch (error) {
    results.push(`FAIL  ${name}: ${error.message}`);
  }
}

await check("sync default and opt-in microtask batching", async () => {
  const sync = new State({ count: 0 });
  let syncCalls = 0;
  sync.subscribe(() => syncCalls++);
  sync.setState({ count: 1 });
  assert(syncCalls === 1, "default notification must be synchronous");
  const store = new State({ count: 0 }, { batch: "microtask" });
  let calls = 0;
  store.subscribe(() => calls++);
  store.setState({ count: 1 }); store.setState(s => ({ count: s.count + 1 }));
  assert(calls === 0 && store.getState().count === 2, "merge immediately");
  await Promise.resolve();
  assert(calls === 1, "one notification per batch");
  store.setState({ count: 2 });
  await Promise.resolve();
  assert(calls === 1, "no-op should not notify");
});

await check("style objects mount, diff and remove properties", () => {
  const root = mount();
  render(h("div", { style: { transform: "translate(1px, 2px)", "--tile": "10px", "background-color": "red" } }), root);
  const el = root.firstChild;
  assert(el.style.transform.includes("1px") && el.style.getPropertyValue("--tile") === "10px", "style mount");
  render(h("div", { style: { transform: "translate(5px, 6px)" } }), root);
  assert(root.firstChild === el && el.style.transform.includes("5px"), "reuse and update");
  assert(el.style.getPropertyValue("--tile") === "" && el.style.backgroundColor === "", "clear removed keys");
});

await check("string/object/empty/omitted styles transition correctly", () => {
  const root = mount();
  render(h("div", { style: "color: red" }), root);
  const el = root.firstChild;
  render(h("div", { style: { backgroundColor: "blue" } }), root);
  assert(el.style.color === "" && el.style.backgroundColor === "blue", "string to object");
  render(h("div", { style: "color: green" }), root);
  assert(el.style.color === "green" && el.style.backgroundColor === "", "object to string");
  render(h("div", { style: false }), root);
  assert(!el.hasAttribute("style"), "false clears style");
  render(h("div", { style: { opacity: "0.5" } }), root);
  render(h("div", {}), root);
  assert(!el.hasAttribute("style") && el.style.opacity === "", "omitted style clears it");
});

await check("cached subtrees skip traversal; fresh changed content patches", () => {
  const root = mount();
  let reads = 0;
  const cached = new Proxy(h("p", {}, "hello"), {
    get(target, key, receiver) { reads++; return Reflect.get(target, key, receiver); },
  });
  render(h("div", {}, cached), root);
  const paragraph = root.firstChild.firstChild;
  reads = 0;
  render(h("div", {}, cached), root);
  assert(reads === 0, "cached vnode should not be traversed");
  render(h("div", {}, h("p", {}, "updated")), root);
  assert(root.firstChild.firstChild === paragraph && paragraph.textContent === "updated", "patch changed text in place");
});

await check("global listener cleanup", () => {
  let calls = 0;
  const off = listen(window, "framework-check", () => calls++);
  window.dispatchEvent(new Event("framework-check"));
  off(); off();
  window.dispatchEvent(new Event("framework-check"));
  assert(calls === 1, "cleanup removes listener");
});

await check("events replace and removed subtrees clean descendants", () => {
  const root = mount();
  let oldCalls = 0, newCalls = 0;
  const oldHandler = () => oldCalls++;
  const newHandler = () => newCalls++;
  render(h("section", {}, h("button", { onClick: oldHandler }, "click")), root);
  const button = root.firstChild.firstChild;
  button.click();
  render(h("section", {}, h("button", { onClick: newHandler }, "click")), root);
  button.click();
  assert(oldCalls === 1 && newCalls === 1, "handler replacement");
  render(h("main", {}, "replacement"), root);
  button.click();
  assert(newCalls === 1 && !button._listeners, "clean child even if removed parent has no listeners");
});

await check("chat log updates preserve an uncontrolled input", () => {
  const root = mount();
  const tree = messages => h("div", {},
    h("ul", {}, messages.map(text => h("li", {}, text))), h("input", {}));
  render(tree(["one"]), root);
  const input = root.querySelector("input"); input.value = "draft";
  render(tree(["one", "two"]), root);
  assert(root.querySelector("input") === input && input.value === "draft", "input survives log updates");
});

await check("form properties and fragment roots still work", () => {
  const root = mount();
  render([h("input", { value: "Ada", disabled: true }), h("span", {}, 3)], root);
  const input = root.firstChild;
  render([h("input", { value: "Bob", disabled: false }), h("span", {}, 2)], root);
  assert(root.firstChild === input && input.value === "Bob" && !input.disabled, "value and boolean attributes");
  assert(root.lastChild.textContent === "2", "fragment text update");
});

const failed = results.filter(line => line.startsWith("FAIL")).length;
out.textContent = results.join("\n") + `\n\n${results.length - failed}/${results.length} checks passed`;
document.documentElement.dataset.status = failed ? "failed" : "passed";
window.frameworkCheckResult = { passed: results.length - failed, failed };
