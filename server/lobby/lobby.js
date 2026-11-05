import {
  ERR,
  LOBBY_COUNTDOWN_MS,
  LOBBY_WAIT_MS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  NICK_MAX,
  NICK_MIN,
  NICK_REGEX,
} from "../../shared/constants.js";

/** @returns {string | null} an ERR code, or null when the nickname is usable. */
export function validateNickname(raw, takenNicknames = []) {
  if (typeof raw !== "string") return ERR.NICK_INVALID;

  const nickname = raw.trim();
  if (nickname.length < NICK_MIN || nickname.length > NICK_MAX)
    return ERR.NICK_INVALID;
  if (!NICK_REGEX.test(nickname)) return ERR.NICK_INVALID;

  const lower = nickname.toLowerCase();
  if (takenNicknames.some((other) => other.toLowerCase() === lower))
    return ERR.NICK_TAKEN;

  return null;
}

export function createLobby({
  now = () => Date.now(),
  maxPlayers = MAX_PLAYERS,
  waitMs = LOBBY_WAIT_MS,
  countdownMs = LOBBY_COUNTDOWN_MS,
} = {}) {
  const players = new Map();
  let timer = null;

  function nicknames() {
    return [...players.values()].map((player) => player.nickname);
  }

  function startTimer(kind, durationMs) {
    timer = { kind, endsAt: now() + durationMs };
  }

  function join(id, rawNickname) {
    if (players.has(id)) return { ok: false, code: ERR.ALREADY_JOINED };

    const code = validateNickname(rawNickname, nicknames());
    if (code) return { ok: false, code };
    if (players.size >= maxPlayers) return { ok: false, code: ERR.ROOM_FULL };

    const nickname = rawNickname.trim();
    players.set(id, { id, nickname });

    if (players.size >= maxPlayers) {
      if (!timer || timer.kind !== "start") startTimer("start", countdownMs);
    } else if (players.size >= MIN_PLAYERS && !timer) {
      startTimer("wait", waitMs);
    }

    return { ok: true, nickname };
  }

  function leave(id) {
    const removed = players.delete(id);
    if (removed && players.size < MIN_PLAYERS) timer = null;
    return removed;
  }

  /** Call every ~100 ms. @returns null | { event: "start", players: [{id, nickname}] } */
  function update() {
    if (!timer) return null;
    if (now() < timer.endsAt) return null;

    if (timer.kind === "wait") {
      startTimer("start", countdownMs);
      return null;
    }

    const entries = [...players.values()].map((player) => ({
      id: player.id,
      nickname: player.nickname,
    }));
    timer = null;

    if (entries.length < MIN_PLAYERS) return null; // safety net
    return { event: "start", players: entries };
  }

  function view() {
    const list = nicknames();
    let timerView = null;

    if (timer) {
      const remaining = Math.max(0, timer.endsAt - now());
      timerView = {
        kind: timer.kind,
        secondsLeft: Math.ceil(remaining / 1000),
      };
    }

    return {
      players: list,
      count: list.length,
      max: maxPlayers,
      timer: timerView,
    };
  }

  return { join, leave, update, view, has: (id) => players.has(id) };
}
