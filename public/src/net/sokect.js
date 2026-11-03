let ws = null;

let status = "closed";

const handlers = new Map();
const statusHandlers = new Set();

// ==============================
// CONNECT
// ==============================

export function connect() {
  // Prevent duplicate connections
  if (
    ws &&
    (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)
  ) {
    return;
  }

  console.log("WebSocket connection starting...");

  updateStatus("connecting");

  // Dynamic WebSocket URL
  const protocol = location.protocol === "https:" ? "wss" : "ws";

  const socket = new WebSocket(`ws://localhost:8080`);

  ws = socket;

  // Connection opened
  socket.onopen = () => {
    if (ws !== socket) return;

    updateStatus("open");

    console.log("WebSocket connected");
  };

  // Receive messages
  socket.onmessage = (event) => {
    if (ws !== socket) return;

    try {
      const message = JSON.parse(event.data);

      if (
        !message ||
        typeof message !== "object" ||
        typeof message.type !== "string"
      ) {
        return;
      }

      const callbacks = handlers.get(message.type);

      if (!callbacks) return;

      for (const callback of callbacks) {
        try {
          callback(message.data);
        } catch (error) {
          console.error("Message handler error:", error);
        }
      }
    } catch (error) {
      console.error("Invalid WebSocket message:", error);
    }
  };

  // Connection error
  socket.onerror = () => {
    if (ws !== socket) return;

    console.error("WebSocket connection error");
  };

  // Connection closed
  socket.onclose = () => {
    if (ws !== socket) return;

    ws = null;

    updateStatus("closed");

    console.log("WebSocket disconnected");
  };
}

// ==============================
// UPDATE STATUS
// ==============================

function updateStatus(newStatus) {
  if (status === newStatus) return;

  status = newStatus;

  for (const callback of statusHandlers) {
    try {
      callback(status);
    } catch (error) {
      console.error("Status handler error:", error);
    }
  }
}

// ==============================
// ON STATUS
// ==============================

export function onStatus(callback) {
  statusHandlers.add(callback);

  // Immediately provide current status
  callback(status);

  return () => {
    statusHandlers.delete(callback);
  };
}

// ==============================
// ON MESSAGE
// ==============================

export function on(type, callback) {
  if (!handlers.has(type)) {
    handlers.set(type, new Set());
  }

  handlers.get(type).add(callback);

  return () => {
    const callbacks = handlers.get(type);

    if (!callbacks) return;

    callbacks.delete(callback);

    // Remove empty event sets
    if (callbacks.size === 0) {
      handlers.delete(type);
    }
  };
}

// ==============================
// SEND MESSAGE
// ==============================

export function send(type, data) {
  if (!ws) {
    console.warn("WebSocket does not exist");
    return;
  }

  if (ws.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket is not open");
    return;
  }

  try {
    ws.send(JSON.stringify({ type, data }));
  } catch (error) {
    console.error("WebSocket send error:", error);
  }
}

// ==============================
// CLOSE CONNECTION
// ==============================

export function close() {
  if (!ws) return;

  const socket = ws;

  ws = null;

  socket.close();
}
