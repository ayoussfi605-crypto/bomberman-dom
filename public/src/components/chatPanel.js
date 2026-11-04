/* ==========================================
   CHAT UI COMPONENT
   ========================================== */
/**
 * Creates and mounts the Chat Panel UI
 * @param {Object} state - Current global store state
 * @param {Function} onSendMessage - Callback function when user sends a message
 */
export function createChatPanel(state, onSendMessage) {
  const container = document.createElement('div');
  container.className = 'chat-panel';

  // Generate HTML for existing messages
  const messagesHTML = state.chatMessages.map((msg) => `
    <div class="chat-message">
      <span class="sender" style="color: var(--p${msg.colorIndex ?? 0}-color);">${msg.sender}:</span>
      <span class="text">${escapeHTML(msg.text)}</span>
      <span class="timestamp">${msg.time || ''}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="chat-header">GAME CHAT</div>
    <div class="chat-messages" id="chat-messages">${messagesHTML}</div>
    <form class="chat-form" id="chat-form">
      <input 
        type="text" 
        id="chat-input" 
        class="chat-input" 
        placeholder="Type a message..." 
        maxlength="100" 
        autocomplete="off"
      />
      <button type="submit" class="chat-submit-btn">SEND</button>
    </form>
  `;

  const input = container.querySelector('#chat-input');
  const form = container.querySelector('#chat-form');
  const messagesContainer = container.querySelector('#chat-messages');

  // Auto-scroll to bottom on load
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // IMPORTANT: Stop keyboard events propagation while typing in chat
  // Prevents character movement keypresses from firing in the game engine
  const stopProp = (e) => e.stopPropagation();
  input.addEventListener('keydown', stopProp);
  input.addEventListener('keyup', stopProp);
  input.addEventListener('keypress', stopProp);

  // Form Submit Event
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      onSendMessage(text);
      input.value = ''; // Reset input without re-rendering whole component
    }
  });

  return container;
}

/**
 * Security Helper to sanitize user input against XSS
 */
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}