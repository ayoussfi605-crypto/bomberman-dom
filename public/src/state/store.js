/* ==========================================
   APP CENTRAL STORE
   ========================================== */

import { State } from '../framework/index.js';

const initialState = {
  currentScreen: 'nickname', // 'nickname' | 'lobby' | 'game' | 'gameover'
  user: {
    id: null,
    nickname: ''
  },
  players: [],
  lobbyTimer: null,
  chatMessages: [],
  connectionError: null,
  winner: null
};

// Instantiating State with microtask batching as defined in your framework
export const store = new State(initialState, { batch: 'microtask' });

export const storeActions = {
  setScreen(screenName) {
    store.setState({ currentScreen: screenName });
  },

  setUserNickname(nickname) {
    const currentState = store.getState();
    store.setState({
      user: { ...currentState.user, nickname }
    });
  },

  setPlayers(playersList) {
    store.setState({ players: playersList });
  },

  addChatMessage(message) {
    const currentState = store.getState();
    store.setState({
      chatMessages: [...currentState.chatMessages, message]
    });
  },

  setLobbyTimer(seconds) {
    store.setState({ lobbyTimer: seconds });
  },

  setError(errorMsg) {
    store.setState({ connectionError: errorMsg });
  },

  setWinner(winner) {
    store.setState({ winner });
  }
};