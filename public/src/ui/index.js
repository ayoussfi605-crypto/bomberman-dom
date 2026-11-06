import { initNetHandlers } from './netHandlers.js';
import { initChatScroll } from './chatScroll.js';
import { initRenderer } from './render.js';
import { setChatSocket } from './components/chatPanel.js';

export function initUI({ socket, store }) {
  setChatSocket(socket);
  const network = initNetHandlers({ socket, store });
  const stopChatScroll = initChatScroll(store);
  const stopRender = initRenderer(store, {
    onJoin: (nickname) => network.join(nickname),
    onReplay: () => {
      const nickname = store.getState().me?.nickname;
      if (nickname) network.join(nickname);
    }
  });

  return () => {
    stopRender();
    stopChatScroll();
    network.cleanup();
    setChatSocket(null);
  };
}
