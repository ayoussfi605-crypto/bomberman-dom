import { test } from "node:test";
import assert from "node:assert/strict";

import { C2S, COLS, ERR, ROWS, S2C } from "../../shared/constants.js";
import { createRoom } from "../lobby/room.js";

const silent = { log() {}, warn() {}, error() {} };
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createFakeSession(id) {
  const messages = [];

  return {
    id,
    ws: null,
    nickname: null,
    joined: false,
    slot: null,
    badMessages: 0,
    closed: false,
    messages,

    send(type, data) {
      messages.push({ type, data });
    },
    sendRaw(payload) {
      messages.push(JSON.parse(payload));
    },
    all(type) {
      return messages.filter((message) => message.type === type).map((message) => message.data);
    },
    last(type) {
      return this.all(type).at(-1);
    },
    count(type) {
      return this.all(type).length;
    },
    clear() {
      messages.length = 0;
    },
  };
}

function createFakeGame(players) {
  const calls = [];
  const state = players.map(({ slot, nickname }) => ({
    slot,
    nickname,
    x: 1.5,
    y: 1.5,
    dir: null,
    moving: false,
    alive: true,
    lives: 3,
    invulnerable: false,
    maxBombs: 1,
    range: 2,
    speedLevel: 0,
  }));

  let tick = 0;
  let result = null;

  return {
    calls,
    setInput(slot, dir) {
      calls.push(["input", slot, dir]);
    },
    placeBomb(slot) {
      calls.push(["bomb", slot]);
    },
    removePlayer(slot) {
      calls.push(["remove", slot]);
      const player = state.find((entry) => entry.slot === slot);
      if (player) {
        player.alive = false;
        player.lives = 0;
      }
    },
    step() {
      tick += 1;
      return { tilesChanged: false };
    },
    getSnapshot() {
      return { tick, players: state.map((player) => ({ ...player })) };
    },
    getTiles() {
      return new Array(COLS * ROWS).fill(0);
    },
    getResult() {
      return result;
    },
    finish(winner) {
      result = {
        winner,
        players: state.map((player) => ({
          slot: player.slot,
          nickname: player.nickname,
          lives: player.slot === winner ? 1 : 0,
        })),
      };
    },
  };
}

function setup(t) {
  let engine = null;

  const room = createRoom({
    createGame: (players) => {
      engine = createFakeGame(players);
      return engine;
    },
    waitMs: 5,
    countdownMs: 5,
    lobbyPollMs: 2,
    tickMs: 4,
    logger: silent,
  });

  t.after(() => room.stop());

  return {
    room,
    get engine() {
      return engine;
    },
  };
}

function join(room, session, nickname) {
  room.handleConnect(session);
  room.handle(session, C2S.JOIN, { nickname });
  return session;
}

async function startTwoPlayerGame(room) {
  const a = join(room, createFakeSession("a"), "Ada");
  const b = join(room, createFakeSession("b"), "Bob");
  await delay(60);
  return { a, b };
}

test("connect sends hello and join sends joined + lobby + system chat", (t) => {
  const { room } = setup(t);
  const a = createFakeSession("a");

  room.handleConnect(a);
  assert.deepEqual(a.last(S2C.HELLO), { phase: "lobby", count: 0, max: 4 });

  room.handle(a, C2S.JOIN, { nickname: "Ada" });
  assert.deepEqual(a.last(S2C.JOINED), { nickname: "Ada" });
  assert.deepEqual(a.last(S2C.LOBBY), {
    players: ["Ada"],
    count: 1,
    max: 4,
    timer: null,
  });
  assert.equal(a.last(S2C.CHAT).from, null);
  assert.equal(a.last(S2C.CHAT).text, "Ada joined");
});

test("a second join is broadcast to everyone with the wait timer", (t) => {
  const { room } = setup(t);
  const a = join(room, createFakeSession("a"), "Ada");
  const b = createFakeSession("b");
  a.clear();

  join(room, b, "Bob");

  const view = a.last(S2C.LOBBY);
  assert.deepEqual(view.players, ["Ada", "Bob"]);
  assert.equal(view.count, 2);
  assert.equal(view.max, 4);
  assert.equal(view.timer.kind, "wait");
  assert.equal(typeof view.timer.secondsLeft, "number");
  assert.equal(b.last(S2C.LOBBY).count, 2);
});

