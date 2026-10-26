# Mini Framework

A lightweight JavaScript UI framework built from scratch. It provides a Virtual DOM, declarative element creation, DOM rendering, event handling, reactive state, and client-side routing.

> **Status:** Work in progress. Some APIs and features may change as the framework evolves.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Creating Elements with `h()`](#creating-elements-with-h)
- [Rendering with `render()`](#rendering-with-render)
- [Working with State](#working-with-state)
- [Event Handling](#event-handling)
- [How Virtual DOM Updates Work](#how-virtual-dom-updates-work)
- [API Reference](#api-reference)
- [Common Errors](#common-errors)
- [Limitations](#limitations)

## Features

- **Virtual DOM:** Represent UI elements as JavaScript objects.
- **Declarative UI:** Describe your interface using `h()`.
- **DOM rendering:** Convert Virtual DOM nodes into real DOM elements.
- **DOM patching:** Update existing DOM nodes when the Virtual DOM changes.
- **Reactive state:** Subscribe to state changes and trigger rendering.
- **Event handling:** Attach JavaScript event listeners to elements.
- **Child normalization:** Flatten nested children arrays and filter unsupported child values.
- **Client-side routing:** Define route handlers and respond to navigation changes.

## Project Structure

The framework is organized into separate modules:

```text
src/
├── framework/
│   ├── dom/
│   │   ├── createDom.js
│   │   ├── h.js
│   │   ├── normalize.js
│   │   ├── patch.js
│   │   ├── render.js
│   │   └── setProp.js
│   ├── events/
│   │   └── index.js
│   ├── router/
│   │   └── index.js
│   └── state/
│       └── index.js
└── todomvc/
    └── app.js
```

## Requirements

- A modern browser with JavaScript module support.
- A local development server, such as VS Code Live Server.
- An HTML page containing a root element.

Example `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mini Framework</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./src/todomvc/app.js"></script>
</body>
</html>
```

Run the page through your local development server. Do not open it directly using a `file://` URL, because JavaScript modules require appropriate loading behavior.

## Getting Started

Import the functions you need into your application:

```javascript
import h from "../framework/dom/h.js";
import render from "../framework/dom/render.js";
import State from "../framework/state/index.js";
```

The paths above assume your application is located in `src/todomvc/app.js`. Adjust relative paths if your files are located elsewhere.

Create a Virtual DOM node:

```javascript
const vnode = h(
  "h1",
  { class: "title" },
  "Hello, world!"
);
```

Render it into the application root:

```javascript
const app = document.getElementById("app");

render(vnode, app);
```

Your framework creates a real DOM element and inserts it into the root container.

## Creating Elements with `h()`

### Syntax

```javascript
h(type, props, ...children)
```

| Parameter | Description |
|---|---|
| `type` | A non-empty string representing an HTML element, such as `"div"` or `"button"`. |
| `props` | An object containing attributes and event handlers. Use `{}` if there are no properties. |
| `children` | Zero or more child values, including strings, numbers, VNodes, and nested arrays. |

### Example: Basic Element

```javascript
const vnode = h(
  "div",
  { class: "container" },
  "Welcome to my framework"
);
```

### Example: Nested Elements

```javascript
const vnode = h(
  "div",
  { class: "card" },
  h("h2", {}, "Product"),
  h("p", {}, "Product description"),
  h("button", {}, "Buy now")
);
```

### Example: Multiple Children

```javascript
const vnode = h("ul", {}, [
  h("li", {}, "First item"),
  h("li", {}, "Second item"),
  h("li", {}, "Third item"),
]);
```

### How `h()` Works

The `h()` function returns a Virtual DOM object. It does not create a real DOM element itself.

For example:

```javascript
h("h1", { class: "title" }, "Hello");
```

Produces a structure conceptually equivalent to:

```javascript
{
  type: "h1",
  props: {
    class: "title"
  },
  children: ["Hello"]
}
```

The `normalizeChildren()` function flattens nested arrays, removes `null`, `undefined`, and boolean children, and converts numeric children into strings.

### Validation

The current implementation throws a `TypeError` when:

- `type` is not a non-empty string.
- `props` is not a plain object, `null`, or `undefined`.

## Rendering with `render()`

### Syntax

```javascript
render(vnode, container);
```

| Parameter | Description |
|---|---|
| `vnode` | The root Virtual DOM node to render. |
| `container` | A real DOM element that receives the rendered interface. |

### Example

```javascript
const app = document.getElementById("app");

const vnode = h(
  "div",
  { class: "main" },
  h("h1", {}, "Hello"),
  h("p", {}, "Rendered by Mini Framework")
);

render(vnode, app);
```

### Initial Rendering

On the first render, the framework converts the Virtual DOM tree into real DOM elements using `createDom()`.

### Subsequent Rendering

When the same container is rendered again, the framework retrieves the previous Virtual DOM tree and calls `patch()` to compare the previous and new trees.

The goal is to update only the parts of the DOM that changed instead of replacing the entire application.

**Important:** The behavior of subsequent renders depends on the correctness of the current `patch()` implementation.

## Working with State

The `State` class stores application data and allows functions to subscribe to changes.

### Creating State

```javascript
const state = new State({
  count: 0,
  username: "Developer"
});
```

### Reading State

Use `getState()` to access the current state:

```javascript
const currentState = state.getState();

console.log(currentState.count);
console.log(currentState.username);
```

### Updating State

Use `setState()` to merge new properties into the existing state:

```javascript
state.setState({
  count: 1
});
```

Properties not included in the update are preserved.

For example:

```javascript
const state = new State({
  count: 0,
  username: "Developer"
});

state.setState({ count: 5 });

console.log(state.getState());
// { count: 5, username: "Developer" }
```

The current implementation compares states using `JSON.stringify()`. If the serialized state changes, registered listeners are notified.

### Subscribing to State Changes

```javascript
const unsubscribe = state.subscribe(() => {
  console.log("State changed:", state.getState());
});
```

The callback runs when `setState()` detects a change.

To stop listening:

```javascript
unsubscribe();
```

### Complete Counter Example

```javascript
import h from "../framework/dom/h.js";
import render from "../framework/dom/render.js";
import State from "../framework/state/index.js";

const app = document.getElementById("app");
const state = new State({ count: 0 });

function renderApp() {
  const { count } = state.getState();

  const vnode = h("div", { class: "counter" }, [
    h("h1", {}, `Count: ${count}`),
    h(
      "button",
      {
        click: () => {
          state.setState({
            count: state.getState().count + 1
          });
        }
      },
      "Increment"
    )
  ]);

  render(vnode, app);
}

const unsubscribe = state.subscribe(renderApp);

renderApp();
```

### Counter Update Flow

1. The user clicks the button.
2. The event handler calls `setState()`.
3. The state is updated.
4. State listeners execute `renderApp()`.
5. A new Virtual DOM tree is created.
6. `render()` compares the new tree with the previous tree.
7. `patch()` updates the real DOM where necessary.

The `renderApp()` function runs again, but the real DOM elements should be preserved whenever the patching algorithm determines they do not need replacement.

## Event Handling

Event handlers are defined in the `props` object.

### Syntax

```javascript
h("button", {
  click: () => {
    console.log("Clicked!");
  }
}, "Click me");
```

The framework passes the event handler to the DOM event system through `setProp()` when creating an element.

### Examples

Click:

```javascript
h("button", {
  click: () => console.log("Clicked")
}, "Click");
```

Input:

```javascript
h("input", {
  input: (event) => {
    console.log(event.target.value);
  }
});
```

Submit:

```javascript
h("form", {
  submit: (event) => {
    event.preventDefault();
    console.log("Form submitted");
  }
}, h("button", {}, "Submit"));
```

Use the event names expected by your framework's event implementation. For example, `click` is a standard DOM event name, whereas `onClick` needs explicit normalization if the framework is to support it.

## How Virtual DOM Updates Work

The Virtual DOM represents UI elements as JavaScript objects. When state changes, your application creates a new representation of the UI.

The framework compares the previous and new representations.

### Example

Previous Virtual DOM:

```javascript
h("div", {}, [
  h("h1", {}, "Count: 0"),
  h("button", {}, "Increment")
]);
```

New Virtual DOM:

```javascript
h("div", {}, [
  h("h1", {}, "Count: 1"),
  h("button", {}, "Increment")
]);
```

The desired update is to change the heading's text while keeping the existing `div` and `button` elements.

The `patch()` implementation is responsible for this behavior.

### Current Reconciliation Approach

The basic patching algorithm:

- Replaces nodes when their types differ.
- Updates text nodes when their text changes.
- Updates element properties.
- Recursively processes child nodes.
- Adds or removes children when necessary.

This is a basic index-based reconciliation approach. It does not yet provide the full reconciliation behavior of frameworks such as React.

## API Reference

### `h(type, props, ...children)`

Creates a Virtual DOM node.

```javascript
const vnode = h("p", { class: "text" }, "Hello");
```

### `createDom(vnode)`

Creates a real DOM node from a Virtual DOM node.

```javascript
const element = createDom(vnode);
```

This function is primarily an internal rendering utility.

### `render(vnode, container)`

Renders a Virtual DOM node into a DOM container and uses the previous tree for subsequent updates.

```javascript
render(vnode, document.getElementById("app"));
```

### `State(initialState)`

Creates a state manager.

```javascript
const state = new State({ count: 0 });
```

### `state.getState()`

Returns the current state object.

```javascript
const current = state.getState();
```

### `state.setState(newState)`

Merges new properties into the current state and notifies listeners when a change is detected.

```javascript
state.setState({ count: 10 });
```

### `state.subscribe(listener)`

Registers a callback and returns an unsubscribe function.

```javascript
const unsubscribe = state.subscribe(() => {
  console.log("Updated");
});
```

### Router

The project also contains a router module. The exact API depends on the current implementation. Consult `src/framework/router/index.js` for the supported methods, navigation behavior, and route configuration.

## Common Errors

### `container must be a valid DOM element`

**Cause:** `render()` received something other than a valid DOM `Element`.

**Solution:**

```javascript
const app = document.getElementById("app");

if (app) {
  render(vnode, app);
}
```

Make sure the root element exists before rendering.

### Module MIME Type Error

**Cause:** The browser requested a module URL that returned HTML instead of JavaScript, often because of an incorrect import path.

**Solution:** Check the file name, relative import path, file extension, and development server.

```javascript
import h from "../framework/dom/h.js";
```

### `parent.childNodes is undefined`

**Cause:** The patching function received a Virtual DOM object where it expected a real DOM parent, or its arguments were passed in the wrong order.

**Solution:** Ensure the renderer and patching function use a consistent interface.

### The Entire UI Is Recreated

**Cause:** Calling `createDom()` and `container.replaceChildren()` on every state update replaces existing DOM nodes.

**Solution:** Use `render()` to handle subsequent updates through `patch()`.

### Event Handlers Stop Working After Updates

**Cause:** The patching algorithm may remove an old event listener without registering the new handler correctly, or event names may be inconsistent.

**Solution:** Normalize event names and manage listener registration consistently during initial creation and subsequent updates.

## Limitations

This project is an educational Mini Framework and is still under development.

Depending on the current implementation, the following features may be incomplete:

- Key-based reconciliation and efficient list reordering.
- Complete support for all HTML properties and boolean attributes.
- Controlled form fields, including `value` and `checked`.
- SVG elements and namespace-aware DOM creation.
- Component functions, hooks, and lifecycle management.
- Fragments and special rendering types.
- Robust handling of every event type.
- Production-grade error handling and performance optimizations.

The framework should not be considered a drop-in replacement for React, Vue, or other mature UI frameworks.

## Contributing

When extending the framework:

1. Keep DOM creation, Virtual DOM construction, state management, event handling, and routing as separate modules.
2. Add tests for new behavior and edge cases.
3. Verify that unchanged DOM nodes retain their identity after updates.
4. Test event registration and removal when properties change.
5. Document any public API changes.

## License

Add your preferred license before distributing the project. If you intend to publish it as an open-source project, include a `LICENSE` file with the appropriate license terms.
