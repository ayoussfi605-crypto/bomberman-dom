import http from "node:http";
import { Server } from "socket.io";

import {
  registerPlayer,
  removePlayer,
  getPlayers,
} from "./lobby/PlayerManager.js";

const httpServer = http.createServer();
const PORT = 8080;

const ws = new Server(httpServer, {
  cors: {
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST"],
  },
});

ws.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("player:join", (nickname) => {
    const result = registerPlayer(socket, nickname);

    if (!result.success) {
      socket.emit("player:error", result.message);
      return;
    }

    socket.emit("player:joined", result.player);

    ws.emit("lobby:players", getPlayers());
  });

  socket.on("disconnect", () => {
    removePlayer(socket.id);

    ws.emit("lobby:players", getPlayers());

    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
