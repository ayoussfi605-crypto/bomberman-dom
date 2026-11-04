/* ==========================================
   MAIN ENTRY POINT & SPA ROUTER 
   ========================================== */

import { store, storeActions } from './state/store.js';
import { 
  createNicknameScreen, 
  createLobbyScreen, 
  createGameScreen, 
  createGameOverScreen 
} from './components/screens.js';
import { createChatPanel } from './components/chatPanel.js';
import { initFPSMeter } from './components/fpsMeter.js';

// Target the main root container in index.html
const appContainer = document.getElementById('app');

/**
 * SPA Router: Renders the active screen based on state.currentScreen
 */
function renderApp(state) {
  if (!appContainer) return;
  
  // Clear previous UI
  appContainer.innerHTML = '';

  let currentScreenNode = null;

  switch (state.currentScreen) {
    case 'nickname':
      currentScreenNode = createNicknameScreen(state, (nickname) => {
        // Save nickname & transition to lobby screen
        storeActions.setUserNickname(nickname);
        storeActions.setScreen('lobby');

        // Mock player connection (Teammate's WebSocket logic will handle real socket event)
        storeActions.setPlayers([
          { id: '1', nickname: nickname, isReady: true }
        ]);
      });
      break;

    case 'lobby':
      currentScreenNode = createLobbyScreen(state);
      
      // Append Chat Panel inside Lobby Screen
      const lobbyChatWrapper = document.createElement('div');
      lobbyChatWrapper.style.width = '100%';
      lobbyChatWrapper.style.height = '240px';
      lobbyChatWrapper.style.marginTop = '16px';
      
      const chatNode = createChatPanel(state, (messageText) => {
        storeActions.addChatMessage({
          sender: state.user.nickname || 'Player',
          text: messageText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          colorIndex: 0
        });
      });
      
      lobbyChatWrapper.appendChild(chatNode);
      currentScreenNode.appendChild(lobbyChatWrapper);
      break;

    case 'game':
      currentScreenNode = createGameScreen(state);
      
      // Mount Chat UI into reserved #chat-container inside Game Screen layout
      const gameChatContainer = currentScreenNode.querySelector('#chat-container');
      if (gameChatContainer) {
        const gameChatNode = createChatPanel(state, (messageText) => {
          storeActions.addChatMessage({
            sender: state.user.nickname || 'Player',
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            colorIndex: 0
          });
        });
        gameChatContainer.appendChild(gameChatNode);
      }
      break;

    case 'gameover':
      currentScreenNode = createGameOverScreen(state, () => {
        // Return to lobby when clicking "Back to Lobby"
        storeActions.setScreen('lobby');
      });
      break;

    default:
      currentScreenNode = createNicknameScreen(state, () => {});
  }

  if (currentScreenNode) {
    appContainer.appendChild(currentScreenNode);
  }
}

/**
 * Initialize Application Shell
 */
function initApp() {
  // 1. Start Performance Overlay (60 FPS counter)
  initFPSMeter('fps-meter');

  // 2. Subscribe render loop to store changes (Microtask batched updates)
  store.subscribe((state) => {
    renderApp(state);
  });

  // 3. Initial render execution
  renderApp(store.get());
}

// Execute app init once DOM is ready
document.addEventListener('DOMContentLoaded', initApp);