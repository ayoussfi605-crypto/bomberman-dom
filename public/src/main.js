import { render } from './framework/index.js';
import { store, storeActions } from './state/store.js';
import { 
  createNicknameScreen, 
  createLobbyScreen, 
  createGameScreen, 
  createGameOverScreen 
} from './components/screens.js';
import { createChatPanel } from './components/chatPanel.js';
import { initFPSMeter } from './components/fpsMeter.js';

const appContainer = document.getElementById('app');

function renderApp(state) {
  if (!appContainer) return;

  // Helper to construct Chat VNode cleanly
  const chatVNode = createChatPanel(state, (messageText) => {
    storeActions.addChatMessage({
      sender: state.user.nickname || 'Player',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      colorIndex: 0
    });
  });

  let vnode = null;

  switch (state.currentScreen) {
    case 'nickname':
      vnode = createNicknameScreen(state, (nickname) => {
        storeActions.setUserNickname(nickname);
        storeActions.setScreen('lobby');
        storeActions.setPlayers([{ id: '1', nickname, isReady: true }]);
      });
      break;

    case 'lobby':
      vnode = createLobbyScreen(state, chatVNode);
      break;

    case 'game':
      // Pass Chat VNode directly into Game Screen!
      vnode = createGameScreen(state, chatVNode);
      break;

    case 'gameover':
      vnode = createGameOverScreen(state, () => {
        storeActions.setScreen('lobby');
      });
      break;

    default:
      vnode = createNicknameScreen(state, () => {});
  }

  // Framework's VDOM render call
  render(vnode, appContainer);
}

function initApp() {
  initFPSMeter('fps-meter');
  store.subscribe((state) => renderApp(state));
  renderApp(store.get());
}

document.addEventListener('DOMContentLoaded', initApp);