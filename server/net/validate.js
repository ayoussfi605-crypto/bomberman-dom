// server/net/validate.js
// Parses and validates client -> server frames. Never throws: a malformed frame
// must come back as { ok: false, code } and never crash the server.
//
// Contract: PROTOCOL.md §2 and docs/ARCHITECTURE.md §7.1.

import {
  C2S,
  CHAT_MAX_LEN,
  DIR,
  ERR,
  MAX_MESSAGE_BYTES,
} from "../../shared/constants.js";

const CLIENT_TYPES = new Set(Object.values(C2S));
const DIRECTIONS = new Set(Object.values(DIR));

const ERROR_MESSAGES = {
  [ERR.BAD_MESSAGE]: "Malformed message",
  [ERR.UNKNOWN_TYPE]: "Unknown message type",
  [ERR.NICK_INVALID]: "Nickname must be 2-12 characters (letters, digits, _ or -)",
  [ERR.NICK_TAKEN]: "Nickname already used",
  [ERR.ROOM_FULL]: "Room is full",
  [ERR.GAME_IN_PROGRESS]: "A game is already in progress",
  [ERR.ALREADY_JOINED]: "You have already joined",
  [ERR.NOT_JOINED]: "Join the room before sending this message",
  [ERR.RATE_LIMITED]: "Slow down",
};

export function errorMessage(code) {
  return ERROR_MESSAGES[code] ?? "Something went wrong";
}

function fail(code) {
  return { ok: false, code };
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(raw) {
  if (typeof raw === "string") return raw;
  if (raw instanceof Uint8Array) return Buffer.from(raw).toString("utf8");
  if (raw instanceof ArrayBuffer) return Buffer.from(new Uint8Array(raw)).toString("utf8");
  return null;
}

/**
 * @param {string | Uint8Array | ArrayBuffer} raw
 * @returns {{ ok: true, type: string, data: object } | { ok: false, code: string }}
 */
export function parseMessage(raw) {
  try {
    const text = toText(raw);
    if (text === null) return fail(ERR.BAD_MESSAGE);
    if (Buffer.byteLength(text, "utf8") > MAX_MESSAGE_BYTES) return fail(ERR.BAD_MESSAGE);

    let message;
    try {
      message = JSON.parse(text);
    } catch {
      return fail(ERR.BAD_MESSAGE);
    }

    if (!isPlainObject(message)) return fail(ERR.BAD_MESSAGE);

    const { type } = message;
    if (typeof type !== "string" || !CLIENT_TYPES.has(type)) return fail(ERR.UNKNOWN_TYPE);

    const payload = message.data;

    switch (type) {
      case C2S.BOMB: {
        // `data` may be omitted entirely.
        if (payload === undefined || payload === null) return { ok: true, type, data: {} };
        if (!isPlainObject(payload)) return fail(ERR.BAD_MESSAGE);
        return { ok: true, type, data: {} };
      }

      case C2S.JOIN: {
        if (!isPlainObject(payload) || typeof payload.nickname !== "string") {
          return fail(ERR.BAD_MESSAGE);
        }
        return { ok: true, type, data: { nickname: payload.nickname } };
      }

      case C2S.CHAT: {
        if (!isPlainObject(payload) || typeof payload.text !== "string") {
          return fail(ERR.BAD_MESSAGE);
        }
        if (payload.text.length > CHAT_MAX_LEN) return fail(ERR.BAD_MESSAGE);
        return { ok: true, type, data: { text: payload.text } };
      }

      case C2S.INPUT: {
        if (!isPlainObject(payload) || !("dir" in payload)) return fail(ERR.BAD_MESSAGE);
        const { dir } = payload;
        if (dir !== null && !DIRECTIONS.has(dir)) return fail(ERR.BAD_MESSAGE);
        return { ok: true, type, data: { dir } };
      }

      default:
        return fail(ERR.UNKNOWN_TYPE);
    }
  } catch {
    // Defensive: no exception may escape the parser.
    return fail(ERR.BAD_MESSAGE);
  }
}
