import http from "node:http";
import { Server } from "socket.io";

const httpServer = http.createServer();

const ws = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

ws.on("connection", (socket) => {
  console.log("client is conected");

  socket.on("disconnect", () => {
    console.log("clinets is disconected", socket.id);
  });
});
