import { h } from '../framework/index.js';

export function createChatPanel(state, onSendMessage) {
  const messagesVNodes = state.chatMessages.map((msg) =>
    h('div', { class: 'chat-message' },
      h('span', { class: 'sender', style: `color: var(--p${msg.colorIndex ?? 0}-color);` }, `${msg.sender}: `),
      h('span', { class: 'text' }, msg.text),
      h('span', { class: 'timestamp' }, msg.time || '')
    )
  );

  return h('div', { class: 'chat-panel' },
    h('div', { class: 'chat-header' }, 'GAME CHAT'),
    h('div', { class: 'chat-messages', id: 'chat-messages' }, ...messagesVNodes),
    h('form', {
      class: 'chat-form',
      onsubmit: (e) => {
        e.preventDefault();
        const input = e.target.querySelector('#chat-input');
        if (input && input.value.trim()) {
          onSendMessage(input.value.trim());
          input.value = '';
        }
      }
    },
      h('input', {
        type: 'text',
        id: 'chat-input',
        class: 'chat-input',
        placeholder: 'Type a message...',
        maxlength: '100',
        autocomplete: 'off',
        onkeydown: (e) => e.stopPropagation(),
        onkeyup: (e) => e.stopPropagation()
      }),
      h('button', { type: 'submit', class: 'chat-submit-btn' }, 'SEND')
    )
  );
}