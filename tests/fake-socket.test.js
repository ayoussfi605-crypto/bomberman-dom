import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeSocket } from '../public/src/net/fakeSocket.js';

test('fake socket plays lobby, sample match, result, and replayable reset', async () => {
  const socket = createFakeSocket({
    botEveryMs: 5,
    waitMs: 5,
    countdownMs: 5,
    matchMs: 60,
    timerTickMs: 2
  });
  const received = [];
  for (const type of ['hello', 'joined', 'lobby', 'chat', 'start', 'snapshot', 'gameover']) {
    socket.on(type, (data) => received.push({ type, data }));
  }

  socket.connect();
  socket.send('join', { nickname: 'Ada' });
  socket.send('chat', { text: 'Hello' });
  await new Promise((resolve) => setTimeout(resolve, 150));

  assert.ok(received.some(({ type }) => type === 'joined'));
  assert.ok(received.some(({ type }) => type === 'chat'));
  assert.ok(received.some(({ type, data }) => type === 'lobby' && data.timer?.kind === 'wait'));
  assert.ok(received.some(({ type, data }) => type === 'lobby' && data.timer?.kind === 'start'));
  assert.ok(received.some(({ type, data }) => type === 'start' && data.tiles.length === 195));
  assert.ok(received.some(({ type }) => type === 'snapshot'));
  assert.ok(received.some(({ type, data }) => type === 'gameover' && data.players[0].lives === 2));
  assert.equal(received.at(-1).type, 'hello');

  socket.send('join', { nickname: 'Ada' });
  assert.equal(received.at(-1).type, 'lobby');
  assert.ok(received.some(({ type }) => type === 'joined'));
  socket.close();
  assert.equal(socket.status, 'closed');
});
