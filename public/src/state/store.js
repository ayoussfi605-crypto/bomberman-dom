/* ==========================================
   APP CENTRAL STORE 
   ========================================== */

// Import State class from your mini-framework
// Adjust the path to where your framework's State class is located
import { State } from '../framework/state.js';

/**
 * Initial State Structure for UI & App Shell
 */
const initialState = {
  // Navigation & Connection State
  currentScreen: 'nickname', // 'nickname' | 'lobby' | 'game' | 'gameover'
  isConnected: false,
  connectionError: null,

  // Local User Info
  user: {
    nickname: '',
    id: null,
    colorIndex: 0 // 0 to 3
  },

  // Lobby & Match State
  players: [], // Array of joined players [{ id, nickname, isReady, colorIndex }]
  lobbyTimer: null, // 20s or 10s countdown
  gameStatus: 'idle', // 'idle' | 'waiting' | 'starting' | 'playing' | 'ended'

  // Chat Data
  chatMessages: [], // Array of [{ sender: 'nickname', text: '', time: '', colorIndex: 0 }]

  // Performance & Game Results
  winner: null
};

/**
 * Global App Store Instance with Microtask Batching
 */
export const store = new State(initialState, { batch: 'microtask' });

/**
 * Helper Actions for updating state cleanly
 */
export const storeActions = {
  setScreen(screenName) {
    store.set({ currentScreen: screenName });
  },

  setUserNickname(nickname) {
    store.set({
      user: { ...store.get().user, nickname }
    });
  },

  setPlayers(playersList) {
    store.set({ players: playersList });
  },

  addChatMessage(message) {
    const currentMsgs = store.get().chatMessages;
    store.set({ chatMessages: [...currentMsgs, message] });
  },

  setLobbyTimer(seconds) {
    store.set({ lobbyTimer: seconds });
  },

  setError(errorMsg) {
    store.set({ connectionError: errorMsg });
  }
};