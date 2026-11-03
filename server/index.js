import { WebSocketServer } from "ws";

const socket = new WebSocketServer({ port: 8080 });

console.log("server runing on port 8080");

socket.on("connection", (ws) => {
  console.log("conection");

  ws.on("message", (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage);

      switch (data.type) {
        case "join":
          HandleJoin(data.data);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Invalid JSON received:", error);
    }
  });
});

function HandleJoin(data) {
  console.log(data.name);
}
