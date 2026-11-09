import { h, handleKey } from '../../framework/index.js';

let socket = null;
let chatSidebarOpen = false;

export function setChatSocket(nextSocket) {
  socket = nextSocket;
}

function sendText(input, event) {
  const text = input.value.trim();
  if (!text) return;
  socket?.send('chat', { text });
  input.value = '';
  event.preventDefault();
}

function submitChat(event) {
  event.preventDefault();
  const input = event.currentTarget.elements.namedItem('message');
  if (input) sendText(input, event);
}

function sendOnEnter(event) {
  sendText(event.target, event);
}

function blurOnEscape(event) {
  event.target.blur();
}

function onKeyDown(event) {
  event.stopPropagation();
  handleKey(event, sendOnEnter, blurOnEscape);
}

function onSubmit(event) {
  submitChat(event);
}

function toggleChatSidebar(event) {
  chatSidebarOpen = !chatSidebarOpen;
  const sidebar = event.currentTarget.closest('.chat-sidebar');
  sidebar?.classList.toggle('is-open', chatSidebarOpen);
  event.currentTarget.setAttribute('aria-expanded', String(chatSidebarOpen));
  event.currentTarget.textContent = chatSidebarOpen ? 'Close chat' : 'Chat';
}

export function chatPanel(messages) {
  const entries = messages.map((message) => {
    const isSystem = message.from === null || message.system === true;
    return h('li', {
      class: isSystem ? 'chat-message system-message' : 'chat-message'
    },
    isSystem ? h('span', { class: 'chat-system-text' }, message.text) : [
      h('span', { class: 'chat-sender' }, `${message.from ?? message.sender ?? 'Player'}: `),
      h('span', { class: 'chat-text' }, message.text)
    ]);
  });

  return h('section', { class: 'chat', 'aria-label': 'Game chat' },
    h('div', { class: 'chat-header' },
      h('h2', {}, 'Arena chat'),
      h('span', { class: 'chat-status' }, 'LIVE')
    ),
    h('ul', { class: 'chat-log', id: 'chat-log', 'aria-live': 'polite' }, ...entries),
    h('form', { class: 'chat-form', onSubmit },
      h('input', {
        class: 'chat-input',
        id: 'chat-input',
        name: 'message',
        type: 'text',
        maxlength: '200',
        placeholder: 'Type a message…',
        autocomplete: 'off',
        'aria-label': 'Chat message',
        onKeyDown
      }),
      h('button', { class: 'chat-submit-btn', type: 'submit' }, 'Send')
    )
  );
}

export function chatSidebar(messages, renderPanel = chatPanel) {
  return h('aside', {
    class: chatSidebarOpen ? 'chat-sidebar is-open' : 'chat-sidebar',
    'aria-label': 'Chat sidebar'
  },
  h('button', {
    class: 'chat-sidebar-toggle',
    type: 'button',
    'aria-expanded': String(chatSidebarOpen),
    onClick: toggleChatSidebar
  }, chatSidebarOpen ? 'Close chat' : 'Chat'),
  renderPanel(messages));
}