test("join errors: ALREADY_JOINED, NICK_TAKEN, NICK_INVALID, ROOM_FULL", (t) => {
  const { room } = setup(t);
  const a = join(room, createFakeSession("a"), "Ada");
  const stranger = createFakeSession("s");
  room.handleConnect(stranger);

  room.handle(a, C2S.JOIN, { nickname: "Ada" });
  assert.equal(a.last(S2C.ERROR).code, ERR.ALREADY_JOINED);

  room.handle(stranger, C2S.JOIN, { nickname: "ada" });
  assert.equal(stranger.last(S2C.ERROR).code, ERR.NICK_TAKEN);

  room.handle(stranger, C2S.JOIN, { nickname: "x" });
  assert.equal(stranger.last(S2C.ERROR).code, ERR.NICK_INVALID);

  join(room, createFakeSession("b"), "Bob");
  join(room, createFakeSession("c"), "Cy");
  join(room, createFakeSession("d"), "Dee");

  const late = createFakeSession("late");
  room.handleConnect(late);
  room.handle(late, C2S.JOIN, { nickname: "Late" });
  assert.equal(late.last(S2C.ERROR).code, ERR.ROOM_FULL);
});

test("chat requires joining, is sanitized and broadcast to all joined players", (t) => {
  const { room } = setup(t);
  const a = join(room, createFakeSession("a"), "Ada");
  const outsider = createFakeSession("outsider");
  room.handleConnect(outsider);
  const b = join(room, createFakeSession("b"), "Bob");
  a.clear();
  b.clear();

  room.handle(outsider, C2S.CHAT, { text: "let me in" });
  assert.equal(outsider.last(S2C.ERROR).code, ERR.NOT_JOINED);
  assert.equal(b.count(S2C.CHAT), 0);

  room.handle(a, C2S.CHAT, { text: "  hi\u0007there\nfriend  " });

  assert.equal(a.last(S2C.CHAT).text, "hi there friend");
  assert.equal(b.last(S2C.CHAT).text, "hi there friend");
  assert.equal(b.last(S2C.CHAT).from, "Ada");
  assert.equal(typeof b.last(S2C.CHAT).ts, "number");

  room.handle(a, C2S.CHAT, { text: "   " }); // silently ignored
  assert.equal(b.count(S2C.CHAT), 1);
});

test("chat is rate limited per player", (t) => {
  const { room } = setup(t);
  const a = join(room, createFakeSession("a"), "Ada");
  const b = join(room, createFakeSession("b"), "Bob");
  b.clear();

  for (let i = 0; i < 5; i += 1) room.handle(a, C2S.CHAT, { text: `m${i}` });
  assert.equal(b.count(S2C.CHAT), 5);
  assert.equal(a.count(S2C.ERROR), 0);

  room.handle(a, C2S.CHAT, { text: "too much" });
  assert.equal(a.last(S2C.ERROR).code, ERR.RATE_LIMITED);
  assert.equal(b.count(S2C.CHAT), 5);
});

test("start assigns slots in join order and sends the same board to everyone", async (t) => {
  const { room } = setup(t);
  const { a, b } = await startTwoPlayerGame(room);

  const startA = a.last(S2C.START);
  const startB = b.last(S2C.START);

  assert.equal(startA.you, 0);
  assert.equal(startB.you, 1);
  assert.deepEqual(startA.players, [
    { slot: 0, nickname: "Ada" },
    { slot: 1, nickname: "Bob" },
  ]);
  assert.deepEqual(startA.tiles, startB.tiles);
  assert.equal(startA.tiles.length, COLS * ROWS);
  assert.equal(startA.cols, COLS);
  assert.equal(startA.rows, ROWS);

  const startIndex = a.messages.findIndex((message) => message.type === S2C.START);
  const firstSnapshot = a.messages.findIndex((message) => message.type === S2C.SNAPSHOT);
  assert.equal(firstSnapshot, startIndex + 1, "start is immediately followed by a snapshot");
  assert.equal(a.all(S2C.SNAPSHOT)[0].tick, 0, "initial snapshot is tick 0");
  assert.equal(room.phase, "playing");

  await delay(30);
  assert.ok(a.count(S2C.SNAPSHOT) > 1, "snapshots keep arriving");
  assert.deepEqual(a.last(S2C.SNAPSHOT), b.last(S2C.SNAPSHOT), "no per-player snapshots");
});

