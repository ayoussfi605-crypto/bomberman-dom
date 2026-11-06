import { pushChat, setError } from '../state/store.js';

const JOIN_REJECTION_CODES = new Set([
  'NICK_INVALID',
  'NICK_TAKEN',
  'ROOM_FULL',
  'GAME_IN_PROGRESS'
]);

export function initNetHandlers({ socket, store }) {
  let joinPending = false;
  const off = [];
  const listen = (type, handler) => off.push(socket.on(type, handler));

  listen('hello', (data) => {
    const state = store.getState();
    store.setState({
      phase: data.phase,
      lobby: {
        ...state.lobby,
        count: data.count,
        max: data.max
      }
    });
  });

  listen('joined', (data) => {
    joinPending = false;
    store.setState((state) => ({
      me: { nickname: data.nickname, slot: null },
      screen: 'lobby',
      error: null,
      result: null,
      players: [],
      chat: [],
      lobby: { ...state.lobby, players: [], count: 0, timer: null }
    }));
  });

  listen('error', (data) => {
    joinPending = false;
    setError(data.code, data.message ?? data.code ?? 'Unable to join', store);
    if (JOIN_REJECTION_CODES.has(data.code)) {
      store.setState({ screen: 'nickname' });
    }
  });

  listen('start', (data) => {
    const me = data.players.find((player) => player.slot === data.you);
    store.setState({
      phase: 'playing',
      screen: 'game',
      me: me ? { nickname: me.nickname, slot: data.you } : store.getState().me,
      players: data.players
    });
  });

  listen('gameover', (data) => {
    store.setState({
      phase: 'lobby',
      screen: 'over',
      result: data
    });
  });

  listen('lobby', (data) => {
    store.setState({ lobby: data });
  });

  listen('chat', (data) => {
    pushChat(data, store);
  });

  off.push(socket.onStatus((status) => {
    if (status === 'closed') joinPending = false;
  }));

  return {
    join(nickname) {
      if (joinPending || socket.status !== 'open') return false;
      joinPending = true;
      socket.send('join', { nickname });
      return true;
    },
    cleanup() {
      joinPending = false;
      for (const unsubscribe of off) unsubscribe();
    }
  };
}
