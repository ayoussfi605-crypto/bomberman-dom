# Framework patch record — applied in the starter

The canonical runtime is `public/src/framework/`, maintained by Hichame.
These changes are already implemented; teammates do not need to reapply them.
The original `mini-framework/` is a reference snapshot, not a second maintained
runtime. Read the [runtime API](../public/src/framework/README.md).

| Change | Behaviour | Verification |
|---|---|---|
| State batching | Default stays `sync`; Bomberman opts into `microtask`; browser `raf` mode is available. Updates merge immediately. No-op/invalid patches do not notify; listeners receive state/version and errors are isolated. | `tests/state.test.js`, browser check |
| Cached vnodes | Identity short-circuit skips identical subtrees and identical fragment roots. Rendered vnodes/props/style objects/children are immutable. | Browser check counts cached vnode reads, then verifies fresh changed text patches in place. |
| Style objects | CSS strings remain supported; plain objects support camelCase, hyphenated names and custom properties. Removed properties and string/object/removal transitions are handled. Explicit units required. | Browser style checks |
| Global events | `listen(target, type, handler, options)` returns a cleanup function. | Browser global-event check |
| Subtree events | Removing/replacing a subtree cleans all descendant framework listeners, even if the subtree root has no listeners. | Browser retained-child listener check |

## Run the checks

```sh
npm test
npm start
```

Open http://localhost:8080/dev/framework-check.html. Every check must report PASS.
Alternatively run `npm run test:browser` with Chrome installed (`CHROME_BIN` may
point to Chromium or another Chrome executable).
Browser checks also cover uncontrolled chat input preservation, handler
replacement, form properties, and fragment rendering.

The previous draft's test that rendered fresh `"hello"` to repair manually
modified DOM was incorrect: virtual old/new text was equal, so no text change
was expected. The check now instruments traversal and renders changed text.

The supplied snapshot has no `src/todomvc/`. No TodoMVC end-to-end regression pass
is claimed. The synchronous default preserves its documented notification timing;
run the original app separately if that source becomes available.

The framework alone does not prove game performance. Hichame and Ayoub still
profile the integrated four-player game for frame drops, paint and layers.

## Starter verification record

Verified on 2026-11-02 with Node.js 22.22.1 and headless Chrome:

- `npm test`: 10 automated state/static-server checks pass.
- `npm run test:browser`: 8 real-browser checks pass.
- Runtime JavaScript syntax and documentation links pass.
- Original TodoMVC regression and integrated game/performance audit remain pending.

The browser regression includes clearing object styles immediately after CSSOM
writes. Style removal synchronizes the attribute before deleting it.
