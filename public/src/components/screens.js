import { h } from '../framework/index.js';

/**
 * 1. Nickname Screen
 */
export function createNicknameScreen(state, onSubmit) {
  return h('div', { class: 'screen-card' },
    h('h1', { class: 'screen-title' }, 'Bomberman DOM'),
    h('form', {
      class: 'nickname-form',
      onSubmit: (e) => { // CamelCase onSubmit!
        e.preventDefault();
        const input = document.getElementById('nickname-input');
        if (input && input.value.trim()) {
          onSubmit(input.value.trim());
        }
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

/**
 * 2. Lobby Waiting Room Screen
 */
export function createLobbyScreen(state, chatVNode) {
  const count = state.players.length;
  const timerText = state.lobbyTimer !== null 
    ? `Match starting in: ${state.lobbyTimer}s` 
    : 'Waiting for players to join...';

  const playerSlots = [];
  for (let i = 0; i < 4; i++) {
    const player = state.players[i];
    if (player) {
      playerSlots.push(
        h('div', { class: 'player-slot filled', style: `border-color: var(--p${i}-color);` },
          h('span', { class: `color-indicator p${i}-bg` }),
          h('span', {}, `${player.nickname} ${player.id === state.user.id ? '(YOU)' : ''}`)
        )
      );
    } else {
      playerSlots.push(
        h('div', { class: 'player-slot' },
          h('span', { class: 'color-indicator', style: 'background-color: var(--text-muted)' }),
          h('span', { style: 'color: var(--text-muted)' }, 'Waiting...')
        )
      );
    }
  }

  return h('div', { class: 'screen-card lobby-card' },
    h('h1', { class: 'screen-title' }, 'LOBBY ROOM'),
    h('div', { class: 'counter-badge' }, `${count} / 4 PLAYERS`),
    h('div', { class: 'timer-badge' }, timerText),
    h('div', { class: 'player-list' }, ...playerSlots),
    chatVNode ? h('div', { style: 'width:100%; margin-top:16px;' }, chatVNode) : null
  );
}

/**
 * 3. Game Over Screen
 */
export function createGameOverScreen(state, onRestart) {
  const winnerName = state.winner ? state.winner.nickname : 'DRAW!';

  return h('div', { class: 'screen-card' },
    h('h1', { class: 'screen-title' }, 'GAME OVER'),
    h('h2', { style: 'margin-bottom: 24px; color: var(--p1-color);' }, `Winner: ${winnerName}`),
    h('button', { class: 'btn-primary', onClick: onRestart }, 'BACK TO LOBBY') // CamelCase onClick!
  );
}

/**
 * 4. Game Screen Layout
 */
export function createGameScreen(state, chatVNode) {
  const playerStats = state.players.map((player, i) => 
    h('div', { class: `player-stat-card p${i}-border` },
      h('span', { class: `color-indicator p${i}-bg` }),
      h('span', { class: 'player-name' }, player.nickname),
      h('span', { class: 'player-lives' }, '❤️ x3')
    )
  );

  return h('div', { class: 'game-screen-layout' },
    h('div', { class: 'players-header' }, ...playerStats),
    h('div', { class: 'game-main-content' },
      h('div', { id: 'game-board', class: 'game-board-container' }),
      h('div', { id: 'chat-container', class: 'chat-sidebar-container' }, chatVNode)
    )
  );
}