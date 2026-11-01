import http from "node:http";
import { Server } from "socket.io";
import {
  getPlayers,
  removePlayer,
  registerPlayer,
  StartCounterDown,
  players,
  tokens,
} from "./lobby/PlayerManager.js";

const httpServer = http.createServer();
const PORT = 8080;

const ws = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

ws.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("player:join", (data) => {
    HandlePlayerJoin(socket, data);
  });
  socket.on("player:reconnect", (data) => {
    HandlePlayerReconnect(socket, data);
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

function HandlePlayerJoin(socket, data) {
  const result = registerPlayer(socket, data.username, data.playerId);

  if (!result.success) {
    socket.emit("player:error", result.message);
    return;
  }

  socket.data.playerId = result.response.player.playerId;

  socket.emit("player:joined", result.response);

  ws.emit("lobby:players", getPlayers());

  const counter = StartCounterDown();

  if (counter.success) {
    ws.emit("lobby:count", counter.counter);
  }
  console.log(players, tokens);
}

function HandlePlayerReconnect(socket, data) {
  console.log("reconect", tokens);
  console.log(data);
  console.log(tokens.get(data.token));

  const playerId = tokens.get(data.token);

  if (!playerId) {
    socket.emit("player:error", "Invalid token");
    return;
  }

  console.log(playerId);

  const player = players.get(playerId);

  if (!player) {
    console.log("not found", playerId);

    socket.emit("player:error", "Player not found");
    return;
  }

  // Update socket connection
  player.socketId = socket.id;
  player.connected = true;

  socket.data.playerId = playerId;

  socket.emit("player:reconnected", {
    playerId: player.playerId,
    name: player.name,
    lives: player.lives,
  });

  ws.emit("lobby:players", getPlayers());

  console.log("reconect finle ", tokens);
}
