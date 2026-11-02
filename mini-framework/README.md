# Mini Framework + TodoMVC

A small JavaScript UI framework built from scratch, plus a TodoMVC app that uses it. It provides a virtual DOM, declarative elements, shared state, a custom event API, and hash-based routing — with no dependencies and no build step.

No React, Vue, Angular, or similar library is used.

## Features

- **Virtual DOM** — describe the UI as plain objects with `h()`.
- **Rendering and patching** — `render()` mounts once, then updates only what changed.
- **Shared state** — a `State` store with subscriptions; notifications are synchronous.
- **Custom event API** — `onClick`, `onInput`, `onChange`, `onSubmit`, `onKeyDown`, `onKeyUp`, `onDblClick`, `onBlur`, `onFocus`.
- **Routing** — hash routes (`#/`, `#/active`, `#/completed`) with Back/Forward and reload support.
- **TodoMVC** — a working application in `src/todomvc/`.

## Running the project

From the repository root:

```bash
npm start
```

Then open `http://localhost:8080/`.

`npm start` runs `python3 -m http.server 8080`. There are no dependencies to install and no build step. Opening the files with a `file://` URL will not work, because the app uses ES modules.

## Project layout

```text
index.html        entry page; contains <section class="todoapp" id="root">
src/framework/    the framework (public entry point: index.js)
  dom/            h, normalize, createDom, setProp, patch, render
  state/          State store
  events/         custom event API
  router/         hash router
src/todomvc/      TodoMVC app and styles
```

## Creating an element

`h(type, props, ...children)` returns a virtual node. It does not create real DOM.

```javascript
import { h, render } from "./src/framework/index.js";

const title = h("h1", { class: "title" }, "Hello!");
```

The virtual node looks like this:

```javascript
const vnode = { type: "h1", props: { class: "title" }, children: ["Hello!"] };
```

Mount it with `render(vnode, container)`:

```javascript
render(title, document.querySelector("#root")); // any element works as the container
```

`h()` throws a `TypeError` if `type` is not a non-empty string, or if `props` is not a plain object, `null`, or `undefined`.

Children are normalized automatically: nested arrays are flattened, `null`/`undefined`/booleans are dropped, and numbers become strings. Text is created with `document.createTextNode()`, never `innerHTML`, so user input cannot inject HTML.

## Adding attributes and properties

```javascript
h("input", {
  class: "field",
  id: "name",
  type: "text",
  placeholder: "Insert your name",
  value: "Ada",
  checked: true,
  disabled: false
});
```

- Attributes such as `class`, `id`, `type`, and `placeholder` are set with `setAttribute()`.
- `value`, `checked`, and `selected` are set as live DOM properties.
- `true` sets a boolean attribute; `false`, `null`, or `undefined` removes it.
- On later renders, changed attributes are applied and removed attributes are cleared.

## Nesting elements and fragments

Children can be nested `h()` calls or arrays, which are flattened:

```javascript
const card = h(
  "div",
  { class: "card" },
  h("h2", {}, "Product"),
  h("ul", { class: "features" },
    h("li", {}, "Fast"),
    h("li", {}, "Small")
  )
);
```

Passing an **array** of virtual nodes where a single root would go renders siblings with no wrapper element (a fragment):

```javascript
render([
  h("header", {}, h("h1", {}, "todos")),
  h("main", {}, h("p", {}, "Content")),
  h("footer", {}, "Footer")
], document.querySelector("#root"));
```

The container receives `header`, `main`, and `footer` directly. This is how TodoMVC mounts its three sections.

## Handling events

Handlers are declared as props. The callback receives the native browser event, so `event.preventDefault()`, `event.target`, and `event.key` work normally.

```javascript
h("button", {
  onClick: (event) => console.log("Clicked", event.target)
}, "Click me");
```

| Framework prop | Native event |
|---|---|
| `onClick` | `click` |
| `onInput` | `input` |
| `onChange` | `change` |
| `onKeyDown` | `keydown` |
| `onKeyUp` | `keyup` |
| `onSubmit` | `submit` |
| `onDblClick` | `dblclick` |
| `onBlur` | `blur` |
| `onFocus` | `focus` |

