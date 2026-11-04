// server/net/session.js
// One session per socket. The room only touches this shape (never `ws` details).

import { createRateLimiter } from "./rateLimit.js";

const WS_OPEN = 1;

let nextId = 1;

export function createSession(ws, { now = () => Date.now() } = {}) {
  const session = {
    id: `s${nextId++}`,
    ws,
    nickname: null,
    joined: false,
    slot: null,
    badMessages: 0,
    limiter: createRateLimiter({ now }),
    closed: false,

    /** Sends {type, data} as JSON. Ignored when the socket is not open. */
    send(type, data) {
      if (!ws || ws.readyState !== WS_OPEN) return;
      try {
        ws.send(JSON.stringify({ type, data }));
      } catch {
        // A dying socket must never break a broadcast loop.
      }
    },

    /** Sends an already-serialized frame (broadcasts serialize once). */
    sendRaw(payload) {
      if (!ws || ws.readyState !== WS_OPEN) return;
      try {
        ws.send(payload);
      } catch {
        // Ignore: the close handler cleans the session up.
      }
    },
  };

  return session;
}
