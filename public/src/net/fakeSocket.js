export function createFakeSocket({
  botEveryMs = 2000,
  waitMs = 20000,
  countdownMs = 10000,
  matchMs = 40000,
  timerTickMs = 1000,
  tileCycleMs = 4000
} = {}) {
  const handlers = new Map();
  const statusHandlers = new Set();
  const timers = new Set();
  let status = 'closed';
  let connected = false;
  let phase = 'lobby';
  let nicknames = [];
  let timer = null;
  let timerStartedAt = 0;
  let timerDuration = 0;
  let botIndex = 1;
  let snapshotTick = 0;

  function setStatus(next) {
    if (status === next) return;
    status = next;
    for (const callback of [...statusHandlers]) callback(status);
  }

  function emit(type, data) {
    for (const callback of [...(handlers.get(type) ?? [])]) callback(data);
  }

  function later(callback, delay) {
    const id = setTimeout(() => {
      timers.delete(id);
      if (connected) callback();
    }, delay);
    timers.add(id);
    return id;
  }

  function every(callback, delay) {
    const id = setInterval(() => {
      if (connected) callback();
    }, delay);
    timers.add(id);
    return id;
  }

  function clearTimer(id) {
    clearTimeout(id);
    clearInterval(id);
    timers.delete(id);
  }

  function clearTimers() {
    for (const id of timers) {
      clearTimeout(id);
      clearInterval(id);
    }
    timers.clear();
    timer = null;
  }

  function publishLobby() {
    emit('lobby', {
      players: [...nicknames],
      count: nicknames.length,
      max: 4,
      timer: timer
        ? {
          kind: timer.kind,
          secondsLeft: Math.ceil(Math.max(0, timerDuration - (Date.now() - timerStartedAt)) / 1000)
        }
        : null
    });
  }

  function beginTimer(kind, duration) {
    if (timer) clearTimer(timer.interval);
    timer = { kind, interval: null };
    timerStartedAt = Date.now();
    timerDuration = duration;
    publishLobby();
    timer.interval = every(() => {
      const left = timerDuration - (Date.now() - timerStartedAt);
      if (left <= 0) {
        clearTimer(timer.interval);
        timer = null;
        if (kind === 'wait') beginTimer('start', countdownMs);
        else beginMatch();
      } else {
        publishLobby();
      }
    }, timerTickMs);
  }

  function maybeStartTimer() {
    if (nicknames.length >= 4) {
      if (!timer || timer.kind !== 'start') beginTimer('start', countdownMs);
    } else if (nicknames.length >= 2 && !timer) {
      beginTimer('wait', waitMs);
    } else {
      publishLobby();
    }
  }

  function makeTiles() {
    const cols = 15;
    const rows = 13;
    const tiles = Array(cols * rows).fill(0);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const index = y * cols + x;
        if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1 || (x % 2 === 0 && y % 2 === 0)) {
          tiles[index] = 1;
        } else if (x > 2 && y > 2 && (x + y) % 3 === 0) {
          tiles[index] = 2;
        }
      }
    }
    for (const [x, y] of [[1, 1], [2, 1], [1, 2], [13, 11], [12, 11], [13, 10]]) {
      tiles[y * cols + x] = 0;
    }
    return tiles;
  }

  function beginMatch() {
    phase = 'playing';
    const players = nicknames.map((nickname, slot) => ({ slot, nickname }));
    const tiles = makeTiles();
    emit('start', {
      you: 0,
      cols: 15,
      rows: 13,
      players,
      tiles: [...tiles]
    });
    snapshotTick = 0;
    every(() => {
      const tileIndex = 3 * 15 + 3;
      tiles[tileIndex] = tiles[tileIndex] === 3 ? 4 : tiles[tileIndex] === 4 ? 0 : 3;
      emit('tiles', { tiles: [...tiles] });
    }, tileCycleMs);
    every(() => {
      snapshotTick += 1;
      emit('snapshot', {
        tick: snapshotTick,
        players: players.map((player) => ({
          ...player,
          x: 1.5 + player.slot * 2 + Math.sin(snapshotTick / 30 + player.slot) * 0.3,
          y: 1.5 + Math.cos(snapshotTick / 30 + player.slot) * 0.3,
          dir: 'right',
          moving: true,
          alive: true,
          lives: 3,
          invulnerable: false,
          maxBombs: 1,
          range: 2,
          speedLevel: 0
        }))
      });
    }, 1000 / 30);
    later(() => {
      clearTimers();
      emit('gameover', {
        winner: 0,
        players: players.map((player, index) => ({
          ...player,
          lives: index === 0 ? 2 : 0
        }))
      });
      phase = 'lobby';
      nicknames = [];
      emit('hello', { phase, count: 0, max: 4 });
    }, matchMs);
  }

  function addBots() {
    if (!connected || phase !== 'lobby' || nicknames.length === 0 || nicknames.length >= 4) return;
    nicknames.push(`Bot${botIndex++}`);
    maybeStartTimer();
    if (phase === 'lobby' && nicknames.length < 4) {
      botTimer = later(addBots, botEveryMs);
    }
  }

  function connect() {
    if (connected) return;
    connected = true;
    setStatus('open');
    emit('hello', { phase, count: 0, max: 4 });
  }

  function send(type, data) {
    if (!connected) {
      console.warn(`[fake-socket] dropped "${type}": the connection is not open`);
      return;
    }
    if (type === 'join') {
      const nickname = typeof data?.nickname === 'string' ? data.nickname.trim() : '';
      if (nickname.toLowerCase() === 'taken') {
        emit('error', { code: 'NICK_TAKEN', message: 'Nickname already used' });
        return;
      }
      if (nickname.length < 2) {
        emit('error', { code: 'NICK_INVALID', message: 'Nickname must be at least 2 characters' });
        return;
      }
      if (phase === 'playing') {
        emit('error', { code: 'GAME_IN_PROGRESS', message: 'A game is already in progress' });
        return;
      }
      if (nicknames.length >= 4) {
        emit('error', { code: 'ROOM_FULL', message: 'Room is full' });
        return;
      }
      if (nicknames.some((name) => name.toLowerCase() === nickname.toLowerCase())) {
        emit('error', { code: 'NICK_TAKEN', message: 'Nickname already used' });
        return;
      }
      nicknames.push(nickname);
      emit('joined', { nickname });
      maybeStartTimer();
      if (!timers.has(botTimer)) botTimer = later(addBots, botEveryMs);
      return;
    }
    if (type === 'chat') {
      emit('chat', { from: data?.text ? 'You' : null, text: data?.text ?? '', ts: Date.now() });
    }
  }

  function on(type, callback) {
    if (!handlers.has(type)) handlers.set(type, new Set());
    handlers.get(type).add(callback);
    return () => {
      const callbacks = handlers.get(type);
      callbacks?.delete(callback);
      if (callbacks?.size === 0) handlers.delete(type);
    };
  }

  function onStatus(callback) {
    statusHandlers.add(callback);
    callback(status);
    return () => statusHandlers.delete(callback);
  }

  function close() {
    connected = false;
    clearTimers();
    setStatus('closed');
  }

  let botTimer = null;
  return { connect, send, on, onStatus, close, emit, get status() { return status; } };
}
