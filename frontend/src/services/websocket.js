const WS_URL = "ws://localhost:8080/api/ws";

let socket = null;
const listeners = new Map();

export function connect() {
  // Reuse the existing connection.
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return socket;
  }

  socket = new WebSocket(WS_URL);

  socket.addEventListener("open", () => {
    emit("connection", { status: "connected" });
    console.log("WebSocket connected");
  });

  socket.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data);

      emit(message.type, message.payload);
      emit("message", message);
    } catch (error) {
      console.error("Invalid WebSocket message:", error);
    }
  });

  socket.addEventListener("close", (e) => {
    emit("connection ", { status: "disconnected" });
    console.log("WebSocket disconnected" ,e);
    socket = null;
  });

  socket.addEventListener("error", (error) => {
    emit("error", error);
  });

  return socket;
}

export function send(type, payload = {}) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("WebSocket is not connected");
    return false;
  }

  socket.send(JSON.stringify({ type, payload }));
  return true;
}

export function on(eventName, callback) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set());
  }

  listeners.get(eventName).add(callback);

  // Return an unsubscribe function.
  return () => {
    listeners.get(eventName)?.delete(callback);
  };
}

function emit(eventName, data) {
  for (const callback of listeners.get(eventName) || []) {
    try {
      callback(data);
    } catch (error) {
      console.error(`WebSocket listener "${eventName}" failed:`, error);
    }
  }
}

export function disconnect() {
  if (!socket) return;

  const currentSocket = socket;
  socket = null;
  currentSocket.close();
}
