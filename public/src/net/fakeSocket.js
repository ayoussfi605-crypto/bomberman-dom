// public/src/net/fakeSocket.js
// Scripted fake server for UI development (?fake=1). Same API as socket.js
// plus `emit(type, data)`. Plays the whole flow: hello -> join/lobby timers ->
// start -> 30 Hz snapshots + tile changes -> gameover -> replayable hello.

import {
  C2S,
  COLS,
  CORNER_BY_SLOT,
  ERR,
  LOBBY_COUNTDOWN_MS,
  LOBBY_WAIT_MS,
  MAX_PLAYERS,
  NICK_MAX,
  NICK_MIN,
  NICK_REGEX,
  ROWS,
  S2C,
  SAFE_ZONE_ARM,
  TILE,
} from "../../../shared/constants.js";

const SNAPSHOT_EVERY_MS = 1000 / 30;
const BOT_EVERY_MS = 2000;
const MATCH_MS = 40_000;
const TILE_CYCLE_MS = 6000;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function inSafeZone(x, y) {
  return CORNER_BY_SLOT.some(
    (corner) =>
      (y === corner.y && Math.abs(x - corner.x) <= SAFE_ZONE_ARM) ||
      (x === corner.x && Math.abs(y - corner.y) <= SAFE_ZONE_ARM),
  );
}

function buildTiles() {
  const tiles = new Array(COLS * ROWS).fill(TILE.FLOOR);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const index = y * COLS + x;
      const isBorder = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
      const isPillar = x % 2 === 0 && y % 2 === 0;

      if (isBorder || isPillar) tiles[index] = TILE.WALL;
      else if (!inSafeZone(x, y) && Math.random() < 0.7)
        tiles[index] = TILE.BLOCK;
    }
  }

  return tiles;
}

