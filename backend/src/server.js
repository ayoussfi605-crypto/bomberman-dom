import http from "node:http";
import { Server } from "socket.io";
import {
  getPlayers,
  registerPlayer,
  StartCounterDown,
  players,
} from "./lobby/PlayerManager.js";
import { HandleCounterEnd } from "./utils/handleCounterEnd.js";
import { HandlePlayerMove } from "./utils/handlePlayerMovments.js";
import { HandlePlayerJoin } from "./utils/handlePlayerJoin.js";

const httpServer = http.createServer();
const PORT = 8080;

const ws = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

ws.on("connection", (socket) => {
  // save the player in map of player
  socket.on("player:join", (data) => {
    HandlePlayerJoin(socket, data);
  });

  // whne the clinte send the req of the counter end i send map data and start play event
  socket.on("counter:end", HandleCounterEnd(socket));

  // func movments event => need to implment
  socket.on("player:move", (data) => {
    HandlePlayerMove(socket, data);
  });

  // whe user refresh or close his tab i remove the player from teh map players
  socket.on("disconnect", () => {
    players.delete(socket.id);
    ws.emit("lobby:players", getPlayers());
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
