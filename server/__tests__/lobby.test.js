import { test } from "node:test";
import assert from "node:assert/strict";

import { ERR, MAX_PLAYERS } from "../../shared/constants.js";
import { createLobby, validateNickname } from "../lobby/lobby.js";

function createClock(start = 1_000_000) {
  let time = start;
  return {
    now: () => time,
    advance(ms) {
      time += ms;
    },
  };
}

function setup(options = {}) {
  const clock = createClock();
  const lobby = createLobby({ now: clock.now, ...options });
  return { clock, lobby };
}

test("2 players: wait 20 s, then a 10 s countdown starts the game", () => {
  const { clock, lobby } = setup();

  assert.deepEqual(lobby.join("a", "Ada"), { ok: true, nickname: "Ada" });
  assert.equal(lobby.view().timer, null, "one player: no timer");

  lobby.join("b", "Bob");
  assert.deepEqual(lobby.view(), {
    players: ["Ada", "Bob"],
    count: 2,
    max: MAX_PLAYERS,
    timer: { kind: "wait", secondsLeft: 20 },
  });

  clock.advance(5_000);
  assert.deepEqual(lobby.view().timer, { kind: "wait", secondsLeft: 15 });

  clock.advance(15_000);
  assert.equal(lobby.update(), null, "the wait ending switches to the countdown");
  assert.deepEqual(lobby.view().timer, { kind: "start", secondsLeft: 10 });

  clock.advance(9_999);
  assert.equal(lobby.update(), null);

  clock.advance(1);
  assert.deepEqual(lobby.update(), {
    event: "start",
    players: [
      { id: "a", nickname: "Ada" },
      { id: "b", nickname: "Bob" },
    ],
  });
});

test("4 players: the countdown starts immediately and lasts 10 s", () => {
  const { clock, lobby } = setup();

  lobby.join("a", "Ada");
  lobby.join("b", "Bob");
  lobby.join("c", "Cy");
  assert.equal(lobby.view().timer.kind, "wait");

  lobby.join("d", "Dee");
  assert.deepEqual(lobby.view().timer, { kind: "start", secondsLeft: 10 });

  clock.advance(10_000);
  assert.deepEqual(lobby.update(), {
    event: "start",
    players: [
      { id: "a", nickname: "Ada" },
      { id: "b", nickname: "Bob" },
      { id: "c", nickname: "Cy" },
      { id: "d", nickname: "Dee" },
    ],
  });
});

test("the start event fires exactly once", () => {
  const { clock, lobby } = setup();
  lobby.join("a", "Ada");
  lobby.join("b", "Bob");
  clock.advance(20_000);
  assert.equal(lobby.update(), null, "wait -> countdown, no start yet");

  clock.advance(10_000);
  assert.ok(lobby.update());
  assert.equal(lobby.update(), null);
  assert.equal(lobby.view().timer, null);
});

test("joining during the wait does not reset the timer", () => {
  const { clock, lobby } = setup();
  lobby.join("a", "Ada");
  lobby.join("b", "Bob");

  clock.advance(5_000);
  lobby.join("c", "Cy");

  assert.deepEqual(lobby.view().timer, { kind: "wait", secondsLeft: 15 });
  assert.equal(lobby.view().count, 3);
});

test("joining during the countdown does not reset it", () => {
  const { clock, lobby } = setup();
  lobby.join("a", "Ada");
  lobby.join("b", "Bob");

  clock.advance(20_000);
  lobby.update(); // wait -> start
  clock.advance(4_000);

  lobby.join("c", "Cy");
  assert.deepEqual(lobby.view().timer, { kind: "start", secondsLeft: 6 });

  clock.advance(6_000);
  const started = lobby.update();
  assert.equal(started.event, "start");
  assert.deepEqual(
    started.players.map((player) => player.nickname),
    ["Ada", "Bob", "Cy"],
  );
});

test("dropping below 2 players cancels the timer; reaching 2 again starts a fresh wait", () => {
  const { clock, lobby } = setup();
  lobby.join("a", "Ada");
  lobby.join("b", "Bob");

  clock.advance(5_000);
  lobby.leave("b");
  assert.deepEqual(lobby.view(), {
    players: ["Ada"],
    count: 1,
    max: MAX_PLAYERS,
    timer: null,
  });

  clock.advance(60_000);
  assert.equal(lobby.update(), null);

  lobby.join("c", "Cy");
  assert.deepEqual(lobby.view().timer, { kind: "wait", secondsLeft: 20 });
});

test("leaving during the countdown with one player left cancels it", () => {
  const { clock, lobby } = setup();
  lobby.join("a", "Ada");
  lobby.join("b", "Bob");
  clock.advance(20_000);
  lobby.update(); // start countdown

  lobby.leave("b");
  assert.equal(lobby.view().timer, null);
  clock.advance(20_000);
  assert.equal(lobby.update(), null);
});

test("a full room rejects the next player", () => {
  const { lobby } = setup();
  for (let i = 0; i < MAX_PLAYERS; i += 1) {
    assert.equal(lobby.join(`p${i}`, `P${i}`).ok, true);
  }

  assert.deepEqual(lobby.join("extra", "Extra"), { ok: false, code: ERR.ROOM_FULL });
  assert.equal(lobby.view().count, MAX_PLAYERS);
});

test("nicknames are validated and unique case-insensitively", () => {
  const { lobby } = setup();

  assert.equal(lobby.join("a", "Ada").ok, true);

  assert.deepEqual(lobby.join("b", "ada"), { ok: false, code: ERR.NICK_TAKEN });
  assert.deepEqual(lobby.join("b", " ADA "), { ok: false, code: ERR.NICK_TAKEN });
  assert.deepEqual(lobby.join("b", "Taken"), { ok: true, nickname: "Taken" });

  for (const bad of ["a", "", "   ", "x".repeat(13), "bad name", "bad!", "Émile", 3, null, undefined]) {
    assert.equal(validateNickname(bad, []), ERR.NICK_INVALID, String(bad));
  }

  assert.equal(validateNickname("  Bo  ", []), null);
  assert.equal(validateNickname("a_b-c9", []), null);
});

test("view reports names in join order, count and max", () => {
  const { lobby } = setup();
  lobby.join("z", "  Zed  ");
  lobby.join("a", "Amy");

  assert.deepEqual(lobby.view(), {
    players: ["Zed", "Amy"],
    count: 2,
    max: MAX_PLAYERS,
    timer: { kind: "wait", secondsLeft: 20 },
  });
});
