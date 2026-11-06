export function initChatScroll(store) {
  let previousChat = store.getState().chat;
  let frame = null;
  const unsubscribe = store.subscribe((state) => {
    if (state.chat === previousChat) return;
    previousChat = state.chat;

    if (frame !== null) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = null;
      const log = document.getElementById('chat-log');
      if (log) log.scrollTop = log.scrollHeight;
    });
  });

  return () => {
    unsubscribe();
    if (frame !== null) cancelAnimationFrame(frame);
  };
}
