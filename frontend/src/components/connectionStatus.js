import { connect, on } from "../services/websocket.js";

export function initConnectionStatus() {
  const banner = document.querySelector("#connection-banner");

  if (!banner) return () => {};

  const text = banner.querySelector(".connection-banner__text");

  function updateStatus(status, message) {
    banner.classList.remove(
      "is-connecting",
      "is-connected",
      "is-disconnected",
      "is-error",
    );

    banner.classList.add(`is-${status}`);
    text.textContent = message;
  }

  // Subscribe before connecting so we don't miss events.
  const unsubscribeConnection = on("connection", ({ status }) => {
    if (status === "connected") {
      updateStatus("connected", "Connected to game server");
    } else {
      updateStatus("disconnected", "Disconnected from game server");
    }
  });

  const unsubscribeError = on("error", () => {
    updateStatus("error", "Connection error — check your server");
  });

  const socket = connect();

  // connect() may reuse an existing connection.
  if (socket.readyState === WebSocket.OPEN) {
    updateStatus("connected", "Connected to game server");
  } else if (socket.readyState === WebSocket.CONNECTING) {
    updateStatus("connecting", "Connecting to game server...");
  } else {
    updateStatus("disconnected", "Disconnected from game server");
  }

  // Clean up listeners when leaving the lobby.
  return () => {
    unsubscribeConnection();
    unsubscribeError();
  };
}
