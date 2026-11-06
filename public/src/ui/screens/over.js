import { h } from '../../framework/index.js';

let replayAction = () => {};

function onReplay() {
  replayAction();
}

export function overScreen(state, onReplayRequest) {
  replayAction = onReplayRequest;
  const winnerSlot = state.result?.winner;
  const winner = winnerSlot == null
    ? null
    : state.result?.players.find((player) => player.slot === winnerSlot);

  return h('main', { class: 'screen-card over-card' },
    h('p', { class: 'eyebrow' }, 'Match complete'),
    h('h1', { class: 'screen-title' }, winner ? `${winner.nickname} wins!` : 'Draw'),
    h('table', { class: 'results-table' },
      h('caption', {}, 'Final results'),
      h('thead', {}, h('tr', {},
        h('th', { scope: 'col' }, 'Player'),
        h('th', { scope: 'col' }, 'Lives')
      )),
      h('tbody', {}, ...(state.result?.players ?? []).map((player) =>
        h('tr', {},
          h('td', {}, player.nickname),
          h('td', {}, String(player.lives))
        )
      ))
    ),
    h('button', { class: 'btn-primary', type: 'button', onClick: onReplay }, 'Back to lobby')
  );
}
