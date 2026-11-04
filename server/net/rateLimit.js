// server/net/rateLimit.js
// Sliding-window limiter. One instance per socket (all messages) and one per
// player (chat). Injectable clock keeps it testable.

import { MAX_MESSAGES_PER_SECOND } from "../../shared/constants.js";

export function createRateLimiter({
  limit = MAX_MESSAGES_PER_SECOND,
  windowMs = 1000,
  now = () => Date.now(),
} = {}) {
  let hits = [];

  return {
    /** Records a hit when allowed. @returns {boolean} true if the event is allowed. */
    take() {
      const at = now();
      while (hits.length > 0 && at - hits[0] >= windowMs) hits.shift();
      if (hits.length >= limit) return false;
      hits.push(at);
      return true;
    },
    reset() {
      hits = [];
    },
    get count() {
      return hits.length;
    },
  };
}
