/* ==========================================
   MAIN ENTRY POINT & SPA ROUTER
   ========================================== */

import { render } from './framework/index.js';
import { store, storeActions } from './state/store.js';
import { createSocket } from './net/socket.js';
import { 
  createNicknameScreen, 
  createLobbyScreen, 
  createGameScreen, 
  createGameOverScreen 
} from './components/screens.js';
import { createChatPanel } from './components/chatPanel.js';
import { initFPSMeter } from './components/fpsMeter.js';

const socket = createSocket();
const appContainer = document.getElementById('app');

function normalizePlayers(players = []) {
  return players.map((player, index) => {
    if (typeof player === 'string') {
      return { id: String(index), slot: index, nickname: player };
    }

    return {
      ...player,
      id: player.id ?? String(player.slot ?? index),
      slot: player.slot ?? index,
      nickname: player.nickname ?? player.name ?? ''
    };
  });
}

function handleLobbyUpdate(data) {
  storeActions.setPlayers(normalizePlayers(data.players));
  const timer = data.timer;
  storeActions.setLobbyTimer(
    timer && typeof timer === 'object' ? timer.secondsLeft : timer
  );
}

function handleChatMessage(data) {
  storeActions.addChatMessage({
    sender: data.from ?? data.sender ?? 'System',
    text: data.text,
    time: data.ts
      ? new Date(data.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    colorIndex: 0
  });
}

function handleGameStart(data) {
  storeActions.setPlayers(normalizePlayers(data.players));
  storeActions.setWinner(null);
  storeActions.setScreen('game');
}

function handleGameOver(data) {
  const state = store.getState();
  const players = normalizePlayers(data.players ?? state.players);
  storeActions.setPlayers(players);
  const winner = data.winner == null
    ? null
    : players.find((player) => player.slot === data.winner) ?? null;
  storeActions.setWinner(winner);
  storeActions.setScreen('gameover');
}

function registerSocketHandlers() {
  socket.on('joined', (data) => {
    if (data.nickname) storeActions.setUserNickname(data.nickname);
    storeActions.setPlayers([]);
    storeActions.setLobbyTimer(null);
    storeActions.setError(null);
    storeActions.setWinner(null);
    storeActions.setScreen('lobby');
  });
  socket.on('error', (data) => {
    storeActions.setError(data.message ?? data.code);
    if (
      ['NICK_INVALID', 'NICK_TAKEN', 'ROOM_FULL', 'GAME_IN_PROGRESS'].includes(data.code)
    ) {
      storeActions.setScreen('nickname');
    }
  });

  for (const type of ['lobby:update', 'lobby']) {
    socket.on(type, handleLobbyUpdate);
  }
  for (const type of ['chat:message', 'chat']) {
    socket.on(type, handleChatMessage);
  }
  for (const type of ['game:start', 'start']) {
    socket.on(type, handleGameStart);
  }
  for (const type of ['game:over', 'gameover']) {
    socket.on(type, handleGameOver);
  }
}

function renderApp(state) {
  if (!appContainer) return;

  const chatVNode = createChatPanel(state, (messageText) => {
    socket.send('chat', { text: messageText });
  });

  let vnode = null;

  switch (state.currentScreen) {
    case 'nickname':
      vnode = createNicknameScreen(state, (nickname) => {
        storeActions.setUserNickname(nickname);
        socket.send('join', { nickname });
      });
      break;

    case 'lobby':
      vnode = createLobbyScreen(state, chatVNode);
      break;

    case 'game':
      vnode = createGameScreen(state, chatVNode);
      break;

    case 'gameover':
      vnode = createGameOverScreen(state, () => {
        socket.send('join', { nickname: state.user.nickname });
      });
      break;

    default:
      vnode = createNicknameScreen(state, () => {});
  }

  // Framework's VDOM render call
  render(vnode, appContainer);
}

function initApp() {
  registerSocketHandlers();
  socket.connect();

  // Start FPS Meter overlay
  initFPSMeter('fps-meter');

  // Subscribe render function to store changes
  store.subscribe((state) => {
    renderApp(state);
  });

  // Execute initial render using getState()
  renderApp(store.getState());
}

// Safely execute initApp regardless of script load state
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}