```javascript
h("input", {
  onKeyDown: (event) => {
    if (event.key === "Enter") {
      // ...
    }
  }
});
```

The framework attaches native listeners internally with `addEventListener()`, but application code only uses these props. When a handler prop changes it is replaced, not duplicated; when it is removed, the listener is removed. `handleKey(event, onEnter, onEscape)` is a small helper for Enter/Escape shortcuts.

## Shared state

```javascript
import { State } from "./src/framework/index.js";

const store = new State({ todos: [], filter: "all" });

store.getState();                       // current state
store.setState({ filter: "active" });   // shallow merge
store.setState((state) => ({            // function patch
  todos: [...state.todos, newTodo]
}));

const unsubscribe = store.subscribe((state) => {
  render(view(state), document.querySelector("#root"));
});

unsubscribe(); // stop listening
```

`setState()` performs a **shallow merge** and notifies subscribers synchronously. It does not render by itself: subscribe once, outside the render function, and call `render()` from the subscriber. Update arrays and nested objects immutably (create new ones rather than mutating the existing state).

## Routing

```javascript
import { createRouter } from "./src/framework/index.js";

const router = createRouter({
  "/": () => setFilter("all"),
  "/active": () => setFilter("active"),
  "/completed": () => setFilter("completed")
});

router.start();               // listen for hashchange and run the current route
router.navigate("/active");   // change the URL hash
```

URLs look like `http://localhost:8080/#/active`. Unknown paths fall back to the `"/"` route. Because routing is hash-based, Back, Forward, and reloading a filtered URL all work without any server configuration.

## How the framework works

```text
h() -> virtual node tree -> normalizeChildren() -> createDom() -> real DOM
                                                        |
                                         next render: patch(old, new)
```

1. `h()` builds `{ type, props, children }`.
2. `normalizeChildren()` flattens arrays, drops empty values, and converts numbers to strings.
3. `createDom()` creates elements and text nodes recursively. Props go through `setProp()`, which sets attributes, form properties, and event listeners. An array root becomes a `DocumentFragment`.
4. `render(vnode, container)` keeps the previous virtual tree for each container in a `WeakMap`. The first call replaces the container's children; later calls run `patch()`.
5. `patch()` replaces nodes of a different type, updates text, applies or removes props, then reconciles children positionally: matching children are patched, extras are removed, new ones are appended.
6. `State` stores application data and calls subscribers synchronously on each `setState()`.
7. `createRouter()` maps `window.location.hash` to route callbacks and updates state through them.

**Why this design?** A virtual tree is a value that can be compared, so updates touch only the changed DOM instead of rebuilding the page. A single shared store keeps separate UI areas consistent, the custom event API hides listener bookkeeping, and hash routing needs no server-side rewrite rules.

## TodoMVC

`src/todomvc/app.js` mounts into `#root` and uses only framework APIs (`h`, `render`, `State`, `createRouter`, event props). It supports:

- adding a todo with Enter, clearing the input;
- toggling, deleting, and toggle-all;
- double-click editing: Enter saves, clicking away saves, Escape cancels, and an empty title deletes the todo;
- All / Active / Completed filters that update the hash (`#/`, `#/active`, `#/completed`);
- the remaining-items counter, footer/main visibility, and Clear completed.

The markup follows the TodoMVC reference: `.todoapp`, `.header`, `.new-todo`, `.main`, `.toggle-all`, `.todo-list`, `.footer`, `.todo-count`, `.filters`, `.clear-completed`, and item parts `.view`, `.toggle`, `label`, `.destroy`, `.edit`, plus the `completed`/`editing` item classes.

## Limitations

- Positional child reconciliation; no keyed diffing or list-reordering optimization.
- No components, hooks, or lifecycle methods.
- The event list is a fixed allowlist in `src/framework/events/index.js`.
- Hash routing only; there is no History API mode.
- One previous virtual tree per container; do not edit the container's children outside the framework.
- Todos live in memory and reset on reload.
