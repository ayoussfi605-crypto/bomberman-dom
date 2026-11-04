/* ==========================================
   UI SCREENS GENERATOR (Ayoub Task)
   ========================================== */

/**
 * 1. Render Nickname Screen
 */
export function createNicknameScreen(state, onSubmit) {
  const container = document.createElement('div');
  container.className = 'screen-card';

  container.innerHTML = `
    <h1 class="screen-title">Bomberman DOM</h1>
    <form class="nickname-form" id="nickname-form">
      <input 
        type="text" 
        id="nickname-input" 
        class="nickname-input" 
        placeholder="Enter your nickname..." 
        maxlength="12"
        required 
        autocomplete="off"
      />
      <button type="submit" class="btn-primary">JOIN GAME</button>
    </form>
    ${state.connectionError ? `<div class="error-badge">${state.connectionError}</div>` : ''}
  `;

  const form = container.querySelector('#nickname-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = container.querySelector('#nickname-input');
    const name = input.value.trim();
    if (name) onSubmit(name);
  });

  return container;
}

/**
 * 2. Render Lobby Waiting Room Screen
 */
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