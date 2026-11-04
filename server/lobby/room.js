// server/lobby/room.js
// The only module that knows sessions, the lobby state machine, and the engine.
// Owns phases (lobby / playing), the snapshot broadcast, and the game loop.

import {
  C2S,
  COLS,
  ERR,
  LOBBY_COUNTDOWN_MS,
  LOBBY_WAIT_MS,
  MAX_PLAYERS,
  ROWS,
  S2C,
  TICK_MS,
} from "../../shared/constants.js";
import { createChatGate, sanitizeText } from "../chat.js";
import { errorMessage } from "../net/validate.js";
import { createLobby } from "./lobby.js";
import { createLoop } from "./loop.js";

export function createRoom(options = {}) {
  const {
    createGame = null,
    now = () => Date.now(),
    maxPlayers = MAX_PLAYERS,
    waitMs = LOBBY_WAIT_MS,
    countdownMs = LOBBY_COUNTDOWN_MS,
    tickMs = TICK_MS,
    lobbyPollMs = 100,
    logger = console,
  } = options;

  const sessions = new Set();
  const sessionsById = new Map();
  const chatGate = createChatGate({ now });

  let lobby = createLobby({ now, maxPlayers, waitMs, countdownMs });
  let phase = "lobby";
  let game = null;
  let loop = null;
  let pollTimer = null;
  let lastLobbyJson = null;
  let stopped = false;

  let tickCount = 0;
  let lastRateLog = now();

  // ------------------------------------------------------------ sending

  function broadcast(type, data) {
    // Serialize once and send the same frame to everyone (PROTOCOL.md §1).
    const payload = JSON.stringify({ type, data });
    for (const session of sessions) {
      if (!session.joined) continue;
      if (typeof session.sendRaw === "function") session.sendRaw(payload);
      else session.send(type, data);
    }
  }

  function broadcastChat(from, text) {
    broadcast(S2C.CHAT, { from, text, ts: now() });
  }

  function fail(session, code) {
    session.send(S2C.ERROR, { code, message: errorMessage(code) });
  }

  function currentCount() {
    if (phase === "playing") {
      let count = 0;
      for (const session of sessions) {
        if (session.slot !== null && session.slot !== undefined) count += 1;
      }
      return count;
    }
    return lobby.view().count;
  }

  function helloData() {
    return { phase, count: currentCount(), max: maxPlayers };
  }

  // ------------------------------------------------------------ lobby polling

  function stopPoll() {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function ensurePoll() {
    if (stopped || pollTimer !== null || phase !== "lobby") return;
    pollTimer = setInterval(tickLobby, lobbyPollMs);
    if (typeof pollTimer.unref === "function") pollTimer.unref();
  }

  function broadcastLobbyIfChanged() {
    const view = lobby.view();
    const json = JSON.stringify(view);
    if (json === lastLobbyJson) return;
    lastLobbyJson = json;
    broadcast(S2C.LOBBY, view);
  }

  function tickLobby() {
    if (stopped || phase !== "lobby") return;

    const started = lobby.update();
    if (started && started.event === "start") {
      startGame(started.players);
      return;
    }
    broadcastLobbyIfChanged();
  }

  // ------------------------------------------------------------ game

  function startGame(entries) {
    // The engine is mohamed's module: until it lands there is nothing to start.
    if (typeof createGame !== "function") {
      logger.error?.(
        "[room] no game engine: server/game/game.js does not exist yet, the match cannot start",
      );
      return;
    }

    const players = entries.map((entry, slot) => ({ slot, nickname: entry.nickname }));

    let nextGame;
    try {
      nextGame = createGame(players.map((player) => ({ ...player })), now());
    } catch (error) {
      logger.error?.("[room] could not create the game:", error);
      return;
    }

    game = nextGame;
    entries.forEach((entry, slot) => {
      const session = sessionsById.get(entry.id);
      if (session) session.slot = slot;
    });

    phase = "playing";
    stopPoll();
    lastLobbyJson = null;

    const tiles = game.getTiles();
    const receivers = [];
    for (const entry of entries) {
      const session = sessionsById.get(entry.id);
      if (session && session.joined) receivers.push(session);
    }

    // `you` differs per player, everything else is identical.
    for (const session of receivers) {
      session.send(S2C.START, {
        you: session.slot,
        cols: COLS,
        rows: ROWS,
        players,
        tiles,
      });
    }

    broadcast(S2C.SNAPSHOT, game.getSnapshot()); // tick 0, right after `start`

    loop = createLoop(stepGame, tickMs);
    loop.start();
  }

  function logTickRate() {
    tickCount += 1;
    const at = now();
    if (at - lastRateLog < 1000) return;
    const rate = (tickCount * 1000) / (at - lastRateLog);
    logger.log?.(`[room] snapshot rate: ${rate.toFixed(1)} Hz`);
    tickCount = 0;
    lastRateLog = at;
  }

  function stepGame(dtMs) {
    if (!game) return;

    const result = game.step(dtMs);

    // `tiles` always travels before the snapshot of the same tick.
    if (result && result.tilesChanged) broadcast(S2C.TILES, { tiles: game.getTiles() });

    broadcast(S2C.SNAPSHOT, game.getSnapshot());
    logTickRate();

    const outcome = game.getResult();
    if (outcome) endGame(outcome);
  }

  function endGame(result) {
    broadcast(S2C.GAMEOVER, result);

    if (loop) {
      loop.stop();
      loop = null;
    }
    game = null;

    // Full per-game reset: slots, membership and lobby state.
    for (const session of sessions) {
      session.joined = false;
      session.slot = null;
      session.nickname = null;
    }
    lobby = createLobby({ now, maxPlayers, waitMs, countdownMs });
    lastLobbyJson = null;
    phase = "lobby";

    for (const session of sessions) session.send(S2C.HELLO, helloData());
    ensurePoll();
  }

  // ------------------------------------------------------------ handlers

  function handleJoin(session, data) {
    if (phase === "playing") return fail(session, ERR.GAME_IN_PROGRESS);
    if (session.joined) return fail(session, ERR.ALREADY_JOINED);

    const result = lobby.join(session.id, data.nickname);
    if (!result.ok) return fail(session, result.code);

    session.joined = true;
    session.nickname = result.nickname;
    session.slot = null;

    session.send(S2C.JOINED, { nickname: result.nickname });
    broadcastLobbyIfChanged();
    broadcastChat(null, `${result.nickname} joined`);
    tickLobby(); // 4th player => countdown starts immediately
  }

  function handleChat(session, data) {
    if (!session.joined) return fail(session, ERR.NOT_JOINED);
    if (!chatGate.allow(session.id)) return fail(session, ERR.RATE_LIMITED);

    const text = sanitizeText(data.text);
    if (!text) return; // empty message: ignored silently

    broadcastChat(session.nickname, text);
  }

  function handleGameMessage(session, type, data) {
    if (!session.joined || phase !== "playing" || !game) return;
    if (session.slot === null || session.slot === undefined) return;

    if (type === C2S.INPUT) game.setInput(session.slot, data.dir);
    else if (type === C2S.BOMB) game.placeBomb(session.slot);
  }

  function handle(session, type, data) {
    switch (type) {
      case C2S.JOIN:
        return handleJoin(session, data);
      case C2S.CHAT:
        return handleChat(session, data);
      case C2S.INPUT:
      case C2S.BOMB:
        return handleGameMessage(session, type, data);
      default:
        return fail(session, ERR.UNKNOWN_TYPE);
    }
  }

  function handleConnect(session) {
    if (stopped) return;
    sessions.add(session);
    sessionsById.set(session.id, session);
    session.send(S2C.HELLO, helloData());
    ensurePoll();
  }

  function handleDisconnect(session) {
    if (!sessions.has(session)) return;
    sessions.delete(session);
    sessionsById.delete(session.id);
    chatGate.forget(session.id);

    const wasJoined = session.joined;
    const nickname = session.nickname;
    const slot = session.slot;
    session.joined = false;
    session.slot = null;

    if (phase === "playing" && game) {
      if (slot !== null && slot !== undefined) game.removePlayer(slot);
      if (wasJoined) broadcastChat(null, `${nickname} left`);
      return;
    }

    if (!wasJoined) return;
    lobby.leave(session.id);
    broadcastChat(null, `${nickname} left`);
    tickLobby();
  }

  function stop() {
    stopped = true;
    stopPoll();
    if (loop) {
      loop.stop();
      loop = null;
    }
    game = null;
  }

  return {
    handle,
    handleConnect,
    handleDisconnect,
    stop,
    get phase() {
      return phase;
    },
    get playerCount() {
      return currentCount();
    },
  };
}
