import { test } from "node:test";
import assert from "node:assert/strict";

import { C2S, ERR, MAX_MESSAGE_BYTES } from "../../shared/constants.js";
import { parseMessage } from "../net/validate.js";

const frame = (value) => JSON.stringify(value);

test("accepts a valid join", () => {
  const result = parseMessage(frame({ type: C2S.JOIN, data: { nickname: "Ada" } }));
  assert.deepEqual(result, { ok: true, type: "join", data: { nickname: "Ada" } });
});

test("accepts a valid chat, input and bomb", () => {
  assert.deepEqual(parseMessage(frame({ type: C2S.CHAT, data: { text: "hi" } })), {
    ok: true,
    type: "chat",
    data: { text: "hi" },
  });

  assert.deepEqual(parseMessage(frame({ type: C2S.INPUT, data: { dir: "up" } })), {
    ok: true,
    type: "input",
    data: { dir: "up" },
  });

  assert.deepEqual(parseMessage(frame({ type: C2S.INPUT, data: { dir: null } })), {
    ok: true,
    type: "input",
    data: { dir: null },
  });

  assert.deepEqual(parseMessage(frame({ type: C2S.BOMB })), {
    ok: true,
    type: "bomb",
    data: {},
  });

  assert.deepEqual(parseMessage(frame({ type: C2S.BOMB, data: { ignored: true } })), {
    ok: true,
    type: "bomb",
    data: {},
  });
});

test("accepts Buffer frames (what ws delivers)", () => {
  const result = parseMessage(Buffer.from(frame({ type: C2S.JOIN, data: { nickname: "Bo" } })));
  assert.equal(result.ok, true);
  assert.equal(result.data.nickname, "Bo");
});

test("rejects malformed JSON and non-objects", () => {
  for (const raw of ["{", "", "null", "[]", "42", '"text"', "true"]) {
    assert.deepEqual(parseMessage(raw), { ok: false, code: ERR.BAD_MESSAGE }, raw);
  }
});

test("rejects non-string frames without throwing", () => {
  for (const raw of [undefined, null, 12, {}, () => {}]) {
    assert.deepEqual(parseMessage(raw), { ok: false, code: ERR.BAD_MESSAGE });
  }
});

test("rejects unknown and missing types", () => {
  assert.deepEqual(parseMessage(frame({ type: "shutdown", data: {} })), {
    ok: false,
    code: ERR.UNKNOWN_TYPE,
  });
  assert.deepEqual(parseMessage(frame({ data: {} })), {
    ok: false,
    code: ERR.UNKNOWN_TYPE,
  });
  assert.deepEqual(parseMessage(frame({ type: 7 })), {
    ok: false,
    code: ERR.UNKNOWN_TYPE,
  });
});

test("rejects wrong data shapes", () => {
  const bad = [
    { type: C2S.JOIN },
    { type: C2S.JOIN, data: {} },
    { type: C2S.JOIN, data: { nickname: 42 } },
    { type: C2S.JOIN, data: [] },
    { type: C2S.CHAT, data: {} },
    { type: C2S.CHAT, data: { text: null } },
    { type: C2S.INPUT, data: {} },
    { type: C2S.INPUT, data: { dir: "diagonal" } },
    { type: C2S.INPUT, data: { dir: 1 } },
    { type: C2S.BOMB, data: "now" },
  ];

  for (const value of bad) {
    assert.deepEqual(parseMessage(frame(value)), { ok: false, code: ERR.BAD_MESSAGE }, frame(value));
  }
});

test("rejects chat text longer than CHAT_MAX_LEN", () => {
  const result = parseMessage(frame({ type: C2S.CHAT, data: { text: "x".repeat(201) } }));
  assert.deepEqual(result, { ok: false, code: ERR.BAD_MESSAGE });
});

test("enforces the application byte limit", () => {
  const oversized = frame({ type: C2S.JOIN, data: { nickname: "x".repeat(MAX_MESSAGE_BYTES) } });
  assert.ok(Buffer.byteLength(oversized, "utf8") > MAX_MESSAGE_BYTES);
  assert.deepEqual(parseMessage(oversized), { ok: false, code: ERR.BAD_MESSAGE });
});
