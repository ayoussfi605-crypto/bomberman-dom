/* ==========================================
   UI SCREENS GENERATOR 
   ========================================== */

import { h } from '../framework/index.js';

// 1. Render Nickname Screen
export function createNicknameScreen(state, onSubmit) {
  return h('div', { class: 'screen-card' },
    h('h1', { class: 'screen-title' }, 'Bomberman DOM'),
    h('form', {
      class: 'nickname-form',
      onsubmit: (e) => {
        e.preventDefault();
        const input = e.target.querySelector('#nickname-input');
        if (input && input.value.trim()) onSubmit(input.value.trim());
      }
    },
      h('input', {
        type: 'text',
        id: 'nickname-input',
        class: 'nickname-input',
        placeholder: 'Enter your nickname...',
        maxlength: '12',
        required: true,
        autocomplete: 'off'
      }),
      h('button', { type: 'submit', class: 'btn-primary' }, 'JOIN GAME')
    ),
    state.connectionError ? h('div', { class: 'error-badge' }, state.connectionError) : null
  );
}

// 2. Render Lobby Waiting Room Screen
export function createLobbyScreen(state) {
  const container = document.createElement('div');
  container.className = 'screen-card lobby-card';

  const count = state.players.length;
  const timerText = state.lobbyTimer !== null 
    ? `Match starting in: ${state.lobbyTimer}s` 
    : 'Waiting for players to join...';

  // Generate 4 slots
  let slotsHTML = '';
  for (let i = 0; i < 4; i++) {
    const player = state.players[i];
    if (player) {
      slotsHTML += `
        <div class="player-slot filled" style="border-color: var(--p${i}-color);">
          <span class="color-indicator p${i}-bg"></span>
          <span>${player.nickname} ${player.id === state.user.id ? '(YOU)' : ''}</span>
        </div>
      `;
    } else {
      slotsHTML += `
        <div class="player-slot">
          <span class="color-indicator" style="background-color: var(--text-muted)"></span>
          <span style="color: var(--text-muted)">Waiting...</span>
        </div>
      `;
    }
  }

  container.innerHTML = `
    <h1 class="screen-title">LOBBY ROOM</h1>
    <div class="counter-badge">${count} / 4 PLAYERS</div>
    <div class="timer-badge">${timerText}</div>
    <div class="player-list">${slotsHTML}</div>
  `;

  return container;
}

/**
 * 3. Render Game Over Screen
 */
export function createGameOverScreen(state, onRestart) {
  const container = document.createElement('div');
  container.className = 'screen-card';

  const winnerName = state.winner ? state.winner.nickname : 'DRAW!';

  container.innerHTML = `
    <h1 class="screen-title">GAME OVER</h1>
    <h2 style="margin-bottom: 24px; color: var(--p1-color);">Winner: ${winnerName}</h2>
    <button id="btn-restart" class="btn-primary">BACK TO LOBBY</button>
  `;

  container.querySelector('#btn-restart').addEventListener('click', onRestart);
  return container;
}


// 4. Render Game Screen Layout (Shell for Game Board + Chat Sidebar)
export function createGameScreen(state) {
  const container = document.createElement('div');
  container.className = 'game-screen-layout';

  // Render player stats header
  let statsHTML = '<div class="players-header">';
  state.players.forEach((player, i) => {
    statsHTML += `
      <div class="player-stat-card p${i}-border">
        <span class="color-indicator p${i}-bg"></span>
        <span class="player-name">${player.nickname}</span>
        <span class="player-lives">❤️ x3</span>
      </div>
    `;
  });
  statsHTML += '</div>';

  container.innerHTML = `
    <!-- Top Player Stats Bar -->
    ${statsHTML}

    <!-- Main Game Area: Board + Chat Sidebar -->
    <div class="game-main-content">
      <!-- 1. Reserved Area for Teammate's Game Board Engine -->
      <div id="game-board" class="game-board-container">
        <!-- Game engine will render map cells here -->
      </div>

      <!-- 2. Reserved Area for Ayoub's Chat UI -->
      <div id="chat-container" class="chat-sidebar-container">
        <!-- Chat UI component will be mounted here -->
      </div>
    </div>
  `;

  return container;
}