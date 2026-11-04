// public/src/net/socket.js
// Client WebSocket service. API contract: docs/ARCHITECTURE.md §7.2.
// No auto-reconnect on purpose: a refresh is a new session.

export function createSocket({ url } = {}) {
  const handlers = new Map();
  const statusHandlers = new Set();

  let ws = null;
  let status = "closed";

  const CONNECTING = 0;
  const OPEN = 1;

  function resolveUrl() {
    if (url) return url;
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${location.host}`;
  }

  function setStatus(next) {
    if (status === next) return;
    status = next;
    for (const callback of [...statusHandlers]) {
      try {
        callback(status);
      } catch (error) {
        console.error("[socket] status handler failed:", error);
      }
    }
  }

  function dispatch(type, data) {
    const callbacks = handlers.get(type);
    if (!callbacks) return;
    for (const callback of [...callbacks]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`[socket] "${type}" handler failed:`, error);
      }
    }
  }

  function connect() {
    if (ws && (ws.readyState === CONNECTING || ws.readyState === OPEN)) return;

    setStatus("connecting");

    const socket = new WebSocket("ws://localhost:8080/");
    ws = socket;

    socket.onopen = () => {
      if (ws !== socket) return;
      setStatus("open");
    };

    socket.onmessage = (event) => {
      if (ws !== socket) return;

      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return; // ignore malformed frames
      }

      if (
        !message ||
        typeof message !== "object" ||
        typeof message.type !== "string"
      )
        return;

      dispatch(message.type, message.data);
    };

    socket.onerror = () => {
      // The close event that follows drives the status change.
    };

    socket.onclose = () => {
      if (ws !== socket) return;
      ws = null;
      setStatus("closed");
    };
  }

  function send(type, data) {
    if (!ws || ws.readyState !== OPEN) {
      console.warn(`[socket] dropped "${type}": the connection is not open`);
      return;
    }
    try {
      ws.send(JSON.stringify({ type, data }));
    } catch (error) {
      console.warn(`[socket] could not send "${type}":`, error);
    }
  }

  function on(type, callback) {
    if (!handlers.has(type)) handlers.set(type, new Set());
    handlers.get(type).add(callback);

    return () => {
      const callbacks = handlers.get(type);
      if (!callbacks) return;
      callbacks.delete(callback);
      if (callbacks.size === 0) handlers.delete(type);
    };
  }

  function onStatus(callback) {
    statusHandlers.add(callback);

    try {
      callback(status); // called immediately with the current status
    } catch (error) {
      console.error("[socket] status handler failed:", error);
    }

    return () => {
      statusHandlers.delete(callback);
    };
  }

  function close() {
    const socket = ws;
    ws = null;
    if (socket) {
      try {
        socket.close();
      } catch {
        // Already closed.
      }
    }
    setStatus("closed");
  }

  return {
    connect,
    send,
    on,
    onStatus,
    close,
    get status() {
      return status;
    },
  };
}
