import { WebSocketServer } from "ws";
import { handleMessage } from "../shared/messagesHadler";
import { HandleJoin } from "../shared/joinHandler";

const wss = new WebSocketServer({ port: 8080 });

console.log("server running on port 8080");

wss.on("connection", (ws) => {
  console.log("Client connected!");

  ws.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage);

      switch (message.type) {
        case "join":
          HandleJoin(message.data);
          break; // <-- Added missing break!

        case "message":
          handleMessage(message.data, ws, wss);
          break;

        default:
          console.warn("Unknown message type:", message.type);
          break;
      }
    } catch (error) {
      console.error("Invalid JSON received:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
