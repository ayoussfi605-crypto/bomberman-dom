import { h } from '../../framework/index.js';

let joinAction = () => {};

function onSubmit(event) {
  event.preventDefault();
  const nickname = event.currentTarget.elements.namedItem('nickname').value.trim();
  if (nickname) joinAction(nickname);
}

export function nicknameScreen(state, onJoin) {
  joinAction = onJoin;
  const connectionText = state.connection === 'connecting'
    ? 'Connecting…'
    : state.connection === 'closed'
      ? 'Disconnected — refresh the page'
      : 'Connected';

  return h('main', { class: 'screen-card nickname-card' },
    h('h1', { class: 'screen-title' }, 'Bomberman DOM'),
    h('p', { class: 'screen-description' }, 'Choose a nickname to join the waiting room.'),
    h('form', { class: 'nickname-form', onSubmit },
      h('label', { for: 'nickname-input' }, 'Nickname'),
      h('input', {
        class: 'nickname-input',
        id: 'nickname-input',
        name: 'nickname',
        type: 'text',
        maxlength: '12',
        minlength: '2',
        required: true,
        autofocus: true,
        autocomplete: 'off',
        value: state.me?.nickname ?? ''
      }),
      h('button', {
        class: 'btn-primary',
        type: 'submit',
        disabled: state.connection !== 'open'
      }, 'Join')
    ),
    h('p', { class: 'connection-status', role: 'status' }, connectionText),
    state.phase === 'playing'
      ? h('p', { class: 'phase-notice' }, 'A game is in progress. You can join when it ends.')
      : null,
    state.error
      ? h('p', { class: 'error-badge', role: 'alert' }, state.error.message)
      : null
  );
}