export function createFakeSocket({
  botEveryMs = BOT_EVERY_MS,
  matchMs = MATCH_MS,
  tileCycleMs = TILE_CYCLE_MS,
} = {}) {
  const handlers = new Map();
  const statusHandlers = new Set();
  const timeouts = new Set();
  const intervals = new Set();

  let status = "closed";
  /** Active scripted match/lobby, or null. Identity is used to drop stale timers. */
  let scenario = null;

  function later(fn, ms) {
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, ms);
    timeouts.add(id);
    return id;
  }

  function every(fn, ms) {
    const id = setInterval(fn, ms);
    intervals.add(id);
    return id;
  }

  function stopInterval(id) {
    if (id === null || id === undefined) return;
    clearInterval(id);
    intervals.delete(id);
  }

  function clearTimers() {
    for (const id of timeouts) clearTimeout(id);
    timeouts.clear();
    for (const id of intervals) clearInterval(id);
    intervals.clear();
  }

  function emit(type, data) {
    const callbacks = handlers.get(type);
    if (!callbacks) return;
    for (const callback of [...callbacks]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`[fakeSocket] "${type}" handler failed:`, error);
      }
    }
  }

  function setStatus(next) {
    if (status === next) return;
    status = next;
    for (const callback of [...statusHandlers]) {
      try {
        callback(status);
      } catch (error) {
        console.error("[fakeSocket] status handler failed:", error);
      }
    }
  }

  function emitError(code, message) {
    emit(S2C.ERROR, { code, message });
  }

  // ------------------------------------------------------------ scenario

  function resetScenario() {
    clearTimers();
    scenario = {
      phase: "lobby",
      localNickname: null,
      players: [],
      bots: 0,
      timer: null,
      botIntervalId: null,
      tickIntervalId: null,
      tick: 0,
      tiles: null,
      dead: new Set(),
    };
    return scenario;
  }

  function lobbyView() {
    return {
      players: scenario.players.map((player) => player.nickname),
      count: scenario.players.length,
      max: MAX_PLAYERS,
      timer: scenario.timer
        ? { kind: scenario.timer.kind, secondsLeft: scenario.timer.secondsLeft }
        : null,
    };
  }

  function emitLobby() {
    if (!scenario) return;
    emit(S2C.LOBBY, lobbyView());
  }

  function cancelTimer() {
    if (!scenario || !scenario.timer) return;
    stopInterval(scenario.timer.intervalId);
    scenario.timer = null;
  }

  function startTimer(kind, durationMs) {
    cancelTimer();
    const owner = scenario;
    const timer = {
      kind,
      endsAt: Date.now() + durationMs,
      secondsLeft: Math.ceil(durationMs / 1000),
      intervalId: null,
    };
    scenario.timer = timer;

    timer.intervalId = every(1000, () => {
      if (!scenario || scenario !== owner || scenario.timer !== timer) return;

      if (Date.now() < timer.endsAt) {
        timer.secondsLeft = Math.max(
          0,
          Math.ceil((timer.endsAt - Date.now()) / 1000),
        );
        emitLobby();
        return;
      }

      cancelTimer();
      if (timer.kind === "wait") {
        startTimer("start", LOBBY_COUNTDOWN_MS);
        emitLobby();
      } else {
        startMatch();
      }
    });
  }

  function updateTimer() {
    if (!scenario || scenario.phase !== "lobby") return;

    const count = scenario.players.length;

    if (count < 2) {
      cancelTimer();
    } else if (count >= MAX_PLAYERS) {
      if (!scenario.timer || scenario.timer.kind !== "start") {
        startTimer("start", LOBBY_COUNTDOWN_MS);
      }
    } else if (!scenario.timer) {
      startTimer("wait", LOBBY_WAIT_MS);
    }

    emitLobby();
  }

  function stopBots() {
    if (!scenario) return;
    stopInterval(scenario.botIntervalId);
    scenario.botIntervalId = null;
  }

  function startBots() {
    if (!scenario || scenario.botIntervalId !== null) return;

    scenario.botIntervalId = every(botEveryMs, () => {
      if (!scenario || scenario.phase !== "lobby") return;
      if (scenario.players.length >= MAX_PLAYERS) {
        stopBots();
        return;
      }

      scenario.bots += 1;
      scenario.players.push({ nickname: `Bot${scenario.bots}` });

      if (scenario.players.length >= MAX_PLAYERS) stopBots();
      updateTimer();
    });
  }

  // ------------------------------------------------------------ match

  function emitSnapshot() {
    if (!scenario || scenario.phase !== "playing") return;

    const seconds = scenario.tick / 30;

    const players = scenario.players.map((entry, slot) => {
      const corner = CORNER_BY_SLOT[slot] ?? CORNER_BY_SLOT[0];
      const angle = seconds * 0.9 + (slot * Math.PI) / 2;
      const x = clamp(corner.x + 0.5 + Math.cos(angle) * 0.6, 1, COLS - 2);
      const y = clamp(corner.y + 0.5 + Math.sin(angle) * 0.6, 1, ROWS - 2);

      // Tangent of the circle, so `dir` matches the visible motion.
      const dx = -Math.sin(angle);
      const dy = Math.cos(angle);
      const dir =
        Math.abs(dx) >= Math.abs(dy)
          ? dx >= 0
            ? "right"
            : "left"
          : dy >= 0
            ? "down"
            : "up";

      const dead = scenario.dead.has(slot);

      return {
        slot,
        x: round3(x),
        y: round3(y),
        dir,
        moving: true,
        alive: !dead,
        lives: dead ? 0 : 3,
        invulnerable: false,
        maxBombs: 1,
        range: 2,
        speedLevel: 0,
      };
    });

    emit(S2C.SNAPSHOT, { tick: scenario.tick, players });
  }

  function pickCells(count) {
    const cells = [];

    for (let i = 0; i < count; i += 1) {
      for (let tries = 0; tries < 20; tries += 1) {
        const x = 1 + Math.floor(Math.random() * (COLS - 2));
        const y = 1 + Math.floor(Math.random() * (ROWS - 2));
        const index = y * COLS + x;
        if (scenario.tiles[index] === TILE.FLOOR) {
          cells.push(index);
          break;
        }
      }
    }

    return cells;
  }

  function emitTiles() {
    if (!scenario) return;
    emit(S2C.TILES, { tiles: scenario.tiles.slice() });
  }

  /** bomb -> flame -> floor on a few cells, so the board visibly changes. */
  function runTileCycle() {
    if (!scenario || scenario.phase !== "playing") return;

    const owner = scenario;
    const cells = pickCells(3);
    if (cells.length === 0) return;

    for (const cell of cells) owner.tiles[cell] = TILE.BOMB;
    emitTiles();

    later(() => {
      if (scenario !== owner) return;
      for (const cell of cells) owner.tiles[cell] = TILE.FLAME;
      emitTiles();
    }, 1800);

    later(() => {
      if (scenario !== owner) return;
      for (const cell of cells) owner.tiles[cell] = TILE.FLOOR;
      emitTiles();
    }, 2400);
  }

  function killSlot(slot) {
    if (!scenario || scenario.phase !== "playing") return;
    scenario.dead.add(slot);
  }

  function startMatch() {
    if (!scenario) return;

    const owner = scenario;
    owner.phase = "playing";
    cancelTimer();
    stopBots();

    const players = owner.players.map((entry, slot) => ({
      slot,
      nickname: entry.nickname,
    }));
    owner.tiles = buildTiles();
    owner.tick = 0;

    emit(S2C.START, {
      you: 0,
      cols: COLS,
      rows: ROWS,
      players,
      tiles: owner.tiles.slice(),
    });
    emitSnapshot();

    owner.tickIntervalId = every(SNAPSHOT_EVERY_MS, () => {
      if (!scenario || scenario !== owner || scenario.phase !== "playing")
        return;
      owner.tick += 1;
      emitSnapshot();
    });

    every(tileCycleMs, () => {
      if (!scenario || scenario !== owner) return;
      runTileCycle();
    });

    // Bots get eliminated one by one so the HUD shows life changes.
    const kills = [0.5, 0.65, 0.8];
    kills.forEach((fraction, index) => {
      if (players.length <= index + 1) return;
      later(
        () => {
          if (scenario !== owner) return;
          killSlot(index + 1);
        },
        Math.round(matchMs * fraction),
      );
    });

    later(() => {
      if (scenario !== owner) return;
      endMatch(players);
    }, matchMs);
  }

  function endMatch(players) {
    if (!scenario || scenario.phase !== "playing") return;

    emit(S2C.GAMEOVER, {
      winner: 0,
      players: players.map(({ slot, nickname }) => ({
        slot,
        nickname,
        lives: slot === 0 ? 3 : 0,
      })),
    });

    // Clears every fake timer and makes the room replayable.
    resetScenario();
    emit(S2C.HELLO, { phase: "lobby", count: 0, max: MAX_PLAYERS });
  }

  // ------------------------------------------------------------ client input

  function handleJoin(data) {
    if (!scenario) return;

    const nickname =
      typeof data?.nickname === "string" ? data.nickname.trim() : "";

    if (scenario.phase === "playing") {
      return emitError(ERR.GAME_IN_PROGRESS, "A game is already in progress");
    }
    if (nickname.toLowerCase() === "taken") {
      return emitError(ERR.NICK_TAKEN, "Nickname already used");
    }
    if (
      nickname.length < NICK_MIN ||
      nickname.length > NICK_MAX ||
      !NICK_REGEX.test(nickname)
    ) {
      return emitError(
        ERR.NICK_INVALID,
        "Nickname must be 2-12 characters (letters, digits, _ or -)",
      );
    }
    if (scenario.players.length >= MAX_PLAYERS) {
      return emitError(ERR.ROOM_FULL, "Room is full");
    }

    scenario.localNickname = nickname;
    scenario.players.push({ nickname });

    emit(S2C.JOINED, { nickname });
    updateTimer();
    startBots();
  }

  function handleChat(data) {
    if (!scenario) return;

    const text =
      typeof data?.text === "string"
        ? data.text.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim()
        : "";
    if (!text) return;

    emit(S2C.CHAT, {
      from: scenario.localNickname ?? "You",
      text: text.slice(0, 200),
      ts: Date.now(),
    });
  }

  // ------------------------------------------------------------ API

  function connect() {
    if (status === "open" || status === "connecting") return;

    setStatus("connecting");
    resetScenario();

    later(() => {
      if (status !== "connecting") return;
      setStatus("open");
      emit(S2C.HELLO, { phase: "lobby", count: 0, max: MAX_PLAYERS });
    }, 0);
  }

  function send(type, data) {
    if (status !== "open" || !scenario) {
      console.warn(
        `[fakeSocket] dropped "${type}": the connection is not open`,
      );
      return;
    }

    switch (type) {
      case C2S.JOIN:
        return handleJoin(data);
      case C2S.CHAT:
        return handleChat(data);
      default:
        // `input` / `bomb` are pointless without a real engine.
        return undefined;
    }
  }

  function on(type, callback) {
    if (!handlers.has(type)) handlers.set(type, new Set());
    handlers.get(type).add(callback);

    return () => {
      const callbacks = handlers.get(type);
      if (!callbacks) return;
      callbacks.delete(callback);
      if (callbacks.size === 0) handlers.delete(type);
    };
  }

  function onStatus(callback) {
    statusHandlers.add(callback);

    try {
      callback(status);
    } catch (error) {
      console.error("[fakeSocket] status handler failed:", error);
    }

    return () => {
      statusHandlers.delete(callback);
    };
  }

  function close() {
    clearTimers();
    scenario = null;
    setStatus("closed");
  }

  return {
    connect,
    send,
    on,
    onStatus,
    close,
    emit,
    get status() {
      return status;
    },
  };
}
