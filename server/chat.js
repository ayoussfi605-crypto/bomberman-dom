// server/chat.js
// Chat text sanitation + per-player chat rate limiting (PROTOCOL.md §2).

import {
  CHAT_MAX_LEN,
  CHAT_RATE_MAX,
  CHAT_RATE_WINDOW_MS,
} from "../shared/constants.js";
import { createRateLimiter } from "./net/rateLimit.js";

// Control characters (including newlines/tabs) are never rendered.
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

/**
 * Trims, strips control characters and caps the length.
 * @returns {string | null} null when there is nothing to send.
 */
export function sanitizeText(raw) {
  if (typeof raw !== "string") return null;

  const text = raw.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
  if (!text) return null;

  return text.length > CHAT_MAX_LEN ? text.slice(0, CHAT_MAX_LEN) : text;
}

/** One sliding window per player id. */
export function createChatGate({
  now = () => Date.now(),
  limit = CHAT_RATE_MAX,
  windowMs = CHAT_RATE_WINDOW_MS,
} = {}) {
  const limiters = new Map();

  return {
    allow(playerId) {
      let limiter = limiters.get(playerId);
      if (!limiter) {
        limiter = createRateLimiter({ limit, windowMs, now });
        limiters.set(playerId, limiter);
      }
      return limiter.take();
    },
    forget(playerId) {
      limiters.delete(playerId);
    },
    reset() {
      limiters.clear();
    },
  };
}
