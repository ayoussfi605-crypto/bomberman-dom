# Runtime mini-framework

This is the canonical framework used by Bomberman. Hichame owns maintenance.
The original `mini-framework/` directory is a reference snapshot; do not maintain
a second runtime there. No build step or client dependencies.

Import public APIs from `index.js`: `h`, `render`, `State`, event helpers,
`listen`, and `createRouter`.

## DOM and events

`h(tag, props, ...children)` builds a vnode; `render(vnode, element)` mounts or
patches it. Children are flattened, numbers become text, and null/booleans are
omitted. User content is text. Children reconcile by position, not key. Keep
the board grid and four player slots structurally stable.

**Rendered vnodes, props, style objects and children are immutable.** Reusing
the same vnode at the same position skips its entire subtree. Build a fresh
vnode to change it. Do not modify framework-managed DOM externally, except the
agreed input/focus/scroll operations. Equal virtual text is not expected to
repair manually tampered DOM.

`style` accepts a CSS string or a plain object. Object keys may be camelCase,
hyphenated properties, or custom properties. Include units explicitly:

```js
h("div", { style: { transform: "translate3d(20px, 0, 0)", "--tile": "40px" } });
```

Removed style keys are cleared. String/object/removal transitions work.
Event props (`onClick`, `onInput`, `onChange`, `onSubmit`, `onKeyDown`, `onKeyUp`,
`onDblClick`, `onFocus`, `onBlur`) receive native events. Use stable handlers in
per-frame trees. Removed subtrees have their listeners cleaned recursively.

`listen(target, type, handler, options)` registers global events and returns a
cleanup function. Use it for keyboard/blur and focusin/visibilitychange events;
call cleanup on disposal.

## State

`new State(initialState)` preserves synchronous notification timing. Bomberman
opts into batching: `new State(initialState, { batch: "microtask" })`.
`batch: "raf"` is available in a browser; do not use it for positions or create
a second game-rendering loop around it.

`setState(objectOrUpdater)` shallow-merges immediately; functional updaters see
the latest state even within a batch. Null, non-object, array, empty and unchanged
top-level patches do not notify. Update nested data immutably. Listeners receive
`(state, version)`; each accepted patch increments version. Listener errors are
logged without preventing the remaining listeners from running.
`subscribe(listener)` returns an unsubscribe function.

## Verification

From the project root, run `npm test`, then `npm start` and open
`/dev/framework-check.html` for real-browser checks. TodoMVC source was not
included in the supplied snapshot; its original end-to-end regression check
requires that source separately.
