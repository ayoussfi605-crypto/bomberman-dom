import { on } from "./websocket.js";
import { notify } from "../components/Notification.js";

let cleanupListeners = [];

export function initWebSocketNotifications() {
  cleanupListeners.forEach((unsubscribe) => unsubscribe());
  cleanupListeners = [];

  cleanupListeners.push(
    on("connection", ({ status }) => {
      if (status === "disconnected") {
        notify("Connection lost. Check your server.", "error", 0);
      } else if (status === "connected") {
        notify("Connected to the game server!", "success");
      }
    }),
  );

  cleanupListeners.push(
    on("error", () => {
      notify("WebSocket connection error.", "error", 0);
    }),
  );

  return () => {
    cleanupListeners.forEach((unsubscribe) => unsubscribe());
    cleanupListeners = [];
  };
}
