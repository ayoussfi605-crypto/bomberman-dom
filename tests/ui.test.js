import test from 'node:test';
import assert from 'node:assert/strict';
import { State } from '../public/src/framework/index.js';
import { pushChat } from '../public/src/state/store.js';
import { initNetHandlers } from '../public/src/ui/netHandlers.js';
import { chatPanel, setChatSocket } from '../public/src/ui/components/chatPanel.js';
import { nicknameScreen } from '../public/src/ui/screens/nickname.js';
import { lobbyScreen } from '../public/src/ui/screens/lobby.js';
import { overScreen } from '../public/src/ui/screens/over.js';

function createTestStore() {
  return new State({
    connection: 'open',
    phase: 'lobby',
    screen: 'nickname',
    me: null,
    error: null,
    lobby: { players: [], count: 0, max: 4, timer: null },
    chat: [],
    players: [],
    result: null
  }, { batch: 'microtask' });
}

function createTestSocket() {
  const handlers = new Map();
  const statusHandlers = new Set();
  const sent = [];
  return {
    status: 'open',
    sent,
    on(type, callback) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(callback);
      return () => handlers.get(type)?.delete(callback);
    },
    onStatus(callback) {
      statusHandlers.add(callback);
      callback(this.status);
      return () => statusHandlers.delete(callback);
    },
    send(type, data) {
      sent.push({ type, data });
    },
    emit(type, data) {
      for (const callback of [...(handlers.get(type) ?? [])]) callback(data);
    }
  };
}

test('store chat append is immutable and capped at 100 entries', () => {
  const store = createTestStore();
  const originalChat = store.getState().chat;
  for (let index = 0; index < 105; index++) {
    pushChat({ from: 'Ada', text: String(index) }, store);
  }
  assert.notEqual(store.getState().chat, originalChat);
  assert.equal(store.getState().chat.length, 100);
  assert.equal(store.getState().chat[0].text, '5');
});

test('network handlers manage joins, lobby, chat, game and replay errors', async () => {
  const store = createTestStore();
  const socket = createTestSocket();
  const handlers = initNetHandlers({ socket, store });

  assert.equal(handlers.join('Ada'), true);
  assert.equal(handlers.join('Ada'), false);
  assert.deepEqual(socket.sent, [{ type: 'join', data: { nickname: 'Ada' } }]);

  socket.emit('joined', { nickname: 'Ada' });
  socket.emit('lobby', {
    players: ['Ada', 'Bob'],
    count: 2,
    max: 4,
    timer: { kind: 'wait', secondsLeft: 19 }
  });
  socket.emit('chat', { from: null, text: 'Ada joined', ts: 1 });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(store.getState().screen, 'lobby');
  assert.equal(store.getState().me.nickname, 'Ada');
  assert.equal(store.getState().lobby.timer.kind, 'wait');
  assert.equal(store.getState().chat[0].from, null);

  socket.emit('error', { code: 'ALREADY_JOINED', message: 'Already joined' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(store.getState().screen, 'lobby');

  socket.emit('start', {
    you: 0,
    players: [{ slot: 0, nickname: 'Ada' }, { slot: 1, nickname: 'Bob' }]
  });
  socket.emit('gameover', {
    winner: 1,
    players: [
      { slot: 0, nickname: 'Ada', lives: 0 },
      { slot: 1, nickname: 'Bob', lives: 1 }
    ]
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(store.getState().screen, 'over');
  assert.equal(store.getState().result.winner, 1);
  assert.equal(store.getState().phase, 'lobby');
  socket.emit('hello', { phase: 'lobby', count: 0, max: 4 });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(store.getState().screen, 'over');

  assert.equal(handlers.join('Ada'), true);
  socket.emit('error', { code: 'NICK_TAKEN', message: 'Nickname already used' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(store.getState().screen, 'nickname');
  assert.equal(store.getState().error.code, 'NICK_TAKEN');
  handlers.cleanup();
  socket.emit('hello', { phase: 'playing', count: 2, max: 4 });
  assert.equal(store.getState().phase, 'lobby');
});

test('chat panel is uncontrolled and sends Enter without bubbling game input', () => {
  const socket = createTestSocket();
  setChatSocket(socket);
  const messages = [{ from: null, text: 'Ada joined', ts: 1 }];
  const panel = chatPanel(messages);
  const list = panel.children[1];
  const input = panel.children[2].children[0];
  const inputAgain = chatPanel(messages).children[2].children[0];
  assert.equal(list.children[0].props.class, 'chat-message system-message');
  assert.equal(Object.hasOwn(input.props, 'value'), false);
  assert.equal(input.props.onKeyDown, inputAgain.props.onKeyDown);

  const target = { value: '  hello  ', blur() {} };
  let stopped = false;
  let prevented = false;
  input.props.onKeyDown({
    key: 'Enter',
    target,
    stopPropagation() { stopped = true; },
    preventDefault() { prevented = true; }
  });
  assert.equal(stopped, true);
  assert.equal(prevented, true);
  assert.equal(target.value, '');
  assert.deepEqual(socket.sent, [{ type: 'chat', data: { text: 'hello' } }]);
  setChatSocket(null);
});

test('nickname, lobby, and result screens expose required states', () => {
  let joined = null;
  const nickname = nicknameScreen({
    connection: 'closed',
    phase: 'playing',
    me: { nickname: 'Ada' },
    error: { code: 'GAME_IN_PROGRESS', message: 'Game running' }
  }, (value) => { joined = value; });
  const form = nickname.children[2];
  const input = form.children[1];
  assert.equal(input.props.maxlength, '12');
  assert.equal(input.props.value, 'Ada');
  assert.equal(form.children[2].props.disabled, true);
  assert.equal(nickname.children[4].children[0], 'A game is in progress. You can join when it ends.');
  form.props.onSubmit({
    preventDefault() {},
    currentTarget: { elements: { namedItem: () => ({ value: '  Ada  ' }) } }
  });
  assert.equal(joined, 'Ada');

  const lobby = lobbyScreen({
    lobby: {
      count: 2,
      max: 4,
      players: ['Ada', 'Bob'],
      timer: { kind: 'wait', secondsLeft: 13 }
    }
  }, { type: 'section', props: {}, children: [] });
  assert.equal(lobby.children[0].children[2].children[0], 'Players 2 / 4');
  assert.equal(
    lobby.children[0].children[3].children[0],
    'Waiting for more players… Countdown begins in 13s'
  );
  assert.equal(lobby.children[0].children[4].children.length, 2);

  const result = overScreen({
    result: {
      winner: 1,
      players: [
        { slot: 0, nickname: 'Ada', lives: 0 },
        { slot: 1, nickname: 'Bob', lives: 1 }
      ]
    }
  }, () => {});
  assert.equal(result.children[1].children[0], 'Bob wins!');
  assert.equal(result.children[2].children[2].children.length, 2);
});