test("join during a game is refused with GAME_IN_PROGRESS", async (t) => {
  const { room } = setup(t);
  await startTwoPlayerGame(room);

  const late = createFakeSession("late");
  room.handleConnect(late);
  assert.equal(late.last(S2C.HELLO).phase, "playing");

  room.handle(late, C2S.JOIN, { nickname: "Late" });
  assert.equal(late.last(S2C.ERROR).code, ERR.GAME_IN_PROGRESS);
});

test("input and bomb are mapped to the sender's slot only while playing", async (t) => {
  const context = setup(t);
  const { room } = context;
  const { a } = await startTwoPlayerGame(room);
  const engine = context.engine;

  room.handle(a, C2S.INPUT, { dir: "left" });
  room.handle(a, C2S.BOMB, {});

  assert.deepEqual(engine.calls, [
    ["input", 0, "left"],
    ["bomb", 0],
  ]);
});

test("input and bomb before the game are ignored", (t) => {
  const { room, engine } = setup(t);
  const a = join(room, createFakeSession("a"), "Ada");

  room.handle(a, C2S.INPUT, { dir: "left" });
  room.handle(a, C2S.BOMB, {});

  assert.equal(engine, null);
});

test("disconnecting in the lobby removes the player and cancels the timer", (t) => {
  const { room } = setup(t);
  const a = join(room, createFakeSession("a"), "Ada");
  const b = join(room, createFakeSession("b"), "Bob");
  a.clear();

  room.handleDisconnect(b);

  assert.deepEqual(a.last(S2C.LOBBY), {
    players: ["Ada"],
    count: 1,
    max: 4,
    timer: null,
  });
  assert.equal(a.last(S2C.CHAT).text, "Bob left");
});

test("disconnecting mid-game eliminates the player and notifies the others", async (t) => {
  const context = setup(t);
  const { room } = context;
  const { a, b } = await startTwoPlayerGame(room);
  a.clear();

  room.handleDisconnect(b);

  assert.ok(context.engine.calls.some(([kind, slot]) => kind === "remove" && slot === 1));
  assert.equal(a.last(S2C.CHAT).text, "Bob left");
  assert.equal(room.phase, "playing");
});

test("gameover resets every per-game value and allows replaying", async (t) => {
  const context = setup(t);
  const { room } = context;
  const { a, b } = await startTwoPlayerGame(room);

  context.engine.finish(0);
  await delay(40);

  const over = a.last(S2C.GAMEOVER);
  assert.equal(over.winner, 0);
  assert.deepEqual(over.players, [
    { slot: 0, nickname: "Ada", lives: 1 },
    { slot: 1, nickname: "Bob", lives: 0 },
  ]);
  assert.deepEqual(a.last(S2C.HELLO), { phase: "lobby", count: 0, max: 4 });
  assert.deepEqual(b.last(S2C.HELLO), { phase: "lobby", count: 0, max: 4 });
  assert.equal(room.phase, "lobby");
  assert.equal(a.joined, false, "everyone is un-joined");
  assert.equal(b.joined, false);
  assert.equal(a.slot, null);

  a.clear();
  room.handle(a, C2S.JOIN, { nickname: "Ada" });
  assert.deepEqual(a.last(S2C.JOINED), { nickname: "Ada" });
  assert.equal(a.last(S2C.LOBBY).count, 1);
});

test("a second game can start after a reset", async (t) => {
  const context = setup(t);
  const { room } = context;
  const { a, b } = await startTwoPlayerGame(room);

  context.engine.finish(1);
  await delay(40);

  a.clear();
  b.clear();
  room.handle(a, C2S.JOIN, { nickname: "Ada" });
  room.handle(b, C2S.JOIN, { nickname: "Bob" });
  await delay(60);

  assert.equal(room.phase, "playing");
  assert.equal(a.last(S2C.START).you, 0);
  assert.equal(b.last(S2C.START).you, 1);
});

test("the 4th player starts the countdown immediately", (t) => {
  const { room } = setup(t);
  const a = join(room, createFakeSession("a"), "Ada");
  join(room, createFakeSession("b"), "Bob");
  join(room, createFakeSession("c"), "Cy");
  join(room, createFakeSession("d"), "Dee");

  assert.equal(a.last(S2C.LOBBY).timer.kind, "start");
  assert.equal(a.last(S2C.LOBBY).count, 4);
});
