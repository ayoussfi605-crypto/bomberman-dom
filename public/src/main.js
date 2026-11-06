import { createSocket } from './net/socket.js';
import { createFakeSocket } from './net/fakeSocket.js';
import { initUI } from './ui/index.js';
import { store } from './state/store.js';

const socket = new URLSearchParams(location.search).has('fake')
  ? createFakeSocket()
  : createSocket();

socket.onStatus((connection) => store.setState({ connection }));
initUI({ socket, store });
socket.connect();