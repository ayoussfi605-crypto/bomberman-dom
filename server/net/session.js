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

    send(type, data) {
      if (!ws || ws.readyState !== WS_OPEN) return;
      try {
        ws.send(JSON.stringify({ type, data }));
      } catch {
      }
    },

    sendRaw(payload) {
      if (!ws || ws.readyState !== WS_OPEN) return;
      try {
        ws.send(payload);
      } catch {
      }
    },
  };

  return session;
}
