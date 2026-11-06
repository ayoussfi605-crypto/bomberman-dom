import { State } from '../framework/index.js';

const initialState = {
  connection: 'closed',
  phase: 'lobby',
  screen: 'nickname',
  me: null,
  error: null,
  lobby: {
    players: [],
    count: 0,
    max: 4,
    timer: null
  },
  chat: [],
  players: [],
  result: null
};

export const store = new State(initialState, { batch: 'microtask' });

export function pushChat(message, targetStore = store) {
  const chat = targetStore.getState().chat;
  targetStore.setState({ chat: [...chat.slice(-99), message] });
}

export function setError(code, message, targetStore = store) {
  targetStore.setState({ error: { code, message } });
}

export function clearError(targetStore = store) {
  targetStore.setState({ error: null });
}
